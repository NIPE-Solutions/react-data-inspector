import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('classic presentation preserves virtual boundaries, selection and uniform row height', async ({
  page,
}) => {
  await page.goto('/playground?section=performance&size=1000')
  const tree = page.getByRole('tree', { name: 'Scenario inspector' })
  await expect(tree.locator('[data-rdi-node]')).not.toHaveCount(1001)
  const height = await tree
    .locator('[data-rdi-node]')
    .first()
    .evaluate((node) => node.getBoundingClientRect().height)
  await tree.focus()
  await tree.press('End')
  await tree.press('Space')
  await expect(tree.getByRole('treeitem', { selected: true })).toHaveAttribute(
    'aria-label',
    '999: 999',
  )
  await page
    .getByRole('combobox', { name: 'Presentation', exact: true })
    .selectOption('classic')
  await expect(page.locator('[data-rdi-root]')).toHaveAttribute(
    'data-rdi-presentation',
    'classic',
  )
  await expect(tree.getByRole('treeitem', { selected: true })).toHaveAttribute(
    'aria-label',
    '999: 999',
  )
  await expect(tree.locator('[data-focused=true] [data-rdi-key]')).toHaveCount(
    0,
  )
  expect(await tree.locator('[data-rdi-node]').count()).toBeLessThan(100)
  const heights = await tree
    .locator('[data-rdi-node]')
    .evaluateAll((nodes) =>
      nodes.map((node) => node.getBoundingClientRect().height),
    )
  expect(new Set(heights)).toEqual(new Set([height]))
  await tree.focus()
  await tree.press('Home')
  await expect(tree.locator('[data-focused=true] [data-rdi-value]')).toHaveText(
    '[',
  )
  await tree.press('ArrowRight')
  await tree.press('Space')
  await expect(tree.getByRole('treeitem', { selected: true })).toHaveAttribute(
    'aria-label',
    '0: 0',
  )
  await tree.press('F2')
  await expect(
    page.getByRole('button', { name: 'Copy path', exact: true }),
  ).toBeVisible()
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

test('classic grouped 500k arrays expand without adding delimiter navigation rows', async ({
  page,
}) => {
  await page.goto('/playground?section=performance&size=500000')
  await page
    .getByRole('combobox', { name: 'Presentation', exact: true })
    .selectOption('classic')
  const tree = page.getByRole('tree', { name: 'Scenario inspector' })
  await expect(tree.locator('[data-rdi-node]')).toHaveCount(51)
  await tree.focus()
  await tree.press('ArrowDown')
  await tree.press('Enter')
  await tree.press('ArrowDown')
  await tree.press('Enter')
  await tree.press('ArrowDown')
  await tree.press('Space')
  await expect(tree.getByRole('treeitem', { selected: true })).toHaveAttribute(
    'aria-label',
    '0: 0',
  )
  expect(await tree.locator('[data-rdi-node]').count()).toBeLessThan(100)
  await tree.press('End')
  await expect(tree.locator('[data-focused=true]')).toContainText(
    '[490000 … 499999]',
  )
  await tree.press('Home')
  await tree.press('Enter')
  await expect(tree.getByRole('treeitem')).toHaveCount(1)
})

test('multiline closing offsets stay correct across virtual gaps and keyboard navigation', async ({
  page,
}) => {
  await page.goto('/playground?section=json')
  await page
    .getByRole('textbox', { name: 'JSON input' })
    .fill(JSON.stringify(Array.from({ length: 300 }, (_, id) => ({ id }))))
  await page.getByRole('button', { name: 'Inspect JSON', exact: true }).click()
  const tree = page.getByRole('tree', { name: 'JSON inspector' })
  await tree.focus()
  await tree.press('End')
  await tree.press('ArrowRight')
  await tree.press('Home')
  await tree.press('ArrowDown')
  await tree.press('ArrowRight')
  await tree.press('ArrowDown')
  await tree.press('ArrowDown')
  await tree.press('ArrowRight')
  const inspectorScroll = await tree.evaluate((node) => node.scrollHeight)
  const rowHeight = await tree
    .locator('[data-rdi-node]')
    .first()
    .evaluate((node) => node.getBoundingClientRect().height)
  await page
    .getByRole('combobox', { name: 'Presentation', exact: true })
    .selectOption('classic')
  // Root and three expanded objects each contribute one closing visual line.
  await expect
    .poll(() => tree.evaluate((node) => node.scrollHeight))
    .toBe(inspectorScroll + 4 * rowHeight)
  await tree.focus()
  await tree.press('Home')
  await tree.press('ArrowDown')
  await tree.press('ArrowDown')
  await tree.press('ArrowDown')
  await tree.press('Space')
  await expect(tree.getByRole('treeitem', { selected: true })).toHaveAttribute(
    'aria-label',
    '1: Object',
  )
  await tree.press('End')
  await expect(tree.locator('[data-focused=true]')).toContainText('299')
  expect(await tree.locator('[data-rdi-node]').count()).toBeLessThan(100)
  const closing = tree.locator('[data-rdi-closing]')
  await expect(closing.last()).toContainText(']')
  const heights = await closing.evaluateAll((nodes) =>
    nodes.map((node) => node.getBoundingClientRect().height),
  )
  expect(new Set(heights)).toEqual(new Set([rowHeight]))
  await tree.press('Home')
  await tree.press('ArrowLeft')
  await expect(tree.locator('[data-rdi-closing]')).toHaveCount(0)
  await expect(tree.getByRole('treeitem')).toHaveCount(1)
})

test('deep classic closing lines stay outside data navigation while contributing virtual height', async ({
  page,
}) => {
  let value: unknown = 'leaf'
  for (let depth = 0; depth < 120; depth++) value = { child: value }
  await page.goto('/playground?section=json')
  await page
    .getByRole('textbox', { name: 'JSON input' })
    .fill(JSON.stringify(value))
  await page.getByRole('button', { name: 'Inspect JSON', exact: true }).click()
  const tree = page.getByRole('tree', { name: 'JSON inspector' })
  await tree.focus()
  for (let depth = 1; depth < 100; depth++) {
    await tree.press('ArrowRight')
    await tree.press('ArrowRight')
  }
  await tree.press('End')
  await expect(tree.locator('[data-focused=true]')).toContainText(
    'Max depth reached',
  )
  const before = await tree.evaluate((node) => node.scrollHeight)
  const height = await tree
    .locator('[data-rdi-node]')
    .first()
    .evaluate((node) => node.getBoundingClientRect().height)
  await page
    .getByRole('combobox', { name: 'Presentation', exact: true })
    .selectOption('classic')
  await expect
    .poll(() => tree.evaluate((node) => node.scrollHeight))
    .toBe(before + 100 * height)
  await tree.evaluate((node) => {
    node.scrollTop = node.scrollHeight
  })
  await expect
    .poll(() => tree.locator('[data-rdi-closing]').count())
    .toBeGreaterThan(0)
  expect(await tree.locator('[data-rdi-node]').count()).toBeLessThan(40)
  await tree.focus()
  await tree.press('Home')
  await expect(tree.locator('[data-focused=true]')).toHaveAttribute(
    'data-depth',
    '0',
  )
  await expect
    .poll(() => tree.evaluate((node) => node.scrollTop))
    .toBeLessThanOrEqual(height)
  await tree.press('End')
  await expect(tree.locator('[data-focused=true]')).toHaveAttribute(
    'data-depth',
    '100',
  )
  await expect(tree.locator('[data-focused=true]')).toContainText(
    'Max depth reached',
  )
})
