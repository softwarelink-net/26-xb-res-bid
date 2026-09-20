<script setup lang="ts">
const sections = [
  {
    title: '1. 标题',
    body: '新坝水库隔离防护网和智慧监控系统项目(二次)竞争性谈判采购公告',
  },
  { title: '2. 项目发包方', body: '兴文县水利局' },
  { title: '3. 项目编号', body: 'N5115282026000040' },
  { title: '4. 项目发布时间', body: '2026-09-17 11:30:00' },
  {
    title: '5. 关键词',
    body: '兴文县水利局, 新坝水库, 隔离防护网, 智慧监控系统, N5115282026000040, 四川政府采购, 智慧水利',
  },
]

const techPoints = [
  '长周界防攀爬隔离网与电子传感协同定位：支持桩号级精细化告警联动。',
  '球机热成像视频与高音广播声光智能联动：实现涉水入侵目标秒级威慑劝离。',
  '水库大坝水雨情与库水位自动化采集预警：融合汛限水位动态比对与预报调度。',
  '前端 WebAssembly sql.js 边缘极速响应体系：零后端常驻服务器开销，离线数据本地极简持久化。',
]

const innovations = [
  '全要素水库水务安防数字孪生一张图：宏观掌控水质安全、库容蓄水量及周界防范态势。',
  '基于统一命名空间隔离的数据主权架构：专用数据表前缀与独立存储载体，杜绝数据交叉干扰。',
]
</script>

<template>
  <div class="tender-page">
    <article class="panel tender-card">
      <header class="head">
        <p class="badge">公开招标公告 · 免密访问</p>
        <h1>兴文县水利局新坝水库隔离防护网和智慧监控系统项目(二次)</h1>
        <p class="sub">竞争性谈判采购公告 · 项目编号 N5115282026000040</p>
        <div class="actions">
          <RouterLink class="btn-primary" to="/login">进入控制台登录</RouterLink>
          <a
            class="btn-ghost"
            href="https://www.ccgp-sichuan.gov.cn/"
            target="_blank"
            rel="noopener noreferrer"
          >
            四川省政府采购一体化平台
          </a>
        </div>
      </header>

      <section v-for="s in sections" :key="s.title" class="block">
        <h2>{{ s.title }}</h2>
        <p>{{ s.body }}</p>
      </section>

      <section class="block">
        <h2>6. 摘要</h2>
        <p>
          兴文县水利局委托四川名哲工程项目管理有限公司，对新坝水库隔离防护网和智慧监控系统项目(二次)组织竞争性谈判，预算金额与最高限价为
          <strong>1,954,000.00 元</strong>。采购标的为隔离防护网与智慧监控系统，合同签订之日起
          <strong>30 日内</strong>发货，<strong>60 日内</strong>完成本项目所有货物的供货及安装调试，不接受联合体投标，响应文件提交截止时间为
          <strong>2026 年 10 月 09 日 10:00</strong>。
        </p>
      </section>

      <section class="block">
        <h2>7. 技术要点</h2>
        <ul>
          <li v-for="(t, i) in techPoints" :key="i">{{ t }}</li>
        </ul>
      </section>

      <section class="block">
        <h2>8. 技术创新性</h2>
        <ul>
          <li v-for="(t, i) in innovations" :key="i">{{ t }}</li>
        </ul>
      </section>

      <section class="block guide">
        <h2>电子化开标指引</h2>
        <ol>
          <li>登录四川省政府采购一体化平台，检索项目编号 N5115282026000040。</li>
          <li>在线下载竞争性谈判文件，按要求编制并加密上传响应文件。</li>
          <li>于 2026-10-09 10:00 前完成提交，按时参加电子开标与谈判流程。</li>
          <li>开标后按评审委员会要求进行澄清、报价确认与合同磋商。</li>
        </ol>
      </section>

      <footer class="disclaimer">
        <h3>免责声明（摘要）</h3>
        <p>
          本页所涉标讯信息采集自互联网公开渠道，仅供技术研究与学习参考；不涉及国家秘密与未公开敏感信息。使用本演示系统所产生后果由使用者自行承担。
        </p>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.tender-page {
  padding: 1.5rem clamp(1rem, 3vw, 2.5rem) 2.5rem;
  max-width: 880px;
  margin: 0 auto;
}
.tender-card {
  padding: 1.75rem clamp(1.25rem, 3vw, 2.25rem);
}
.head {
  margin-bottom: 1.5rem;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid rgba(52, 211, 153, 0.2);
}
.badge {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(56, 189, 248, 0.2);
  color: #bae6fd;
  margin-bottom: 0.75rem;
}
h1 {
  font-size: clamp(1.35rem, 2.5vw, 1.75rem);
  color: #ecfdf5;
  margin: 0;
  line-height: 1.4;
}
.sub {
  margin-top: 0.5rem;
  color: rgba(167, 243, 208, 0.7);
  font-size: 13px;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 1.25rem;
}
.block {
  margin-top: 1.25rem;
}
.block h2 {
  font-size: 14px;
  color: #6ee7b7;
  margin: 0 0 0.4rem;
}
.block p,
.block li {
  color: rgba(236, 253, 245, 0.85);
  font-size: 14px;
  line-height: 1.75;
  margin: 0;
}
.block ul,
.block ol {
  margin: 0;
  padding-left: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.guide {
  margin-top: 1.5rem;
  padding: 1rem;
  border-radius: 0.75rem;
  background: rgba(14, 165, 233, 0.08);
  border: 1px solid rgba(56, 189, 248, 0.2);
}
.disclaimer {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.12);
  color: rgba(209, 250, 229, 0.55);
  font-size: 12px;
  line-height: 1.6;
}
.disclaimer h3 {
  margin: 0 0 0.35rem;
  font-size: 13px;
  color: rgba(167, 243, 208, 0.8);
}
</style>
