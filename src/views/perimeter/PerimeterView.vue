<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  getPerimeterZones,
  getIntrusionAlarms,
  getSystemConfigs,
  updateZoneArmStatus,
  maskCoord,
  type PerimeterZone,
  type IntrusionAlarm,
} from '@/utils/sqljs-engine'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const zones = ref<PerimeterZone[]>([])
const alarms = ref<IntrusionAlarm[]>([])
const sm4 = ref(true)
const toast = ref('')

const fenceLabel: Record<string, string> = {
  ANTI_CLIMB_WIRE_MESH: '358 防攀爬钢丝网',
  TENSION_PULSE_FENCE: '张力脉冲围栏',
  VIBRATION_FIBER_OPTIC: '振动光纤融合网',
}

const armLabel: Record<string, string> = {
  ARMED: '布防',
  DISARMED: '撤防',
  BYPASS_MAINTENANCE: '旁路维护',
}

const activeAlarmZones = computed(() => {
  const ids = new Set(
    alarms.value
      .filter((a) => a.status === 'PENDING' || a.status === 'INSPECTING')
      .map((a) => a.zone_id),
  )
  return ids
})

function reload() {
  zones.value = getPerimeterZones()
  alarms.value = getIntrusionAlarms()
  sm4.value =
    getSystemConfigs().find((c) => c.config_key === 'FEATURE_SM4_GEO_COORDINATES_MASKING')
      ?.config_value === 'true'
  auth.refreshHeaderStats()
}

function setArm(zone: PerimeterZone, status: string) {
  if (!auth.hasRole(['ROLE_SUPER_ADMIN', 'ROLE_WATER_DIRECTOR'])) {
    window.alert('仅超管/所长可变更布防状态')
    return
  }
  updateZoneArmStatus(zone.id, status, auth.user || undefined)
  toast.value = `${zone.zone_code} 已切换为 ${armLabel[status] || status}`
  setTimeout(() => (toast.value = ''), 2500)
  reload()
}

function displayCoord(coord: string) {
  return maskCoord(coord, sm4.value)
}

onMounted(reload)
</script>

<template>
  <div class="page">
    <div class="head-row">
      <div>
        <h1 class="page-title">周界防护网与防区电子拓扑</h1>
        <p class="page-desc">新坝水库约 12 km 隔离防护网 · A/B/C/D 防区桩号级定位</p>
      </div>
      <div v-if="toast" class="toast">{{ toast }}</div>
    </div>

    <div class="topo panel">
      <div class="topo-track">
        <div
          v-for="(z, idx) in zones"
          :key="z.id"
          class="zone-node"
          :class="{
            alert: activeAlarmZones.has(z.id),
            disarmed: z.arm_status !== 'ARMED',
          }"
        >
          <div class="stake">{{ z.start_stake_no }}</div>
          <div class="bar" :style="{ flex: Math.max(z.total_length_meters / 400, 1) }">
            <span class="zone-code">{{ String.fromCharCode(65 + idx) }} 防区 · {{ z.zone_code }}</span>
            <span class="len">{{ z.total_length_meters }} m</span>
          </div>
          <div class="stake end">{{ z.end_stake_no }}</div>
        </div>
      </div>
      <p class="legend">
        <span class="dot armed" /> 布防中
        <span class="dot alert" /> 存在未闭环告警
        <span class="dot bypass" /> 撤防/旁路
        <span v-if="sm4" class="ml-2 text-amber-200/70">SM4 坐标脱敏已启用</span>
      </p>
    </div>

    <div class="zone-grid">
      <article v-for="(z, idx) in zones" :key="z.id" class="panel zone-card" :class="{ alert: activeAlarmZones.has(z.id) }">
        <header>
          <div>
            <div class="code">{{ String.fromCharCode(65 + idx) }} · {{ z.zone_code }}</div>
            <h3>{{ z.zone_name }}</h3>
          </div>
          <span class="arm-badge" :data-status="z.arm_status">{{ armLabel[z.arm_status] }}</span>
        </header>
        <dl>
          <div><dt>桩号区间</dt><dd>{{ z.start_stake_no }} → {{ z.end_stake_no }}</dd></div>
          <div><dt>围栏类型</dt><dd>{{ fenceLabel[z.fence_type] || z.fence_type }}</dd></div>
          <div><dt>联动球机</dt><dd>{{ z.bound_camera_code }}</dd></div>
          <div>
            <dt>GPS 起讫</dt>
            <dd class="mono">{{ displayCoord(z.gps_start_coord) }} → {{ displayCoord(z.gps_end_coord) }}</dd>
          </div>
        </dl>
        <div class="actions">
          <button class="btn-ghost" type="button" @click="setArm(z, 'ARMED')">布防</button>
          <button class="btn-ghost" type="button" @click="setArm(z, 'DISARMED')">撤防</button>
          <button class="btn-ghost" type="button" @click="setArm(z, 'BYPASS_MAINTENANCE')">旁路</button>
        </div>
      </article>
    </div>

    <div v-if="activeAlarmZones.size" class="panel alert-box">
      <h2 class="panel-title">防区破坏 / 入侵告警高亮</h2>
      <ul>
        <li v-for="a in alarms.filter((x) => x.status === 'PENDING' || x.status === 'INSPECTING')" :key="a.id">
          <strong>{{ a.alarm_no }}</strong>
          {{ a.zone_name }} · {{ a.target_type }} · {{ a.camera_code }} · {{ a.triggered_at }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.page-title {
  margin: 0;
  font-size: 1.25rem;
  color: #ecfdf5;
}
.page-desc {
  margin: 0.25rem 0 0;
  font-size: 12px;
  color: rgba(167, 243, 208, 0.55);
}
.head-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}
.toast {
  font-size: 12px;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  background: rgba(16, 185, 129, 0.2);
  color: #a7f3d0;
}
.topo {
  padding: 1.25rem;
}
.topo-track {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.zone-node {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.stake {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: #7dd3fc;
  min-width: 58px;
}
.stake.end {
  text-align: right;
}
.bar {
  height: 42px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.85rem;
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.35), rgba(14, 165, 233, 0.25));
  border: 1px solid rgba(52, 211, 153, 0.35);
  min-width: 120px;
}
.zone-node.alert .bar {
  background: linear-gradient(90deg, rgba(248, 113, 113, 0.4), rgba(251, 146, 60, 0.3));
  border-color: rgba(248, 113, 113, 0.55);
  animation: pulse 1.4s ease infinite;
}
.zone-node.disarmed .bar {
  background: rgba(100, 116, 139, 0.35);
  border-color: rgba(148, 163, 184, 0.35);
}
.zone-code {
  font-size: 12px;
  font-weight: 600;
  color: #ecfdf5;
}
.len {
  font-size: 11px;
  color: rgba(236, 253, 245, 0.7);
}
@keyframes pulse {
  50% {
    filter: brightness(1.15);
  }
}
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: center;
  margin: 1rem 0 0;
  font-size: 11px;
  color: rgba(167, 243, 208, 0.6);
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 4px;
}
.dot.armed {
  background: #34d399;
}
.dot.alert {
  background: #f87171;
}
.dot.bypass {
  background: #94a3b8;
}
.zone-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}
.zone-card {
  padding: 1rem 1.1rem;
}
.zone-card.alert {
  box-shadow: 0 0 0 1px rgba(248, 113, 113, 0.45);
}
.zone-card header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}
.code {
  font-size: 11px;
  color: #7dd3fc;
  font-family: ui-monospace, monospace;
}
.zone-card h3 {
  margin: 0.2rem 0 0;
  font-size: 14px;
  color: #ecfdf5;
}
.arm-badge {
  align-self: flex-start;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
}
.arm-badge[data-status='DISARMED'],
.arm-badge[data-status='BYPASS_MAINTENANCE'] {
  background: rgba(148, 163, 184, 0.25);
  color: #cbd5e1;
}
dl {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
dl > div {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 0.5rem;
  font-size: 12px;
}
dt {
  color: rgba(167, 243, 208, 0.5);
}
dd {
  margin: 0;
  color: #d1fae5;
}
.mono {
  font-family: ui-monospace, monospace;
  font-size: 11px;
}
.actions {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.85rem;
}
.alert-box {
  padding: 1rem;
  border-color: rgba(248, 113, 113, 0.35) !important;
}
.alert-box ul {
  margin: 0.5rem 0 0;
  padding-left: 1.1rem;
  color: #fecaca;
  font-size: 13px;
  line-height: 1.7;
}
@media (max-width: 900px) {
  .zone-grid {
    grid-template-columns: 1fr;
  }
}
</style>
