<script setup lang="ts">
import type { PatrolIncident } from '@/utils/sqljs-engine'

defineProps<{ incidents: PatrolIncident[] }>()

const categoryLabels: Record<string, string> = {
  FENCE_DAMAGED: '护网破损',
  WARNING_SIGN_LOST: '警示牌倾倒',
  WATER_POLLUTION: '水面漂浮物/污染',
  DROWNING_RISK: '溺水险情',
}

const statusLabels: Record<string, string> = {
  REPORTED: '已上报',
  RECTIFYING: '整改中',
  CLOSED_VERIFIED: '已销号',
}

function timeline(inc: PatrolIncident) {
  const steps = [
    { label: '触发告警 / 上报', at: inc.reported_at, done: true },
    {
      label: '现场复核处置',
      at: inc.handler_user_name ? `处置人：${inc.handler_user_name}` : '待指派',
      done: inc.disposition_status !== 'REPORTED',
    },
    {
      label: '销号闭环',
      at: inc.closed_at || '进行中',
      done: inc.disposition_status === 'CLOSED_VERIFIED',
    },
  ]
  return steps
}
</script>

<template>
  <div class="events">
    <div class="grid">
      <article v-for="inc in incidents" :key="inc.id" class="panel card">
        <header>
          <div>
            <div class="no">{{ inc.incident_no }}</div>
            <h3>
              {{ categoryLabels[inc.incident_category] || inc.incident_category }} ·
              {{ inc.stake_location }}
            </h3>
          </div>
          <span class="badge" :data-s="inc.disposition_status">
            {{ statusLabels[inc.disposition_status] || inc.disposition_status }}
          </span>
        </header>

        <div class="photo">
          <div class="photo-placeholder">现场取证示意 · {{ inc.stake_location }}</div>
        </div>

        <p class="desc">{{ inc.repair_action_desc || '等待现场处置描述录入' }}</p>
        <div class="meta">
          上报人 {{ inc.reporter_name }}
          <span v-if="inc.handler_user_name"> · 经办 {{ inc.handler_user_name }}</span>
        </div>

        <ol class="timeline">
          <li v-for="(s, i) in timeline(inc)" :key="i" :class="{ done: s.done }">
            <strong>{{ s.label }}</strong>
            <span>{{ s.at }}</span>
          </li>
        </ol>
      </article>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
}
.card {
  padding: 1rem 1.1rem;
}
header {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}
.no {
  font-family: ui-monospace, monospace;
  font-size: 11px;
  color: #7dd3fc;
}
h3 {
  margin: 0.2rem 0 0;
  font-size: 14px;
  color: #ecfdf5;
}
.badge {
  align-self: flex-start;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(251, 191, 36, 0.18);
  color: #fde68a;
}
.badge[data-s='CLOSED_VERIFIED'] {
  background: rgba(16, 185, 129, 0.2);
  color: #6ee7b7;
}
.badge[data-s='REPORTED'] {
  background: rgba(56, 189, 248, 0.18);
  color: #bae6fd;
}
.photo {
  margin-top: 0.75rem;
}
.photo-placeholder {
  height: 96px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 12px;
  color: #a7f3d0;
  background:
    linear-gradient(135deg, rgba(6, 95, 70, 0.5), rgba(3, 105, 161, 0.4)),
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 8px,
      rgba(255, 255, 255, 0.03) 8px,
      rgba(255, 255, 255, 0.03) 16px
    );
  border: 1px solid rgba(52, 211, 153, 0.2);
}
.desc {
  margin: 0.75rem 0 0.35rem;
  font-size: 13px;
  line-height: 1.6;
  color: rgba(236, 253, 245, 0.85);
}
.meta {
  font-size: 11px;
  color: rgba(167, 243, 208, 0.5);
}
.timeline {
  list-style: none;
  margin: 0.85rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  border-left: 2px solid rgba(52, 211, 153, 0.25);
  padding-left: 0.85rem;
}
.timeline li {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: rgba(148, 163, 184, 0.9);
}
.timeline li.done {
  color: #a7f3d0;
}
.timeline strong {
  font-size: 12px;
}
@media (max-width: 900px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
