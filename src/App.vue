<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import GlobalStickyBanner from '@/components/common/GlobalStickyBanner.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import MainLayout from '@/layouts/MainLayout.vue'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const auth = useAuthStore()

const layout = computed(() => route.meta.layout || 'main')
</script>

<template>
  <GlobalStickyBanner />
  <div v-if="!auth.dbReady && !auth.bootError" class="boot-screen">
    <div class="boot-card">
      <div class="spinner" />
      <p>正在加载本地 SQLite 水务安防数据库…</p>
    </div>
  </div>
  <div v-else-if="auth.bootError" class="boot-screen">
    <div class="boot-card error">
      <p class="font-semibold">数据库初始化失败</p>
      <p class="text-sm opacity-80">{{ auth.bootError }}</p>
    </div>
  </div>
  <AuthLayout v-else-if="layout === 'auth'">
    <RouterView />
  </AuthLayout>
  <MainLayout v-else>
    <RouterView />
  </MainLayout>
</template>

<style scoped>
.boot-screen {
  min-height: calc(100vh - 40px);
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse at top, rgba(6, 95, 70, 0.35), transparent 55%),
    linear-gradient(160deg, #022c22, #0c4a6e 70%);
}
.boot-card {
  text-align: center;
  padding: 2rem 2.5rem;
  border-radius: 1rem;
  border: 1px solid rgba(52, 211, 153, 0.25);
  background: rgba(2, 44, 34, 0.75);
  color: #d1fae5;
}
.boot-card.error {
  border-color: rgba(248, 113, 113, 0.4);
  color: #fecaca;
}
.spinner {
  width: 36px;
  height: 36px;
  margin: 0 auto 1rem;
  border: 3px solid rgba(52, 211, 153, 0.25);
  border-top-color: #34d399;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
