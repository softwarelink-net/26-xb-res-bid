<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import * as echarts from 'echarts'
import { getHydrologyTelemetry, type HydrologyRecord } from '@/utils/sqljs-engine'

const records = ref<HydrologyRecord[]>([])
const levelEl = ref<HTMLDivElement | null>(null)
const rainEl = ref<HTMLDivElement | null>(null)
let charts: echarts.ECharts[] = []

const latest = computed(() => records.value[records.value.length - 1])
const margin = computed(() => {
  if (!latest.value) return 0
  return +(latest.value.flood_limit_level - latest.value.water_level_meters).toFixed(2)
})
const overWarn = computed(() => margin.value <= 0.5)

const gradeLabel: Record<string, string> = {
  GRADE_I: 'Ⅰ类',
  GRADE_II: 'Ⅱ类',
  GRADE_III: 'Ⅲ类',
  GRADE_IV: 'Ⅳ类',
}

function render() {
  charts.forEach((c) => c.dispose())
  charts = []
  if (!levelEl.value || !rainEl.value) return

  const c1 = echarts.init(levelEl.value)
  c1.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: { data: ['库水位', '汛限水位'], textStyle: { color: '#a7f3d0' } },
    grid: { left: 48, right: 24, top: 40, bottom: 28 },
    xAxis: {
      type: 'category',
      data: records.value.map((r) => String(r.sampled_at).slice(5, 16)),
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      min: 482,
      max: 486,
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    series: [
      {
        name: '库水位',
        type: 'line',
        smooth: true,
        data: records.value.map((r) => r.water_level_meters),
        itemStyle: { color: '#38bdf8' },
        areaStyle: { color: 'rgba(56,189,248,0.2)' },
      },
      {
        name: '汛限水位',
        type: 'line',
        data: records.value.map((r) => r.flood_limit_level),
        itemStyle: { color: '#fb923c' },
        lineStyle: { type: 'dashed' },
      },
    ],
  })

  const c2 = echarts.init(rainEl.value)
  c2.setOption({
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    grid: { left: 40, right: 16, top: 24, bottom: 28 },
    xAxis: {
      type: 'category',
      data: records.value.map((r) => String(r.sampled_at).slice(5, 16)),
      axisLabel: { color: '#94a3b8', fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      name: 'mm',
      axisLabel: { color: '#94a3b8' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
    },
    series: [
      {
        type: 'bar',
        data: records.value.map((r) => r.rainfall_hourly_mm),
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#38bdf8' },
            { offset: 1, color: '#0369a1' },
          ]),
        },
        barWidth: 18,
      },
    ],
  })
  charts = [c1, c2]
}

onMounted(() => {
  records.value = getHydrologyTelemetry()
  requestAnimationFrame(render)
  window.addEventListener('resize', () => charts.forEach((c) => c.resize()))
})

onUnmounted(() => charts.forEach((c) => c.dispose()))
</script>

<template>
  <div class="page">
    <div>
      <h1 class="page-title">水雨情气象与库水位智能遥测中心</h1>
      <p class="page-desc">大坝水尺 / 超声波水位计 / 雨量筒 / 渗流压力 · 汛限动态比对</p>
    </div>

    <div v-if="latest" class="kpi-row">
      <div class="panel kpi">
        <div class="label">实时库水位</div>
        <div class="value text-sky-300">{{ latest.water_level_meters.toFixed(2) }} m</div>
      </div>
      <div class="panel kpi">
        <div class="label">汛限水位</div>
        <div class="value text-orange-300">{{ latest.flood_limit_level.toFixed(2) }} m</div>
      </div>
      <div class="panel kpi" :class="{ warn: overWarn }">
        <div class="label">距汛限余量</div>
        <div class="value">{{ margin }} m</div>
        <div class="hint">{{ overWarn ? '橙色高危接近警戒' : '处于安全裕度' }}</div>
      </div>
      <div class="panel kpi">
        <div class="label">蓄水量</div>
        <div class="value text-emerald-300">{{ latest.storage_capacity_m3.toFixed(1) }} 万m³</div>
      </div>
      <div class="panel kpi">
        <div class="label">出入库流量</div>
        <div class="value text-sm">
          入 {{ latest.inflow_rate_m3_s }} / 出 {{ latest.outflow_rate_m3_s }} m³/s
        </div>
      </div>
      <div class="panel kpi">
        <div class="label">水质类别</div>
        <div class="value">{{ gradeLabel[latest.water_quality_grade] }}</div>
      </div>
    </div>

    <div class="charts">
      <div class="panel">
        <div class="panel-title mb-2">水位—汛限警戒线动态比对</div>
        <div ref="levelEl" class="h-72" />
      </div>
      <div class="panel">
        <div class="panel-title mb-2">时段降水量柱状统计 (mm)</div>
        <div ref="rainEl" class="h-72" />
      </div>
    </div>

    <div class="panel table-wrap">
      <div class="panel-title mb-3">遥测时序明细</div>
      <table>
        <thead>
          <tr>
            <th>采样时间</th>
            <th>水位(m)</th>
            <th>库容(万m³)</th>
            <th>入库</th>
            <th>出库</th>
            <th>雨量(mm)</th>
            <th>水质</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="r in [...records].reverse()" :key="r.id">
            <td>{{ r.sampled_at }}</td>
            <td>{{ r.water_level_meters.toFixed(2) }}</td>
            <td>{{ r.storage_capacity_m3.toFixed(1) }}</td>
            <td>{{ r.inflow_rate_m3_s }}</td>
            <td>{{ r.outflow_rate_m3_s }}</td>
            <td>{{ r.rainfall_hourly_mm }}</td>
            <td>{{ gradeLabel[r.water_quality_grade] }}</td>
          </tr>
        </tbody>
      </table>
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
.kpi-row {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 0.65rem;
}
.kpi {
  padding: 0.9rem 1rem;
}
.kpi.warn {
  box-shadow: 0 0 0 1px rgba(251, 146, 60, 0.5);
}
.label {
  font-size: 11px;
  color: rgba(167, 243, 208, 0.55);
}
.value {
  margin-top: 0.3rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: #ecfdf5;
}
.hint {
  margin-top: 0.2rem;
  font-size: 11px;
  color: #fdba74;
}
.charts {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 0.75rem;
}
.charts .panel,
.table-wrap {
  padding: 1rem;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
th,
td {
  padding: 0.55rem 0.4rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-align: left;
  color: #d1fae5;
}
th {
  color: rgba(167, 243, 208, 0.55);
  font-weight: 500;
}
@media (max-width: 1100px) {
  .kpi-row,
  .charts {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
