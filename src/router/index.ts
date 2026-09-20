import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { RoleCode } from '@/utils/sqljs-engine'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    roles?: RoleCode[]
    title?: string
    layout?: 'auth' | 'main'
  }
}

const ALL_ROLES: RoleCode[] = [
  'ROLE_SUPER_ADMIN',
  'ROLE_WATER_DIRECTOR',
  'ROLE_PATROL_OFFICER',
  'ROLE_DECISION_MAKER',
]

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/auth/LoginView.vue'),
    meta: { requiresAuth: false, title: '用户登录', layout: 'auth' },
  },
  {
    path: '/tender',
    name: 'tender',
    component: () => import('@/views/auth/TenderView.vue'),
    meta: { requiresAuth: false, title: '招标公告', layout: 'auth' },
  },
  {
    path: '/',
    name: 'dashboard',
    component: () => import('@/views/dashboard/DashboardView.vue'),
    meta: {
      requiresAuth: true,
      roles: ALL_ROLES,
      title: '水库管控驾驶舱',
      layout: 'main',
    },
  },
  {
    path: '/perimeter',
    name: 'perimeter',
    component: () => import('@/views/perimeter/PerimeterView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['ROLE_SUPER_ADMIN', 'ROLE_WATER_DIRECTOR', 'ROLE_PATROL_OFFICER'],
      title: '周界防护网拓扑',
      layout: 'main',
    },
  },
  {
    path: '/video-patrol',
    name: 'video-patrol',
    component: () => import('@/views/video-patrol/VideoPatrolView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['ROLE_SUPER_ADMIN', 'ROLE_WATER_DIRECTOR', 'ROLE_PATROL_OFFICER'],
      title: '视频 AI 联动巡查',
      layout: 'main',
    },
  },
  {
    path: '/hydrology',
    name: 'hydrology',
    component: () => import('@/views/hydrology/HydrologyView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['ROLE_SUPER_ADMIN', 'ROLE_WATER_DIRECTOR', 'ROLE_DECISION_MAKER'],
      title: '水雨情遥测中心',
      layout: 'main',
    },
  },
  {
    path: '/system',
    name: 'system',
    component: () => import('@/views/system/SystemView.vue'),
    meta: {
      requiresAuth: true,
      roles: ['ROLE_SUPER_ADMIN', 'ROLE_WATER_DIRECTOR', 'ROLE_DECISION_MAKER'],
      title: '系统总控与审计',
      layout: 'main',
    },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  const requiresAuth = to.meta.requiresAuth !== false

  if (requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }

  if (to.path === '/login' && auth.isAuthenticated) {
    return { path: '/' }
  }

  if (requiresAuth && to.meta.roles && !auth.hasRole(to.meta.roles)) {
    window.alert('权限不足：当前角色无法访问该水务安防模块，请联系系统管理员。')
    return { path: '/' }
  }

  document.title = to.meta.title
    ? `${to.meta.title} · 新坝水库智慧监控`
    : '兴文县水利局新坝水库防护网和智慧监控系统招标公告'

  return true
})

export default router
