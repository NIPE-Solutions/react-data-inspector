import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('homepage proofs use actual values and safe inspection', async ({
  page,
}) => {
  await page.goto('/')
  const hero = page.getByRole('tree', { name: 'Hero object graph' })
  await expect(hero).toContainText('9007199254740993n')
  await expect(hero).toContainText('undefined')
  await expect(hero).toContainText('same reference')
  await expect(hero).toContainText('circular reference')
  await page.getByRole('button', { name: 'Inspect again', exact: true }).click()
  const safe = page.locator('#safe-inspection')
  await expect(safe.getByRole('tree')).toContainText('Getter')
  await expect(safe.locator('.inspection-counters')).toHaveText(
    'Getter calls 0Function calls 0Promise subscriptions 0',
  )
  await page
    .getByRole('button', { name: 'Opaque by design', exact: true })
    .click()
  const museum = page.getByRole('tree', { name: 'Type museum inspector' })
  await expect(museum).toContainText('Promise')
  await expect(museum).toContainText('ReactElement')
  await expect(museum).toContainText('HTMLDivElement')
  expect(
    await page
      .getByRole('tree', { name: 'Half million values' })
      .locator('[data-rdi-node]')
      .count(),
  ).toBeLessThan(110)
})

test('documentation is rendered without JavaScript and carries distinct metadata', async ({
  browser,
  request,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    baseURL: baseURL!,
  })
  const page = await context.newPage()
  await page.goto('/concepts/safe-inspection')
  await expect(
    page.getByRole('heading', {
      name: 'Safe inspection',
      exact: true,
      level: 1,
    }),
  ).toBeVisible()
  await expect(page.locator('link[rel=canonical]')).toHaveAttribute(
    'href',
    'https://react-data-inspector.nipesolutions.com/concepts/safe-inspection',
  )
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    'content',
    'Safe inspection · React Data Inspector',
  )
  await expect(
    page
      .getByRole('navigation', { name: 'Documentation', exact: true })
      .getByRole('link', { name: 'Search', exact: true }),
  ).toBeVisible()
  const search = await request.get('/docs/search')
  expect(await search.text()).toContain('<h1>Search</h1>')
  const sitemap = await request.get('/sitemap.xml')
  expect(await sitemap.text()).toContain(
    '/guides/migrate-from-uiw-react-json-view',
  )
  await context.close()
})

test('static pages hydrate without errors and documentation links work', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  for (const route of [
    '/',
    '/docs/search',
    '/guides/customization',
    '/reference/types',
    '/playground',
  ]) {
    await page.goto(route)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    if (route === '/')
      await page
        .getByRole('button', { name: 'Structured', exact: true })
        .click()
    if (route === '/guides/customization')
      await page
        .getByRole('button', { name: 'Custom type', exact: true })
        .click()
  }
  expect(errors).toEqual([])
})

test('docs, product fragments and the type museum remain accessible on mobile', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/reference/types')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([])
  await page.goto('/')
  await page
    .getByRole('button', { name: 'Background jobs', exact: true })
    .click()
  await expect(
    page.getByRole('tree', { name: 'Embedded product inspector' }),
  ).toContainText('job_0042')
  await page
    .getByRole('button', { name: 'Error investigation', exact: true })
    .click()
  await expect(
    page.getByRole('tree', { name: 'Embedded product inspector' }),
  ).toContainText('Could not normalize source')
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true)
})
