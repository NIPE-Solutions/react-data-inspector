import { appendFile, readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'

const { VERCEL_TOKEN, VERCEL_ORG_ID, VERCEL_PROJECT_ID, DEPLOY_ENVIRONMENT } =
  process.env
if (!VERCEL_TOKEN || !VERCEL_ORG_ID || !VERCEL_PROJECT_ID)
  throw new Error('Vercel deployment credentials and project IDs are required')
if (!['production', 'preview'].includes(DEPLOY_ENVIRONMENT))
  throw new Error('DEPLOY_ENVIRONMENT must be production or preview')

async function api(path, body) {
  const response = await fetch(
    `https://api.vercel.com${path}?teamId=${encodeURIComponent(VERCEL_ORG_ID)}`,
    {
      method: body ? 'POST' : 'GET',
      headers: {
        Authorization: `Bearer ${VERCEL_TOKEN}`,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(30000),
    },
  )
  const data = await response.json()
  if (!response.ok)
    throw new Error(
      `Vercel ${response.status}: ${String(data.error?.message ?? 'Request failed').replaceAll(VERCEL_TOKEN, '[redacted]')}`,
    )
  return data
}

// Only compiled public assets are sent; repository sources and local env files stay local.
async function files(directory, prefix = '') {
  const entries = await readdir(directory, { withFileTypes: true })
  const result = []
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = join(directory, entry.name)
    const file = `${prefix}${entry.name}`
    if (entry.isDirectory()) result.push(...(await files(path, `${file}/`)))
    else if (entry.isFile())
      result.push({
        file,
        data: (await readFile(path)).toString('base64'),
        encoding: 'base64',
      })
    else throw new Error(`Unsupported build entry: ${file}`)
  }
  return result
}

const assets = await files('website/dist')
if (!assets.some(({ file }) => file === 'index.html'))
  throw new Error('Build the website before deploying')
const config = JSON.parse(await readFile('vercel.json', 'utf8'))
const settings = {
  framework: null,
  buildCommand: null,
  installCommand: null,
  outputDirectory: null,
}
assets.push({
  file: 'vercel.json',
  data: JSON.stringify({ ...settings, rewrites: config.rewrites }),
  encoding: 'utf-8',
})
const project = await api(
  `/v9/projects/${encodeURIComponent(VERCEL_PROJECT_ID)}`,
)
const deployment = await api('/v13/deployments', {
  name: project.name,
  project: VERCEL_PROJECT_ID,
  files: assets,
  projectSettings: settings,
  ...(DEPLOY_ENVIRONMENT === 'production' ? { target: 'production' } : {}),
  meta: { source: 'github-actions', commit: process.env.GITHUB_SHA ?? 'local' },
})
const deadline = Date.now() + 300000
while (Date.now() < deadline) {
  const state = await api(
    `/v13/deployments/${encodeURIComponent(deployment.id)}`,
  )
  if (state.readyState === 'READY') {
    const url = new URL(`https://${state.url}`)
    if (!url.hostname.endsWith('.vercel.app'))
      throw new Error('Unexpected deployment hostname')
    console.log(`Website ready: ${url.href}`)
    if (process.env.GITHUB_OUTPUT)
      await appendFile(process.env.GITHUB_OUTPUT, `url=${url.href}\n`)
    break
  }
  if (['ERROR', 'CANCELED'].includes(state.readyState))
    throw new Error(
      `Deployment ${deployment.id} ended with ${state.readyState}`,
    )
  await setTimeout(2000)
  if (Date.now() >= deadline)
    throw new Error(`Deployment ${deployment.id} timed out`)
}
