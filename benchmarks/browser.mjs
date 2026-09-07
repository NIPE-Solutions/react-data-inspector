import { chromium } from 'playwright'
import { execFileSync, spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { platform, release, cpus } from 'node:os'
execFileSync('npm', ['run', 'build:website'], { stdio: 'pipe' })
const server = spawn(
  'node',
  [
    'node_modules/vite/bin/vite.js',
    'preview',
    '--config',
    'website/vite.config.ts',
    '--host',
    '127.0.0.1',
    '--port',
    '5174',
    '--strictPort',
  ],
  { stdio: 'pipe' },
)
let browser
try {
  for (let i = 0; i < 100; i++) {
    try {
      if ((await fetch('http://127.0.0.1:5174')).ok) break
    } catch {}
    if (i === 99) throw Error('Preview failed to start')
    await new Promise((r) => setTimeout(r, 100))
  }
  browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const samples = []
  for (let i = 0; i < 5; i++) {
    await page.goto('http://127.0.0.1:5174')
    const tree = page.getByRole('tree', { name: 'Playground inspector' })
    const start = performance.now()
    await tree.getByRole('button', { name: 'Expand user' }).click()
    await tree.getByText('"Nicholas"', { exact: true }).waitFor()
    const expandMs = performance.now() - start
    const collapseStart = performance.now()
    await tree.getByRole('button', { name: 'Collapse user' }).click()
    await tree
      .getByText('"Nicholas"', { exact: true })
      .waitFor({ state: 'hidden' })
    const collapseMs = performance.now() - collapseStart
    const searchStart = performance.now()
    await page.locator('#playground').getByRole('searchbox').fill('Nicholas')
    await page
      .locator('#playground')
      .getByRole('button', { name: 'Next result' })
      .click()
    await tree.locator('[data-selected=true]').waitFor()
    const searchRevealMs = performance.now() - searchStart
    await page.goto('http://127.0.0.1:5174/playground?section=json')
    await page
      .getByLabel('JSON input', { exact: true })
      .fill(JSON.stringify(Array.from({ length: 1000 }, (_, i) => i)))
    await page
      .getByRole('button', { name: 'Inspect JSON', exact: true })
      .click()
    const virtual = page.getByRole('tree', { name: 'JSON inspector' })
    await virtual.focus()
    const scrollStart = performance.now()
    await virtual.press('End')
    const active = await virtual.getAttribute('aria-activedescendant')
    await page.locator(`[id="${active}"]`).waitFor()
    const endRevealMs = performance.now() - scrollStart
    samples.push({
      expandMs,
      collapseMs,
      searchRevealMs,
      endRevealMs,
      mountedRows: await virtual.locator('[data-rdi-node]').count(),
    })
  }
  const report = {
    date: new Date().toISOString(),
    browser: browser.version(),
    environment: {
      platform: platform(),
      release: release(),
      cpu: cpus()[0]?.model,
    },
    methodology:
      'Five page loads of production Vite site. Wall-clock Playwright action-to-observed-state timing includes automation overhead and the 150ms search debounce. Graph scenario for expansion/search; 1,000 flat numeric items for windowed End navigation. Not an isolated React render benchmark or frame-loss audit.',
    samples,
  }
  writeFileSync(
    'benchmarks/browser-results.json',
    JSON.stringify(report, null, 2) + '\n',
  )
  console.table(samples)
} finally {
  await browser?.close()
  server.kill()
}
