import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  initDatabase,
  login as dbLogin,
  getDashboardStats,
  type UserRecord,
  type RoleCode,
  type DashboardStats,
} from '@/utils/sqljs-engine'

const SESSION_KEY = 'xbres_session'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserRecord | null>(null)
  const dbReady = ref(false)
  const bootError = ref('')
  const headerStats = ref<Pick<DashboardStats, 'waterLevel' | 'floodLimit' | 'pendingAlarms'> | null>(null)

  const isAuthenticated = computed(() => !!user.value)
  const role = computed(() => user.value?.role ?? null)

  function restoreSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) user.value = JSON.parse(raw) as UserRecord
    } catch {
      localStorage.removeItem(SESSION_KEY)
    }
  }

  async function bootstrap() {
    try {
      await initDatabase()
      dbReady.value = true
      restoreSession()
      refreshHeaderStats()
    } catch (e) {
      bootError.value = e instanceof Error ? e.message : '数据库初始化失败'
    }
  }

  async function login(username: string, password: string) {
    const result = await dbLogin(username, password)
    if (!result) return false
    user.value = result
    localStorage.setItem(SESSION_KEY, JSON.stringify(result))
    refreshHeaderStats()
    return true
  }

  function logout() {
    user.value = null
    localStorage.removeItem(SESSION_KEY)
  }

  function hasRole(roles?: RoleCode[]) {
    if (!roles || roles.length === 0) return true
    if (!user.value) return false
    return roles.includes(user.value.role)
  }

  function refreshHeaderStats() {
    if (!dbReady.value) return
    try {
      const stats = getDashboardStats()
      headerStats.value = {
        waterLevel: stats.waterLevel,
        floodLimit: stats.floodLimit,
        pendingAlarms: stats.pendingAlarms,
      }
    } catch {
      /* ignore */
    }
  }

  return {
    user,
    dbReady,
    bootError,
    headerStats,
    isAuthenticated,
    role,
    bootstrap,
    login,
    logout,
    hasRole,
    refreshHeaderStats,
  }
})
