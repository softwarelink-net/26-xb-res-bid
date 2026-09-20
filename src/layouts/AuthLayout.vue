<script setup lang="ts">
</script>

<template>
  <div class="auth-shell">
    <div class="auth-bg" aria-hidden="true" />
    <main class="auth-main">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.auth-shell {
  position: relative;
  min-height: calc(100vh - 40px);
  overflow: hidden;
}
.auth-bg {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 15% 20%, rgba(16, 185, 129, 0.28), transparent 40%),
    radial-gradient(circle at 85% 10%, rgba(14, 165, 233, 0.25), transparent 35%),
    linear-gradient(155deg, #022c22 0%, #064e3b 40%, #0c4a6e 100%);
}
.auth-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse at center, black 30%, transparent 75%);
}
.auth-main {
  position: relative;
  z-index: 1;
  min-height: calc(100vh - 40px);
}
</style>
