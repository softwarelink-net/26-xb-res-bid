<template>
  <header class="global-sticky-top-banner" role="banner">
    <div class="banner-inner">
      <span class="banner-badge">新坝水库智慧监控</span>
      <span class="banner-text">
        获取网站源码，请访问：
        <a
          href="https://github.com/softwarelink-net/26-xb-res-bid"
          target="_blank"
          rel="noopener noreferrer"
          class="banner-link"
        >
          https://github.com/softwarelink-net/26-xb-res-bid
        </a>
      </span>
    </div>
  </header>
</template>

<style scoped>
.global-sticky-top-banner {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 40px !important;
  z-index: 9999 !important;
  background: linear-gradient(90deg, #022c22 0%, #065f46 50%, #0369a1 100%);
  color: #f0fdf4;
  font-size: 13px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.35);
}
.banner-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  flex-wrap: wrap;
  justify-content: center;
}
.banner-badge {
  background: #34d399;
  color: #064e3b;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 700;
}
.banner-link {
  color: #a7f3d0;
  text-decoration: underline;
  margin-left: 4px;
  transition: color 0.2s ease;
}
.banner-link:hover {
  color: #ffffff;
}
@media (max-width: 640px) {
  .banner-text {
    font-size: 11px;
  }
}
</style>
