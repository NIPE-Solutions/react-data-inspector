import { readFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
const pkg = JSON.parse(await readFile('package.json', 'utf8'))
const lock = JSON.parse(await readFile('package-lock.json', 'utf8'))
if (
  process.env.GITHUB_REF_TYPE !== 'tag' ||
  process.env.GITHUB_REF_NAME !== `v${pkg.version}`
)
  throw Error('Release tag must exactly match the package version')
if (
  !/^\d+\.\d+\.\d+-beta\.\d+$/.test(pkg.version) ||
  pkg.publishConfig.tag !== 'beta'
)
  throw Error('This release workflow publishes beta versions only')
if (lock.version !== pkg.version || lock.packages[''].version !== pkg.version)
  throw Error('Package lock version does not match')
execFileSync('git', ['merge-base', '--is-ancestor', 'HEAD', 'origin/main'])
const response = await fetch(
  `https://registry.npmjs.org/${encodeURIComponent(pkg.name)}/${pkg.version}`,
  { signal: AbortSignal.timeout(20000) },
)
if (response.status !== 404)
  throw Error(
    response.ok
      ? 'This version already exists; bump the version for a new release'
      : `Registry verification failed: ${response.status}`,
  )
console.log(`Verified release ${pkg.name}@${pkg.version} from main`)
