import { readFile, readdir, access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { JSDOM } from 'jsdom'
import ts from 'typescript'
const base = 'https://react-data-inspector.nipesolutions.com'
const sitemap = await readFile('website/dist/sitemap.xml', 'utf8')
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(
  (match) => match[1],
)
if (urls.length < 22) throw Error('Missing documentation routes')
const pages = new Map()
for (const url of urls) {
  const path = new URL(url).pathname
  const file =
    path === '/' ? 'website/dist/index.html' : `website/dist${path}.html`
  const doc = new JSDOM(await readFile(file, 'utf8')).window.document
  if (doc.querySelectorAll('h1').length !== 1)
    throw Error(`One page heading required: ${path}`)
  if (doc.querySelector('link[rel=canonical]')?.getAttribute('href') !== url)
    throw Error(`Wrong canonical: ${path}`)
  for (const selector of [
    'title',
    'meta[name=description]',
    'meta[property="og:title"]',
    'meta[property="og:image"]',
    'meta[name="twitter:card"]',
    'script[type="application/ld+json"]',
  ])
    if (!doc.querySelector(selector)) throw Error(`${path} missing ${selector}`)
  pages.set(path, doc)
}
if (new Set([...pages.values()].map((doc) => doc.title)).size !== pages.size)
  throw Error('Duplicate page titles')
for (const [path, doc] of pages) {
  for (const anchor of doc.querySelectorAll('a[href]')) {
    const url = new URL(anchor.getAttribute('href'), base + path)
    if (url.origin !== base) continue
    const target = url.pathname
    if (pages.has(target)) {
      if (
        url.hash &&
        !pages.get(target).getElementById(decodeURIComponent(url.hash.slice(1)))
      )
        throw Error(`Broken fragment: ${path} -> ${url}`)
    } else await access(`website/dist${target}`)
  }
}
// Typecheck every RDI documentation example as its own module against public source.
// Competitor 'before' examples are verified against pinned package APIs in their guides.
const snippets = new Map()
for (const file of await readdir('website/docs')) {
  const source = await readFile(`website/docs/${file}`, 'utf8')
  let index = 0
  for (const match of source.matchAll(/```tsx?\n([\s\S]*?)```/g)) {
    if (
      /from ['"](?:react18-json-view|react-json-view-lite|@uiw\/react-json-view)['"]/.test(
        match[1],
      )
    )
      continue
    snippets.set(resolve(`website/docs/${file}-${index++}.tsx`), match[1])
  }
}
const options = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
  skipLibCheck: true,
  noEmit: true,
  paths: { '@nipe-solutions/react-data-inspector': [resolve('src/index.ts')] },
}
const host = ts.createCompilerHost(options)
const read = host.readFile,
  exists = host.fileExists
host.readFile = (file) => snippets.get(file) ?? read(file)
host.fileExists = (file) => snippets.has(file) || exists(file)
const program = ts.createProgram(
  [...snippets.keys(), resolve('website/env.d.ts')],
  options,
  host,
)
const diagnostics = ts.getPreEmitDiagnostics(program)
if (diagnostics.length) {
  console.error(
    ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (f) => f,
      getCurrentDirectory: () => process.cwd(),
      getNewLine: () => '\n',
    }),
  )
  process.exit(1)
}
console.log(
  `Verified ${pages.size} static routes, metadata, internal links and ${snippets.size} compiled documentation examples.`,
)
