#!/usr/bin/env node
import { mkdirSync, copyFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const root = join(fileURLToPath(import.meta.url), '..', '..')
const outPath = join(root, 'docs', 'assets', 'dashboard-preview.png')
const publicOut = join(root, 'public', 'docs', 'assets', 'dashboard-preview.png')
mkdirSync(dirname(outPath), { recursive: true })
mkdirSync(dirname(publicOut), { recursive: true })

const base = process.argv[2] || 'http://127.0.0.1:5173'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
page.on('console', (msg) => console.log('[console]', msg.type(), msg.text()))
page.on('pageerror', (err) => console.log('[pageerror]', err.message))

try {
  await page.goto(`${base}/login`, { waitUntil: 'networkidle', timeout: 60000 })
  await page.waitForSelector('form.login-card input[autocomplete="username"]', { timeout: 30000 })
  await page.waitForTimeout(800)

  // Prefill already present; ensure credentials then submit
  await page.fill('input[autocomplete="username"]', 'admin')
  await page.fill('input[autocomplete="current-password"]', 'Admin@2026')
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 }),
    page.click('button[type="submit"]'),
  ])

  await page.waitForSelector('.kpi-label', { timeout: 45000 })
  await page.waitForTimeout(2800)
  await page.screenshot({ path: outPath, fullPage: false })
  copyFileSync(outPath, publicOut)
  console.log(`[screenshot] saved => ${outPath}`)
  console.log(`[screenshot] copied => ${publicOut}`)
} catch (err) {
  const debugPng = join(root, 'docs', 'assets', 'screenshot-debug.png')
  const debugHtml = join(root, 'docs', 'assets', 'screenshot-debug.html')
  try {
    await page.screenshot({ path: debugPng, fullPage: true })
    writeFileSync(debugHtml, await page.content())
    console.log(`[screenshot] debug png => ${debugPng}`)
    console.log(`[screenshot] debug html => ${debugHtml}`)
    console.log(`[screenshot] url => ${page.url()}`)
  } catch {
    /* ignore */
  }
  throw err
} finally {
  await browser.close()
}
