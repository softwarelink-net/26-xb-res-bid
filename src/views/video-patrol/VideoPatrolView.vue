<script setup lang="ts">
import { onMounted, ref } from 'vue'
import {
  getIntrusionAlarms,
  triggerBroadcast,
  updateAlarmStatus,
  type IntrusionAlarm,
} from '@/utils/sqljs-engine'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const alarms = ref<IntrusionAlarm[]>([])
const selectedCam = ref('CAM-XB-PTZ-001')
const ptzMsg = ref('')
const broadcastMsg = ref('')

const cameras = [
  'CAM-XB-PTZ-001',
  'CAM-XB-PTZ-002',
  'CAM-XB-PTZ-003',
  'CAM-XB-PTZ-004',
  'CAM-XB-GUN-005',
  'CAM-XB-GUN-006',
  'CAM-XB-THERM-007',
  'CAM-XB-GATE-008',
  'CAM-XB-GATE-009',
]

const targetLabels: Record<string, string> = {
  PERSON_TRESPASS: '人员越界',
  FISHING_ILLEGAL: '非法垂钓',
  VEHICLE_INTRUSION: '车辆闯入',
  FENCE_CUTTING: '破网攀爬',
}

function reload() {
  alarms.value = getIntrusionAlarms()
  auth.refreshHeaderStats()
}

function movePtz(dir: string) {
  ptzMsg.value = `${selectedCam.value} PTZ → ${dir}`
  setTimeout(() => (ptzMsg.value = ''), 2000)
}

function onBroadcast() {
  triggerBroadcast(selectedCam.value, auth.user || undefined)
  broadcastMsg.value = `已向 ${selectedCam.value} 联动高音喇叭喊话驱离`
  setTimeout(() => (broadcastMsg.value = ''), 3000)
}

function confirmAlarm(a: IntrusionAlarm, status: string) {
  updateAlarmStatus(a.id, status, auth.user || undefined)
  reload()
}

onMounted(reload)
</script>

<template>
  <div class="page">
    <div>
      <h1 class="page-title">全天候视频 AI 联动巡查工作台</h1>
      <p class="page-desc">九宫格预览 · PTZ 云台 · 广播声光驱离 · 违规抓拍比对</p>
    </div>

    <div class="layout">
      <div class="panel grid-wrap">
        <div class="cam-grid">
          <button
            v-for="cam in cameras"
            :key="cam"
            type="button"
            class="cam-cell"
            :class="{ active: selectedCam === cam }"
            @click="selectedCam = cam"
          >
            <div class="scan" />
            <div class="cam-id">{{ cam }}</div>
            <div class="cam-state">LIVE · AI</div>
          </button>
        </div>
      </div>

      <div class="side">
        <div class="panel ptz">
          <div class="panel-title">PTZ 控制台 · {{ selectedCam }}</div>
          <div class="ptz-pad">
            <button type="button" class="btn-ghost" @click="movePtz('UP')">↑</button>
            <div class="mid">
              <button type="button" class="btn-ghost" @click="movePtz('LEFT')">←</button>
              <button type="button" class="btn-primary" @click="movePtz('HOME')">归位</button>
              <button type="button" class="btn-ghost" @click="movePtz('RIGHT')">→</button>
            </div>
            <button type="button" class="btn-ghost" @click="movePtz('DOWN')">↓</button>
          </div>
          <div class="zoom">
            <button type="button" class="btn-ghost" @click="movePtz('ZOOM+')">变焦 +</button>
            <button type="button" class="btn-ghost" @click="movePtz('ZOOM-')">变焦 −</button>
          </div>
          <p v-if="ptzMsg" class="hint">{{ ptzMsg }}</p>
          <button class="btn-primary w-full mt-3" type="button" @click="onBroadcast">
            一键广播喊话驱离
          </button>
          <p v-if="broadcastMsg" class="hint ok">{{ broadcastMsg }}</p>
        </div>

        <div class="panel snaps">
          <div class="panel-title mb-2">违规目标抓拍比对</div>
          <div v-for="a in alarms.slice(0, 4)" :key="a.id" class="snap-card">
            <div class="thumb">AI SNAP</div>
            <div class="meta">
              <div class="text-sm text-emerald-50">
                {{ targetLabels[a.target_type] }} · {{ (a.ai_confidence_score * 100).toFixed(0) }}%
              </div>
              <div class="text-[11px] text-emerald-200/50">{{ a.alarm_no }} · {{ a.camera_code }}</div>
              <div class="row-actions">
                <button class="btn-ghost" type="button" @click="confirmAlarm(a, 'CONFIRMED_EXPELLED')">
                  确认驱离
                </button>
                <button class="btn-ghost" type="button" @click="confirmAlarm(a, 'FALSE_ALARM')">
                  误报
                </button>
                <button class="btn-ghost" type="button" @click="confirmAlarm(a, 'INSPECTING')">
                  派查
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
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
.layout {
  display: grid;
  grid-template-columns: 1.4fr 0.9fr;
  gap: 0.75rem;
}
.grid-wrap,
.ptz,
.snaps {
  padding: 1rem;
}
.cam-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.55rem;
}
.cam-cell {
  position: relative;
  aspect-ratio: 16 / 10;
  border-radius: 10px;
  border: 1px solid rgba(52, 211, 153, 0.2);
  background:
    linear-gradient(160deg, rgba(8, 47, 73, 0.9), rgba(2, 44, 34, 0.95)),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 6px,
      rgba(52, 211, 153, 0.04) 6px,
      rgba(52, 211, 153, 0.04) 7px
    );
  overflow: hidden;
  cursor: pointer;
  text-align: left;
  color: #ecfdf5;
}
.cam-cell.active {
  box-shadow: 0 0 0 2px #34d399;
}
.scan {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent, rgba(56, 189, 248, 0.12), transparent);
  animation: scan 3s linear infinite;
}
@keyframes scan {
  from {
    transform: translateY(-100%);
  }
  to {
    transform: translateY(100%);
  }
}
.cam-id {
  position: absolute;
  left: 8px;
  bottom: 8px;
  font-size: 11px;
  font-family: ui-monospace, monospace;
}
.cam-state {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 10px;
  color: #6ee7b7;
}
.side {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.ptz-pad {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}
.mid {
  display: flex;
  gap: 0.4rem;
  align-items: center;
}
.zoom {
  display: flex;
  gap: 0.4rem;
  justify-content: center;
  margin-top: 0.5rem;
}
.hint {
  margin: 0.5rem 0 0;
  font-size: 12px;
  color: #7dd3fc;
  text-align: center;
}
.hint.ok {
  color: #6ee7b7;
}
.snap-card {
  display: flex;
  gap: 0.65rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.thumb {
  width: 64px;
  height: 48px;
  border-radius: 6px;
  display: grid;
  place-items: center;
  font-size: 10px;
  background: linear-gradient(135deg, #0c4a6e, #064e3b);
  color: #a7f3d0;
  flex-shrink: 0;
}
.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.35rem;
}
@media (max-width: 980px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
