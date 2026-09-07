import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
test('laboratory scenarios, configuration sharing and customization', async ({
  page,
}) => {
  await page.goto('/playground')
  await expect(
    page.getByRole('heading', { name: 'Inspect under real conditions.' }),
  ).toBeVisible()
  await page
    .getByRole('combobox', { name: 'Scenario', exact: true })
    .selectOption('opaque')
  await expect(page.getByRole('tree')).toContainText('WeakMap')
  await page.getByRole('button', { name: 'Customization', exact: true }).click()
  await page.getByLabel('Appearance').selectOption('unstyled')
  await expect(page.locator('[data-rdi-root]')).toHaveAttribute(
    'data-rdi-unstyled',
    'true',
  )
  await expect(page.getByRole('tree')).toContainText('EUR 12.99')
  await page.getByRole('button', { name: 'Share configuration' }).click()
  await expect(page.getByLabel('Share URL')).toHaveValue(
    /section=customization/,
  )
  await page.reload()
  await expect(page.locator('[data-rdi-root]')).toHaveAttribute(
    'data-rdi-unstyled',
    'true',
  )
})
test('external updates preserve open branches and refresh search', async ({
  page,
}) => {
  await page.goto('/playground?section=live')
  const tree = page.getByRole('tree', { name: 'Live application inspector' })
  await tree.getByRole('button', { name: 'Expand stats' }).click()
  await page.getByRole('button', { name: 'Update once', exact: true }).click()
  await expect(
    tree.getByRole('button', { name: 'Collapse stats' }),
  ).toBeVisible()
  await expect(page.getByTestId('event-count')).toHaveText('2 events retained')
  await page.getByRole('button', { name: 'Toggle metadata' }).click()
  await expect(
    tree.locator('[data-rdi-key]').filter({ hasText: /^metadata$/ }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Toggle metadata' }).click()
  await expect(
    tree.locator('[data-rdi-key]').filter({ hasText: /^metadata$/ }),
  ).toHaveCount(0)
  await page
    .getByRole('searchbox', { name: 'Search data' })
    .fill('Processed document 2')
  await page.getByRole('button', { name: 'Update once', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Next result' })).toBeEnabled()
  await page.getByRole('button', { name: 'Next result' }).click()
  await expect(tree.locator('[data-selected=true]')).toContainText(
    'Processed document 2',
  )
  await page.getByRole('button', { name: 'Start stream' }).click()
  await expect(page.getByTestId('event-count')).not.toHaveText(
    '3 events retained',
  )
  await page.getByRole('button', { name: 'Pause stream' }).click()
})
test('performance controls and mobile accessibility', async ({
  page,
}, testInfo) => {
  await page.goto('/playground?section=performance&size=500000')
  await expect(page.getByRole('tree').locator('[data-rdi-node]')).toHaveCount(
    51,
  )
  await page.getByLabel('Enable measurements').check()
  await expect(page.getByTestId('mounted-rows')).toContainText('51')
  await page.getByRole('button', { name: 'Unmount inspector' }).click()
  await expect(page.getByRole('tree')).toHaveCount(0)
  await page.getByRole('button', { name: 'Mount inspector' }).click()
  await expect(page.getByRole('tree')).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390)
  await page.screenshot({
    path: testInfo.outputPath('playground-mobile.png'),
    fullPage: true,
  })
  const audit = await new AxeBuilder({ page }).analyze()
  expect(audit.violations).toEqual([])
})

test('lazy children, search scopes and same-reference updates remain honest', async ({
  page,
}) => {
  await page.goto('/playground?scenario=lazy')
  await page.getByLabel('Enable measurements').check()
  await expect(page.getByTestId('lazy-reads')).toHaveText('0')
  await page.getByRole('tree').focus()
  await page.getByRole('tree').press('ArrowDown')
  await page.getByRole('tree').press('Enter')
  await page.getByRole('tree').press('ArrowDown')
  await page.getByRole('tree').press('Enter')
  await expect(page.getByTestId('lazy-reads')).not.toHaveText('0')
  await page.goto('/playground?section=live')
  await page
    .getByRole('combobox', { name: 'Update mode' })
    .selectOption('mutation')
  await page.getByRole('button', { name: 'Update once', exact: true }).click()
  await expect(page.getByTestId('event-count')).toHaveText('2 events retained')
  await page.getByRole('button', { name: 'Expand stats' }).click()
  await expect(page.getByRole('tree')).toContainText('processing')
  await page.getByRole('button', { name: 'Replace dataset' }).click()
  await expect(
    page.getByRole('button', { name: 'Collapse stats' }),
  ).toBeVisible()
  await expect(page.getByRole('tree')).toContainText('ready')
})

test('search measurements include debounce rather than a transient empty result', async ({
  page,
}) => {
  await page.goto('/playground?section=performance&size=1000')
  await page.getByLabel('Enable measurements').check()
  await page.getByRole('searchbox', { name: 'Search data' }).fill('999')
  const duration = page.getByTestId('search-duration')
  await expect(duration).not.toHaveText('—')
  expect(parseFloat(await duration.innerText())).toBeGreaterThanOrEqual(140)
})

test('all predefined scenarios render without application errors', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.goto('/playground')
  const scenario = page.getByRole('combobox', { name: 'Scenario', exact: true })
  for (const id of [
    'primitives',
    'objects',
    'core',
    'collections',
    'binary',
    'opaque',
    'safety',
    'strings',
    'domain',
    'lazy',
    'dom',
    'wide',
    'manyReferences',
    'deep',
    'graph',
  ]) {
    await scenario.selectOption(id)
    await expect(page.getByRole('tree')).toBeVisible()
    expect(
      await page.getByRole('tree').locator('[data-rdi-node]').count(),
    ).toBeLessThan(1100)
  }
  expect(errors).toEqual([])
})
test('custom actions remain additive and JSON input never evaluates expressions', async ({
  page,
}) => {
  await page.goto('/playground?section=customization')
  await page
    .getByRole('tree')
    .locator('[data-rdi-key]')
    .filter({ hasText: /^customer$/ })
    .click()
  await page.getByRole('tree').press('F2')
  await expect(
    page.getByRole('button', { name: 'Copy path', exact: true }),
  ).toBeVisible()
  await page.getByRole('button', { name: 'Open in application' }).click()
  await expect(page.locator('output')).toContainText('Opened customer')
  await page.getByRole('button', { name: 'Your JSON', exact: true }).click()
  await page.getByLabel('JSON input').fill('new Date()')
  await page.getByRole('button', { name: 'Inspect JSON' }).click()
  await expect(page.getByRole('alert')).toContainText('Invalid JSON')
  await page.getByLabel('JSON input').fill('{"external":42}')
  await page.getByRole('button', { name: 'Inspect JSON' }).click()
  await expect(page.getByRole('tree')).toContainText('external')
  await page.getByRole('button', { name: 'Validation', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('0 of 6')
})

test('random stress updates run, pause and replay the same changed fields', async ({
  page,
}) => {
  await page.goto('/playground?section=stress')
  await page.getByRole('button', { name: 'Apply random batch' }).click()
  await expect(page.getByTestId('stress-ticks')).toHaveText(
    '1 batches · 10 field updates',
  )
  const journal = await page.getByTestId('change-journal').innerText()
  await page.getByRole('button', { name: 'Reset seeded run' }).click()
  await page.getByRole('button', { name: 'Apply random batch' }).click()
  await expect(page.getByTestId('change-journal')).toHaveText(journal, {
    useInnerText: true,
  })
  await page.getByRole('button', { name: 'Start random updates' }).click()
  await expect(page.getByTestId('stress-ticks')).not.toHaveText(
    '1 batches · 10 field updates',
  )
  await page.getByRole('button', { name: 'Pause random updates' }).click()
  await page.getByLabel('Enable measurements').check()
  await expect(page.getByTestId('mounted-rows')).not.toHaveText('0')
  await page.getByRole('tree').focus()
  await page.getByRole('tree').press('End')
  await expect(page.getByRole('tree')).toBeFocused()
})

test('stress pulses are optional presentation and respect reduced motion', async ({
  page,
}) => {
  await page.goto('/playground?section=stress')
  await page
    .getByRole('combobox', { name: 'Services', exact: true })
    .selectOption('25')
  await page
    .getByRole('combobox', { name: 'Fields per batch' })
    .selectOption('1')
  await page.getByRole('button', { name: 'Expand 6', exact: true }).click()
  await page
    .getByRole('button', { name: 'Expand metrics', exact: true })
    .click()
  await page.getByRole('button', { name: 'Apply random batch' }).click()
  const updated = page
    .getByRole('treeitem', { name: 'requests: 578', exact: true })
    .locator('[data-stress-updated]')
  await expect(updated).toBeVisible()
  await expect(updated).toHaveCSS('animation-name', 'field-update')
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await expect(updated).toHaveCSS('animation-name', 'none')
  await page.getByRole('checkbox', { name: 'Pulse updated fields' }).uncheck()
  await expect(page.locator('[data-stress-updated]')).toHaveCount(0)
})

test('brand variables control typography and spacing', async ({ page }) => {
  await page.goto('/playground?section=customization&appearance=brand')
  await page
    .getByRole('combobox', { name: 'Font size', exact: true })
    .selectOption('16')
  await page
    .getByRole('combobox', { name: 'Row height', exact: true })
    .selectOption('40')
  await page
    .getByRole('combobox', { name: 'Indentation', exact: true })
    .selectOption('28')
  const root = page.locator('[data-rdi-root]')
  await expect(root).toHaveCSS('font-size', '16px')
  await expect(root.locator('[data-rdi-node]').first()).toHaveCSS(
    'height',
    '40px',
  )
  await page.getByText('Copy CSS variables', { exact: true }).click()
  await expect(
    page.locator('.lab-source').filter({ hasText: 'Copy CSS variables' }),
  ).toContainText('--rdi-indent: 28px')
})
