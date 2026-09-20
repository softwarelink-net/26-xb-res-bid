<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import {
  getAuditLogs,
  getPatrolIncidents,
  getSystemConfigs,
  setSystemConfig,
  type AuditLog,
  type PatrolIncident,
  type SystemConfig,
} from '@/utils/sqljs-engine'
import { useAuthStore } from '@/stores/auth'
import EventsPanel from '@/views/events/EventsPanel.vue'

const auth = useAuthStore()
const tab = ref<'events' | 'audit' | 'config'>('events')
const incidents = ref<PatrolIncident[]>([])
const logs = ref<AuditLog[]>([])
const configs = ref<SystemConfig[]>([])

const canEditConfig = computed(
  () => auth.user?.role === 'ROLE_SUPER_ADMIN' || auth.user?.role === 'ROLE_WATER_DIRECTOR',
)

function reload() {
  incidents.value = getPatrolIncidents()
  logs.value = getAuditLogs()
  configs.value = getSystemConfigs()
}

function toggleConfig(c: SystemConfig) {
  if (!canEditConfig.value) {
    window.alert('仅超管/所长可修改配置')
    return
  }
  if (c.config_value !== 'true' && c.config_value !== 'false') return
  const next = c.config_value === 'true' ? 'false' : 'true'
  setSystemConfig(c.config_key, next, auth.user || undefined)
  reload()
}

onMounted(reload)
</script>

<template>
  <div class="page">
    <div>
      <h1 class="page-title">系统总控与水务数据安全审计</h1>
      <p class="page-desc">巡查闭环工坊 · 操作审计 · Feature Flags · SM4 脱敏策略</p>
    </div>

    <div class="tabs">
      <button type="button" :class="{ active: tab === 'events' }" @click="tab = 'events'">
        巡查事件闭环
      </button>
      <button type="button" :class="{ active: tab === 'audit' }" @click="tab = 'audit'">
        安全审计日志
      </button>
      <button type="button" :class="{ active: tab === 'config' }" @click="tab = 'config'">
        全局配置
      </button>
    </div>

    <EventsPanel v-if="tab === 'events'" :incidents="incidents" />

    <div v-else-if="tab === 'audit'" class="panel table-wrap">
      <div class="panel-title mb-3">值守人员实名操作审计</div>
      <table>
        <thead>
          <tr>
            <th>时间</th>
            <th>用户</th>
            <th>动作</th>
            <th>资源</th>
            <th>URI</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="l in logs" :key="l.id">
            <td>{{ l.created_at }}</td>
            <td>{{ l.username || '-' }}</td>
            <td>{{ l.action_name }}</td>
            <td>{{ l.target_resource }}</td>
            <td class="mono">{{ l.request_uri }}</td>
            <td>{{ l.status_code }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="panel config-wrap">
      <div class="panel-title mb-3">Feature Flags / 系统参数</div>
      <div v-for="c in configs" :key="c.config_key" class="cfg-row">
        <div>
          <div class="key">{{ c.config_key }}</div>
          <div class="desc">{{ c.description }}</div>
          <div class="cat">{{ c.category }}</div>
        </div>
        <div class="val">
          <code>{{ c.config_value }}</code>
          <button
            v-if="c.config_value === 'true' || c.config_value === 'false'"
            type="button"
            class="btn-ghost"
            @click="toggleConfig(c)"
          >
            切换
          </button>
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
.tabs {
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.tabs button {
  border-radius: 8px;
  border: 1px solid rgba(52, 211, 153, 0.2);
  background: rgba(0, 0, 0, 0.25);
  color: #a7f3d0;
  padding: 0.45rem 0.9rem;
  font-size: 13px;
  cursor: pointer;
}
.tabs button.active {
  background: rgba(16, 185, 129, 0.25);
  border-color: rgba(52, 211, 153, 0.45);
  color: #ecfdf5;
}
.table-wrap,
.config-wrap {
  padding: 1rem;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}
th,
td {
  padding: 0.5rem 0.35rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  text-align: left;
  color: #d1fae5;
}
th {
  color: rgba(167, 243, 208, 0.55);
  font-weight: 500;
}
.mono {
  font-family: ui-monospace, monospace;
  font-size: 11px;
}
.cfg-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}
.key {
  font-family: ui-monospace, monospace;
  font-size: 12px;
  color: #7dd3fc;
}
.desc {
  margin-top: 0.25rem;
  font-size: 12px;
  color: #d1fae5;
}
.cat {
  margin-top: 0.2rem;
  font-size: 11px;
  color: rgba(167, 243, 208, 0.45);
}
.val {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.val code {
  font-size: 12px;
  color: #a7f3d0;
}
</style>
