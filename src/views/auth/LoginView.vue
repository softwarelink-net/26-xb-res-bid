<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const username = ref('admin')
const password = ref('Admin@2026')
const error = ref('')
const loading = ref(false)

const demos = [
  { user: 'admin', pass: 'Admin@2026', role: '系统超管' },
  { user: 'director', pass: 'Director@2026', role: '水管所长' },
  { user: 'patrol', pass: 'Patrol@2026', role: '巡查值守' },
  { user: 'leader', pass: 'Leader@2026', role: '决策长官' },
]

function fillDemo(u: string, p: string) {
  username.value = u
  password.value = p
}

async function onSubmit() {
  error.value = ''
  loading.value = true
  try {
    const ok = await auth.login(username.value.trim(), password.value)
    if (!ok) {
      error.value = '账号或密码错误，请核对演示账号'
      return
    }
    const redirect = (route.query.redirect as string) || '/'
    await router.push(redirect)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-wrap">
    <section class="hero-copy">
      <p class="eyebrow">兴文县水利局 · N5115282026000040</p>
      <h1>新坝水库隔离防护网<br />与智慧监控控制台</h1>
      <p class="desc">
        物理屏障与数字技防深度融合：周界入侵告警、视频 AI 巡查、水雨情遥测、广播联动与全景态势感知。
      </p>
      <RouterLink to="/tender" class="tender-link">查看公开招标公告全文 →</RouterLink>
    </section>

    <form class="login-card panel" @submit.prevent="onSubmit">
      <h2 class="text-lg font-semibold text-emerald-50">值守人员登录</h2>
      <p class="mt-1 text-xs text-emerald-200/60">本地 SQLite 鉴权 · 浏览器端 WebAssembly</p>

      <label class="field">
        <span>登录账号</span>
        <input v-model="username" autocomplete="username" required />
      </label>
      <label class="field">
        <span>登录密码</span>
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <button class="btn-primary w-full mt-2" type="submit" :disabled="loading">
        {{ loading ? '鉴权中…' : '进入水库管控中枢' }}
      </button>

      <div class="demo-grid">
        <button
          v-for="d in demos"
          :key="d.user"
          type="button"
          class="demo-btn"
          @click="fillDemo(d.user, d.pass)"
        >
          <strong>{{ d.role }}</strong>
          <span>{{ d.user }}</span>
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.login-wrap {
  min-height: calc(100vh - 40px);
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 2rem;
  align-items: center;
  padding: 2rem clamp(1.25rem, 4vw, 4rem);
  max-width: 1100px;
  margin: 0 auto;
}
.hero-copy h1 {
  margin: 0.5rem 0 1rem;
  font-size: clamp(1.75rem, 3.5vw, 2.6rem);
  line-height: 1.25;
  font-weight: 700;
  color: #ecfdf5;
  letter-spacing: 0.02em;
}
.eyebrow {
  color: #6ee7b7;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
.desc {
  color: rgba(209, 250, 229, 0.75);
  line-height: 1.7;
  max-width: 36rem;
  font-size: 14px;
}
.tender-link {
  display: inline-block;
  margin-top: 1.25rem;
  color: #7dd3fc;
  font-size: 13px;
  text-decoration: none;
}
.tender-link:hover {
  text-decoration: underline;
}
.login-card {
  padding: 1.75rem;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 1rem;
  font-size: 12px;
  color: #a7f3d0;
}
.field input {
  border-radius: 0.6rem;
  border: 1px solid rgba(52, 211, 153, 0.25);
  background: rgba(0, 0, 0, 0.35);
  color: #ecfdf5;
  padding: 0.65rem 0.85rem;
  outline: none;
}
.field input:focus {
  border-color: #34d399;
  box-shadow: 0 0 0 3px rgba(52, 211, 153, 0.15);
}
.error {
  margin-top: 0.75rem;
  color: #fca5a5;
  font-size: 12px;
}
.demo-grid {
  margin-top: 1.25rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
}
.demo-btn {
  text-align: left;
  border-radius: 0.5rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(255, 255, 255, 0.04);
  color: #d1fae5;
  padding: 0.5rem 0.65rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}
.demo-btn strong {
  font-size: 12px;
  color: #a7f3d0;
}
.demo-btn:hover {
  background: rgba(52, 211, 153, 0.12);
}
@media (max-width: 860px) {
  .login-wrap {
    grid-template-columns: 1fr;
    padding-top: 1.5rem;
  }
}
</style>
