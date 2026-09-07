import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.locator('.json-disclosure > summary').click()
})
test('keyboard navigation, selection and actions restore focus', async ({
  page,
}) => {
  const tree = page.getByRole('tree', { name: 'Playground inspector' })
  await tree.focus()
  await tree.press('ArrowDown')
  await tree.press('ArrowRight')
  await tree.press('ArrowRight')
  await tree.press('Enter')
  await expect(tree.locator('[data-selected=true]')).toContainText('id')
  await tree.press('F2')
  const panel = page.locator('#playground [data-rdi-actions]')
  await expect(
    panel.getByRole('button', { name: 'Copy path', exact: true }),
  ).toBeVisible()
  await panel.getByRole('button', { name: 'Close actions' }).click()
  await expect(tree).toBeFocused()
})
test('search reveals hidden values and exposes result status', async ({
  page,
}) => {
  const area = page.locator('#playground')
  await area.getByRole('searchbox').fill('Nicholas')
  await expect(area.getByRole('button', { name: 'Next result' })).toBeEnabled()
  await area.getByRole('button', { name: 'Next result' }).click()
  await expect(area.locator('[data-selected=true]')).toContainText('Nicholas')
  await expect(area.getByRole('status')).toContainText('1 of 1')
})
test('half-million array is grouped and virtualized keyboard target stays mounted', async ({
  page,
}) => {
  await page
    .getByLabel('Inspect', { exact: true })
    .selectOption('500,000 items')
  const tree = page.getByRole('tree', { name: 'Playground inspector' })
  expect(await tree.getByRole('treeitem').count()).toBeLessThanOrEqual(101)
  await tree.focus()
  await tree.press('ArrowDown')
  await tree.press('ArrowRight')
  await tree.press('ArrowRight')
  await tree.press('ArrowRight')
  await tree.press('End')
  const active = await tree.getAttribute('aria-activedescendant')
  await expect(page.locator(`[id="${active}"]`)).toBeAttached()
  expect(await tree.locator('[data-rdi-node]').count()).toBeLessThan(120)
})
test('custom type, unstyled behavior and controlled integration', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Custom type', exact: true }).click()
  const area = page.locator('#customize')
  await expect(area.getByText('EUR 12.99', { exact: true })).toBeVisible()
  await area.getByRole('button', { name: 'Expand price' }).click()
  await expect(area.getByText('"EUR"', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Unstyled', exact: true }).click()
  await expect(area.locator('[data-rdi-unstyled]')).toBeVisible()
  await page
    .getByRole('button', { name: 'Expand user from application' })
    .click()
  await page
    .getByRole('tree', { name: 'Data inspector', exact: true })
    .getByText('"Nicholas"', { exact: true })
    .click()
  await expect(
    page.getByRole('complementary', { name: 'Selected node details' }),
  ).toContainText('$.user.name')
})
test('JSON input is parsed without evaluating JavaScript', async ({ page }) => {
  await page.getByLabel('JSON input', { exact: true }).fill('new Date()')
  await page.getByRole('button', { name: 'Inspect JSON', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Invalid JSON')
  await page.getByLabel('JSON input', { exact: true }).fill('{"safe":42}')
  await page.getByRole('button', { name: 'Inspect JSON', exact: true }).click()
  await expect(
    page.getByRole('tree', { name: 'JSON input inspector' }),
  ).toContainText('42')
})
test('automated accessibility checks for default and dark custom type', async ({
  page,
}) => {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.getByRole('button', { name: 'Dark', exact: true }).click()
  expect(
    (await new AxeBuilder({ page }).include('#customize').analyze()).violations,
  ).toEqual([])
})
test('mobile layout and RTL tree remain navigable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true)
  await page
    .locator('#playground')
    .evaluate((el) => el.setAttribute('dir', 'rtl'))
  const tree = page.getByRole('tree', { name: 'Playground inspector' })
  await tree.focus()
  await tree.press('ArrowDown')
  await tree.press('ArrowRight')
  await expect(tree.getByText('"Nicholas"', { exact: true })).toBeVisible()
})
test('virtualized End target remains visible after CSS row-height changes', async ({
  page,
}) => {
  await page
    .getByLabel('JSON input', { exact: true })
    .fill(JSON.stringify(Array.from({ length: 1000 }, (_, i) => i)))
  await page.getByRole('button', { name: 'Inspect JSON', exact: true }).click()
  const tree = page.getByRole('tree', { name: 'JSON input inspector' })
  await tree.focus()
  await tree.press('End')
  await page
    .locator('.json-section [data-rdi-root]')
    .evaluate((el) =>
      (el as HTMLElement).style.setProperty('--rdi-row-height', '44px'),
    )
  await expect(async () => {
    const active = await tree.getAttribute('aria-activedescendant')
    const target = page.locator(`[id="${active}"] [data-rdi-node]`)
    const item = await target.boundingBox(),
      box = await tree.boundingBox()
    expect(item).not.toBeNull()
    expect(box).not.toBeNull()
    expect(item!.y + item!.height).toBeLessThanOrEqual(box!.y + box!.height + 2)
    expect(item!.y).toBeGreaterThanOrEqual(box!.y - 2)
  }).toPass()
})
test('CSS-only brand colors, toggle-only slot and added actions preserve defaults', async ({
  page,
}) => {
  const area = page.locator('#customize')
  await expect(area.locator('[data-rdi-root]')).toHaveCSS(
    'background-color',
    'rgb(247, 251, 249)',
  )
  await page.getByRole('button', { name: 'Toggle', exact: true }).click()
  await expect(area.getByRole('button', { name: 'Expand price' })).toHaveText(
    '+',
  )
  await area.getByRole('button', { name: 'Expand price' }).click()
  await expect(area.getByText('12.99', { exact: true })).toBeVisible()
  await page
    .getByRole('button', { name: 'Custom actions', exact: true })
    .click()
  await area.getByText('customer', { exact: true }).click()
  await area.getByRole('button', { name: 'Node actions' }).click()
  await expect(
    area.getByRole('button', { name: 'Copy path', exact: true }),
  ).toBeVisible()
  await area.getByRole('button', { name: 'Open in application' }).click()
  await expect(area.locator('output')).toContainText('Customer 42 opened')
})

test('reference clicks, action jumps and Enter activate their targets', async ({
  page,
}) => {
  const area = page.locator('#playground')
  const tree = area.getByRole('tree')
  await tree
    .getByRole('button', { name: 'Jump to original: $.user', exact: true })
    .click()
  await expect(tree.locator('[data-selected=true]')).toContainText('user')
  await expect(tree.locator('[data-focused=true] [data-rdi-key]')).toHaveText(
    'user',
  )
  await expect(tree).toBeFocused()
  await tree.press('Enter')
  await expect(
    tree.getByRole('button', { name: 'Collapse user' }),
  ).toBeVisible()
  await tree.press('Enter')
  await expect(tree.getByRole('button', { name: 'Expand user' })).toBeVisible()
  await tree.press('ArrowDown')
  await tree.press('F2')
  await area
    .getByRole('button', { name: 'Jump to original', exact: true })
    .click()
  await expect(tree.locator('[data-focused=true] [data-rdi-key]')).toHaveText(
    'user',
  )
  await tree.press('End')
  await tree.press('Enter')
  await expect(tree.locator('[data-focused=true] [data-rdi-key]')).toHaveText(
    '$',
  )
  await area.getByRole('searchbox').fill('Nicholas')
  await expect(area.getByRole('button', { name: 'Next result' })).toBeEnabled()
  await area.getByRole('searchbox').press('Enter')
  await expect(tree.locator('[data-selected=true]')).toContainText('Nicholas')
})
