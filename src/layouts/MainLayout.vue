<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RoleCode } from '@/utils/sqljs-engine'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

interface NavItem {
  path: string
  label: string
  icon: string
  roles?: RoleCode[]
}

const navItems: NavItem[] = [
  { path: '/', label: '管控驾驶舱', icon: '◈' },
  {
    path: '/perimeter',
    label: '周界防护网',
    icon: '▣',
    roles: ['ROLE_SUPER_ADMIN', 'ROLE_WATER_DIRECTOR', 'ROLE_PATROL_OFFICER'],
  },
  {
    path: '/video-patrol',
    label: '视频 AI 巡查',
    icon: '◉',
    roles: ['ROLE_SUPER_ADMIN', 'ROLE_WATER_DIRECTOR', 'ROLE_PATROL_OFFICER'],
  },
  {
    path: '/hydrology',
    label: '水雨情遥测',
    icon: '◎',
    roles: ['ROLE_SUPER_ADMIN', 'ROLE_WATER_DIRECTOR', 'ROLE_DECISION_MAKER'],
  },
  {
    path: '/system',
    label: '总控与审计',
    icon: '⚙',
    roles: ['ROLE_SUPER_ADMIN', 'ROLE_WATER_DIRECTOR', 'ROLE_DECISION_MAKER'],
  },
]

const visibleNav = computed(() =>
  navItems.filter((item) => !item.roles || auth.hasRole(item.roles)),
)

const roleLabel: Record<string, string> = {
  ROLE_SUPER_ADMIN: '系统超管',
  ROLE_WATER_DIRECTOR: '水管所长',
  ROLE_PATROL_OFFICER: '巡查值守',
  ROLE_DECISION_MAKER: '决策长官',
}

const floodWarn = computed(() => {
  const s = auth.headerStats
  if (!s) return false
  return s.floodLimit - s.waterLevel <= 0.5
})

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="main-shell">
    <aside class="sidebar">
      <div class="brand">
        <div class="brand-mark">XB</div>
        <div>
          <div class="brand-title">新坝水库</div>
          <div class="brand-sub">智慧监控控制台</div>
        </div>
      </div>
      <nav class="nav">
        <RouterLink
          v-for="item in visibleNav"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span>{{ item.label }}</span>
        </RouterLink>
        <RouterLink to="/tender" class="nav-item public">
          <span class="nav-icon">📄</span>
          <span>招标公告</span>
        </RouterLink>
      </nav>
      <div class="sidebar-foot">
        <div class="text-[11px] text-emerald-200/60">N5115282026000040</div>
        <div class="text-[11px] text-emerald-200/40">兴文县水利局 · 演示系统</div>
      </div>
    </aside>

    <div class="content-col">
      <header class="topbar">
        <div class="crumbs">
          <span class="opacity-50">水务安防</span>
          <span class="mx-2 opacity-30">/</span>
          <span class="text-emerald-200">{{ route.meta.title }}</span>
        </div>
        <div class="status-row">
          <span class="stat-chip bg-sky-500/20 text-sky-200" title="当前库水位">
            水位 {{ auth.headerStats?.waterLevel?.toFixed(2) ?? '--' }} m
          </span>
          <span
            class="stat-chip"
            :class="floodWarn ? 'bg-orange-500/25 text-orange-200' : 'bg-emerald-500/20 text-emerald-200'"
          >
            {{ floodWarn ? '接近汛限警戒' : '汛限安全' }}
          </span>
          <span class="stat-chip bg-rose-500/20 text-rose-200">
            未闭环报警 {{ auth.headerStats?.pendingAlarms ?? 0 }}
          </span>
          <div class="user-box">
            <div class="text-right leading-tight">
              <div class="text-sm font-medium text-emerald-50">{{ auth.user?.full_name }}</div>
              <div class="text-[11px] text-emerald-200/60">
                {{ roleLabel[auth.user?.role || ''] || auth.user?.role }}
              </div>
            </div>
            <button class="btn-ghost" type="button" @click="logout">退出</button>
          </div>
        </div>
      </header>
      <main class="page-body">
        <slot />
      </main>
    </div>
  </div>
</template>

<style scoped>
.main-shell {
  display: flex;
  min-height: calc(100vh - 40px);
  background:
    radial-gradient(ellipse at top right, rgba(3, 105, 161, 0.18), transparent 40%),
    linear-gradient(180deg, #031a16 0%, #042f28 50%, #041f2e 100%);
}
.sidebar {
  width: 232px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid rgba(52, 211, 153, 0.15);
  background: linear-gradient(180deg, rgba(2, 44, 34, 0.95), rgba(8, 47, 73, 0.85));
  padding: 1rem 0.75rem;
}
.brand {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  padding: 0.5rem 0.75rem 1.25rem;
}
.brand-mark {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: grid;
  place-items: center;
  font-weight: 800;
  color: #022c22;
  background: linear-gradient(135deg, #34d399, #38bdf8);
}
.brand-title {
  font-weight: 700;
  font-size: 15px;
  color: #ecfdf5;
}
.brand-sub {
  font-size: 11px;
  color: rgba(167, 243, 208, 0.65);
}
.nav {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  color: rgba(209, 250, 229, 0.75);
  text-decoration: none;
  font-size: 13px;
  transition: all 0.15s ease;
}
.nav-item:hover {
  background: rgba(52, 211, 153, 0.1);
  color: #ecfdf5;
}
.nav-item.active {
  background: linear-gradient(90deg, rgba(16, 185, 129, 0.28), rgba(14, 165, 233, 0.15));
  color: #fff;
  box-shadow: inset 0 0 0 1px rgba(52, 211, 153, 0.25);
}
.nav-item.public {
  margin-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  padding-top: 14px;
  border-radius: 0 0 10px 10px;
}
.nav-icon {
  width: 1.25rem;
  text-align: center;
  opacity: 0.85;
}
.sidebar-foot {
  padding: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}
.content-col {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid rgba(52, 211, 153, 0.12);
  background: rgba(2, 44, 34, 0.45);
  backdrop-filter: blur(8px);
}
.crumbs {
  font-size: 13px;
  color: #a7f3d0;
}
.status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.user-box {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: 0.5rem;
  padding-left: 0.75rem;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
}
.page-body {
  flex: 1;
  padding: 1.25rem;
  overflow: auto;
}
@media (max-width: 900px) {
  .sidebar {
    width: 72px;
  }
  .brand-title,
  .brand-sub,
  .nav-item span:last-child,
  .sidebar-foot {
    display: none;
  }
  .nav-item {
    justify-content: center;
  }
}
</style>
