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
  await expect(tree.locator('[data-focused=true] [data-rdi-key]')).toHaveText(
    '[999]',
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
  await expect(tree.locator('[data-focused=true]')).toContainText('Array(1000)')
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
