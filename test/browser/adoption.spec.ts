import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('documentation search finds body content without hiding navigation', async ({
  page,
}) => {
  await page.goto('/docs')
  await page
    .getByRole('searchbox', { name: 'Search documentation' })
    .fill('150')
  const results = page.getByRole('list', {
    name: 'Documentation search results',
  })
  await expect(
    results.getByRole('link', { name: 'Search', exact: true }),
  ).toBeVisible()
  await expect(results).toContainText('150')
  await expect(
    page
      .getByRole('navigation', { name: 'Documentation', exact: true })
      .getByRole('link', { name: 'Expansion', exact: true }),
  ).toBeVisible()
  await results.getByRole('link', { name: 'Search', exact: true }).click()
  await expect(page).toHaveURL(/\/docs\/search$/)
})

test('homepage directs JSON experiments to playground and exposes legal and community links', async ({
  page,
}) => {
  await page.goto('/')
  await expect(page.getByLabel('JSON input', { exact: true })).toHaveCount(0)
  await expect(
    page.getByRole('link', { name: '★ Star React Data Inspector on GitHub ↗' }),
  ).toHaveAttribute(
    'href',
    'https://github.com/NIPE-Solutions/react-data-inspector',
  )
  await page
    .getByRole('link', {
      name: 'Want to try your own data? Open the full Playground →',
    })
    .click()
  await expect(page.getByLabel('JSON input', { exact: true })).toBeVisible()
  await page
    .getByRole('navigation', { name: 'Footer' })
    .getByRole('link', { name: 'Privacy', exact: true })
    .click()
  await expect(
    page.getByRole('heading', { name: 'Privacy', level: 1 }),
  ).toBeVisible()
  await expect(page.getByRole('main')).toContainText('system fonts')
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
})

for (const width of [1440, 1024, 768, 430, 390]) {
  test(`editorial layout contains content at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 960 })
    for (const route of [
      '/',
      '/docs/search',
      '/reference/styling',
      '/imprint',
      '/privacy',
    ]) {
      await page.goto(route)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        route,
      ).toBe(true)
      if (route === '/docs/search' && width < 761) {
        await page.getByRole('button', { name: 'Browse documentation' }).click()
        await expect(
          page.getByRole('searchbox', { name: 'Search documentation' }),
        ).toBeVisible()
      }
    }
  })
}
