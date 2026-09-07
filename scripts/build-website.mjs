import { spawnSync } from 'node:child_process'
import { mkdir, readFile, writeFile, copyFile, rm } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
// Publication is checked at build time so installation copy follows the registry.
const response = await fetch(
  'https://registry.npmjs.org/@nipe-solutions%2freact-data-inspector',
  { signal: AbortSignal.timeout(20000) },
)
let version = ''
if (response.ok) {
  const data = await response.json()
  version = data['dist-tags']?.latest || data['dist-tags']?.alpha || ''
  if (!/^\d+\.\d+\.\d+(?:-[\w.-]+)?$/.test(version))
    throw Error('Registry returned no valid release version')
} else if (response.status !== 404)
  throw Error(`Cannot verify npm publication: ${response.status}`)
process.env.VITE_NPM_VERSION = version
const run = (args) => {
  const result = spawnSync('npx', args, { stdio: 'inherit', env: process.env })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
run(['vite', 'build', '--config', 'website/vite.config.ts'])
run([
  'vite',
  'build',
  '--config',
  'website/vite.config.ts',
  '--ssr',
  'entry-server.tsx',
  '--outDir',
  '../.website-ssr',
])
const { render, routes, metadata } = await import(
  pathToFileURL(resolve('.website-ssr/entry-server.js')).href
)
const template = await readFile('website/dist/index.html', 'utf8')
const escape = (value) =>
  value.replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ],
  )
for (const path of [...routes.map((route) => route.path), '/404']) {
  const meta = metadata(path)
  const tags = `<title>${escape(meta.title)}</title>
<meta name="description" content="${escape(meta.description)}" />
<link rel="canonical" href="${meta.canonical}" />
<meta property="og:type" content="website" />
<meta property="og:site_name" content="React Data Inspector" />
<meta property="og:title" content="${escape(meta.title)}" />
<meta property="og:description" content="${escape(meta.description)}" />
<meta property="og:url" content="${meta.canonical}" />
<meta property="og:image" content="https://react-data-inspector.nipesolutions.com/social.png" />
<meta property="og:image:width" content="1200" /><meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="React Data Inspector: Inspect the object you actually have. Shared identity and circular reference diagram." />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${escape(meta.title)}" />
<meta name="twitter:description" content="${escape(meta.description)}" />
<meta name="twitter:image" content="https://react-data-inspector.nipesolutions.com/social.png" />
${meta.index ? '' : '<meta name="robots" content="noindex" />'}`
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: 'React Data Inspector',
    description: 'A structured JavaScript data inspector for React.',
    url: 'https://react-data-inspector.nipesolutions.com',
    codeRepository: 'https://github.com/NIPE-Solutions/react-data-inspector',
    programmingLanguage: ['TypeScript', 'JavaScript'],
    runtimePlatform: 'React 18.3 and React 19',
    license: 'https://opensource.org/license/mit',
    ...(version
      ? {
          version,
          downloadUrl: `https://www.npmjs.com/package/@nipe-solutions/react-data-inspector/v/${version}`,
        }
      : {}),
  }
  const html = template
    .replace(/<title>[\s\S]*?<\/title>/, '')
    .replace(/<meta\s+name="description"[\s\S]*?\/>/, '')
    .replace(
      '</head>',
      `${tags}\n<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>\n</head>`,
    )
    .replace(
      '<div id="root"></div>',
      () => `<div id="root">${render(path)}</div>`,
    )
  const file =
    path === '/' ? 'website/dist/index.html' : `website/dist${path}.html`
  await mkdir(dirname(file), { recursive: true })
  await writeFile(file, html)
}
await writeFile(
  'website/dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((route) => `<url><loc>https://react-data-inspector.nipesolutions.com${route.path === '/' ? '' : route.path}</loc></url>`).join('')}</urlset>`,
)
await writeFile(
  'website/dist/robots.txt',
  'User-agent: *\nAllow: /\nSitemap: https://react-data-inspector.nipesolutions.com/sitemap.xml\n',
)
await mkdir('website/dist/evidence', { recursive: true })
await copyFile('benchmarks/results.json', 'website/dist/evidence/model.json')
await copyFile('benchmarks/README.md', 'website/dist/evidence/methodology.md')
await rm('.website-ssr', { recursive: true, force: true })
console.log(
  `Prerendered ${routes.length} routes; npm: ${version || 'not published'}.`,
)
