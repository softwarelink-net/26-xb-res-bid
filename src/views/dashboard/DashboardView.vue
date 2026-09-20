<script setup lang="ts">
import { onMounted, onUnmounted, ref, computed } from 'vue'
import * as echarts from 'echarts'
import {
  getDashboardStats,
  getSystemConfigs,
  setSystemConfig,
  type DashboardStats,
} from '@/utils/sqljs-engine'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const stats = ref<DashboardStats | null>(null)
const flags = ref({ broadcast: true, sm4: true })

const levelChart = ref<HTMLDivElement | null>(null)
const pieChart = ref<HTMLDivElement | null>(null)
const radarChart = ref<HTMLDivElement | null>(null)
const gaugeChart = ref<HTMLDivElement | null>(null)
let charts: echarts.ECharts[] = []

const targetLabels: Record<string, string> = {
  PERSON_TRESPASS: '人员越界',
  FISHING_ILLEGAL: '非法垂钓',
  VEHICLE_INTRUSION: '车辆闯入',
  FENCE_CUTTING: '破网攀爬',
}

const categoryLabels: Record<string, string> = {
  FENCE_DAMAGED: '护网破损',
  WARNING_SIGN_LOST: '警示牌倾倒',
  WATER_POLLUTION: '水面污染',
  DROWNING_RISK: '溺水险情',
}

const marginToFlood = computed(() => {
  if (!stats.value) return 0
  return +(stats.value.floodLimit - stats.value.waterLevel).toFixed(2)
})

function loadFlags() {
  const configs = getSystemConfigs()
  flags.value.broadcast =
    configs.find((c) => c.config_key === 'FEATURE_AUTO_SPEAKER_BROADCAST')?.config_value === 'true'
  flags.value.sm4 =
    configs.find((c) => c.config_key === 'FEATURE_SM4_GEO_COORDINATES_MASKING')?.config_value ===
    'true'
}

function toggleFlag(key: 'broadcast' | 'sm4') {
  if (auth.user?.role !== 'ROLE_SUPER_ADMIN' && auth.user?.role !== 'ROLE_WATER_DIRECTOR') {
    window.alert('仅超管/所长可切换 Feature Flags')
    return
  }
  if (key === 'broadcast') {
    flags.value.broadcast = !flags.value.broadcast
    setSystemConfig(
      'FEATURE_AUTO_SPEAKER_BROADCAST',
      String(flags.value.broadcast),
      auth.user || undefined,
    )
  } else {
    flags.value.sm4 = !flags.value.sm4
    setSystemConfig(
      'FEATURE_SM4_GEO_COORDINATES_MASKING',
      String(flags.value.sm4),
      auth.user || undefined,
    )
  }
}

function renderCharts() {
  if (!stats.value) return
  charts.forEach((c) => c.dispose())
  charts = []

  if (levelChart.value) {
    const c = echarts.init(levelChart.value)
    const series = stats.value.hydrologySeries
    c.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      legend: { data: ['库水位(m)', '蓄水量(万m³)'], textStyle: { color: '#a7f3d0' }, top: 0 },
      grid: { left: 48, right: 48, top: 36, bottom: 28 },
      xAxis: {
        type: 'category',
        data: series.map((h) => String(h.sampled_at).slice(5, 16)),
        axisLabel: { color: '#6ee7b7', fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(52,211,153,0.3)' } },
      },
      yAxis: [
        {
          type: 'value',
          name: '水位',
          min: 482,
          max: 486,
          axisLabel: { color: '#94a3b8' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        },
        {
          type: 'value',
          name: '库容',
          axisLabel: { color: '#94a3b8' },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: '库水位(m)',
          type: 'line',
          smooth: true,
          data: series.map((h) => h.water_level_meters),
          itemStyle: { color: '#38bdf8' },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(56,189,248,0.35)' },
              { offset: 1, color: 'rgba(56,189,248,0.02)' },
            ]),
          },
          markLine: {
            symbol: 'none',
            data: [{ yAxis: stats.value.floodLimit, name: '汛限' }],
            lineStyle: { color: '#fb923c', type: 'dashed' },
            label: { color: '#fdba74', formatter: '汛限 {c}m' },
          },
        },
        {
          name: '蓄水量(万m³)',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          data: series.map((h) => h.storage_capacity_m3),
          itemStyle: { color: '#34d399' },
        },
      ],
    })
    charts.push(c)
  }

  if (pieChart.value) {
    const c = echarts.init(pieChart.value)
    c.setOption({
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item' },
      series: [
        {
          type: 'pie',
          radius: ['42%', '68%'],
          label: { color: '#d1fae5', fontSize: 11 },
          data: stats.value.alarmByType.map((d, i) => ({
            ...d,
            itemStyle: {
              color: ['#38bdf8', '#fbbf24', '#f87171', '#34d399'][i % 4],
            },
          })),
        },
      ],
    })
    charts.push(c)
  }

  if (radarChart.value) {
    const c = echarts.init(radarChart.value)
    c.setOption({
      backgroundColor: 'transparent',
      radar: {
        indicator: [
          { name: '北岸防区', max: 100 },
          { name: '大坝防区', max: 100 },
          { name: '南岸防区', max: 100 },
          { name: '东岸卡口', max: 100 },
          { name: '视频覆盖', max: 100 },
          { name: '广播联动', max: 100 },
        ],
        axisName: { color: '#a7f3d0', fontSize: 11 },
        splitArea: { areaStyle: { color: ['rgba(16,185,129,0.04)', 'rgba(16,185,129,0.08)'] } },
      },
      series: [
        {
          type: 'radar',
          data: [
            {
              value: [92, 88, 85, 90, 96, 94],
              name: '安全指数',
              areaStyle: { color: 'rgba(52,211,153,0.25)' },
              lineStyle: { color: '#34d399' },
              itemStyle: { color: '#6ee7b7' },
            },
          ],
        },
      ],
    })
    charts.push(c)
  }

  if (gaugeChart.value) {
    const c = echarts.init(gaugeChart.value)
    c.setOption({
      backgroundColor: 'transparent',
      series: [
        {
          type: 'gauge',
          min: 0,
          max: 100,
          progress: { show: true, width: 12 },
          axisLine: { lineStyle: { width: 12, color: [[1, 'rgba(255,255,255,0.08)']] } },
          axisTick: { show: false },
          splitLine: { length: 8, lineStyle: { color: '#64748b' } },
          axisLabel: { color: '#94a3b8', distance: 12, fontSize: 10 },
          pointer: { length: '55%', width: 4 },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            color: '#ecfdf5',
            fontSize: 18,
            offsetCenter: [0, '70%'],
          },
          data: [{ value: stats.value.deviceOnlineRate, name: '设备在线率' }],
          title: { offsetCenter: [0, '92%'], color: '#a7f3d0', fontSize: 12 },
          itemStyle: { color: '#38bdf8' },
        },
      ],
    })
    charts.push(c)
  }
}

function onResize() {
  charts.forEach((c) => c.resize())
}

onMounted(() => {
  stats.value = getDashboardStats()
  loadFlags()
  auth.refreshHeaderStats()
  requestAnimationFrame(renderCharts)
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  charts.forEach((c) => c.dispose())
})
</script>

<template>
  <div v-if="stats" class="dash">
    <div class="kpi-row">
      <div class="kpi panel">
        <div class="kpi-label">当前库水位</div>
        <div class="kpi-value text-sky-300">{{ stats.waterLevel.toFixed(2) }} <small>m</small></div>
        <div class="kpi-hint">距汛限 {{ marginToFlood }} m</div>
      </div>
      <div class="kpi panel">
        <div class="kpi-label">蓄水量</div>
        <div class="kpi-value text-emerald-300">{{ stats.storage.toFixed(1) }} <small>万m³</small></div>
        <div class="kpi-hint">测站 STN-XB-DAM-01</div>
      </div>
      <div class="kpi panel">
        <div class="kpi-label">周界布防</div>
        <div class="kpi-value">{{ stats.armedZones }}/{{ stats.totalZones }}</div>
        <div class="kpi-hint">防区已布防</div>
      </div>
      <div class="kpi panel">
        <div class="kpi-label">未闭环报警</div>
        <div class="kpi-value text-rose-300">{{ stats.pendingAlarms }}</div>
        <div class="kpi-hint">开放隐患 {{ stats.openIncidents }}</div>
      </div>
      <div class="kpi panel">
        <div class="kpi-label">巡查出勤率</div>
        <div class="kpi-value text-amber-200">{{ stats.patrolAttendanceRate }}%</div>
        <div class="kpi-hint">库区一线值守</div>
      </div>
    </div>

    <div class="chart-grid">
      <div class="panel chart-wide">
        <div class="panel-title mb-2">24 小时水位 · 蓄水量走势</div>
        <div ref="levelChart" class="chart-box h-64" />
      </div>
      <div class="panel">
        <div class="panel-title mb-2">周界入侵类型构成</div>
        <div ref="pieChart" class="chart-box h-64" />
      </div>
      <div class="panel">
        <div class="panel-title mb-2">重点防区安全指数</div>
        <div ref="radarChart" class="chart-box h-64" />
      </div>
      <div class="panel">
        <div class="panel-title mb-2">物联设备在线连通率</div>
        <div ref="gaugeChart" class="chart-box h-64" />
      </div>
    </div>

    <div class="bottom-grid">
      <div class="panel feed">
        <div class="panel-title mb-3">实时报警 / 喊话劝离滚动</div>
        <div v-for="a in stats.recentAlarms" :key="a.id" class="feed-item">
          <span class="tag" :class="a.alarm_level">{{ a.alarm_no }}</span>
          <div class="flex-1 min-w-0">
            <div class="text-sm text-emerald-50 truncate">
              {{ targetLabels[a.target_type] || a.target_type }} · {{ a.zone_name }}
            </div>
            <div class="text-[11px] text-emerald-200/50">
              {{ a.camera_code }} · 置信度 {{ (a.ai_confidence_score * 100).toFixed(0) }}%
              <span v-if="a.broadcast_triggered"> · 已联动广播</span>
            </div>
          </div>
          <span class="status">{{ a.status }}</span>
        </div>
      </div>

      <div class="panel feed">
        <div class="panel-title mb-3">护网修缮 / 巡查闭环归档</div>
        <div v-for="inc in stats.recentIncidents" :key="inc.id" class="feed-item">
          <span class="tag LEVEL_BLUE_INFO">{{ inc.incident_no }}</span>
          <div class="flex-1 min-w-0">
            <div class="text-sm text-emerald-50 truncate">
              {{ categoryLabels[inc.incident_category] || inc.incident_category }} ·
              {{ inc.stake_location }}
            </div>
            <div class="text-[11px] text-emerald-200/50 truncate">
              {{ inc.repair_action_desc || '待处置' }}
            </div>
          </div>
          <span class="status">{{ inc.disposition_status }}</span>
        </div>
      </div>

      <div class="panel flags">
        <div class="panel-title mb-3">Feature Flags</div>
        <label class="flag-row">
          <span>
            <strong>智能广播自动触发</strong>
            <small>AI 识别越界后自动喊话</small>
          </span>
          <button
            type="button"
            class="toggle"
            :class="{ on: flags.broadcast }"
            @click="toggleFlag('broadcast')"
          >
            {{ flags.broadcast ? 'ON' : 'OFF' }}
          </button>
        </label>
        <label class="flag-row">
          <span>
            <strong>国密 SM4 坐标脱敏</strong>
            <small>隐蔽传感器经纬度动态脱敏</small>
          </span>
          <button type="button" class="toggle" :class="{ on: flags.sm4 }" @click="toggleFlag('sm4')">
            {{ flags.sm4 ? 'ON' : 'OFF' }}
          </button>
        </label>
        <p class="mt-4 text-[11px] leading-relaxed text-emerald-200/45">
          数据前缀 xbres_ · 静态站点 26-xb-res-bid · 浏览器 sql.js 本地持久化
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.kpi-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.75rem;
}
.kpi {
  padding: 1rem 1.1rem;
}
.kpi-label {
  font-size: 12px;
  color: rgba(167, 243, 208, 0.65);
}
.kpi-value {
  margin-top: 0.35rem;
  font-size: 1.55rem;
  font-weight: 700;
  color: #ecfdf5;
}
.kpi-value small {
  font-size: 0.75rem;
  font-weight: 500;
  opacity: 0.7;
}
.kpi-hint {
  margin-top: 0.25rem;
  font-size: 11px;
  color: rgba(148, 163, 184, 0.85);
}
.chart-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 0.75rem;
}
.chart-grid .panel {
  padding: 1rem;
}
.chart-wide {
  grid-row: span 1;
}
.bottom-grid {
  display: grid;
  grid-template-columns: 1.2fr 1.2fr 0.9fr;
  gap: 0.75rem;
}
.feed,
.flags {
  padding: 1rem;
}
.feed-item {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.55rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.feed-item:last-child {
  border-bottom: none;
}
.tag {
  font-family: ui-monospace, monospace;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  white-space: nowrap;
  background: rgba(56, 189, 248, 0.15);
  color: #bae6fd;
}
.tag.LEVEL_YELLOW_WARN {
  background: rgba(251, 191, 36, 0.18);
  color: #fde68a;
}
.tag.LEVEL_RED_URGENT {
  background: rgba(248, 113, 113, 0.18);
  color: #fecaca;
}
.status {
  font-size: 10px;
  color: rgba(167, 243, 208, 0.55);
  white-space: nowrap;
}
.flag-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.flag-row strong {
  display: block;
  font-size: 13px;
  color: #ecfdf5;
}
.flag-row small {
  display: block;
  margin-top: 2px;
  font-size: 11px;
  color: rgba(167, 243, 208, 0.5);
}
.toggle {
  min-width: 52px;
  border-radius: 999px;
  border: none;
  padding: 0.35rem 0.7rem;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  background: rgba(100, 116, 139, 0.4);
  color: #cbd5e1;
}
.toggle.on {
  background: #10b981;
  color: #022c22;
}
@media (max-width: 1100px) {
  .kpi-row {
    grid-template-columns: repeat(2, 1fr);
  }
  .chart-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
