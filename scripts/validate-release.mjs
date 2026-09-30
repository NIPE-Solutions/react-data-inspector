import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import console from 'node:console'
import { createHash, randomUUID } from 'node:crypto'
import {
  appendFile,
  link,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import {
  createNpmPaths,
  formatCommandError,
  runNpm,
  validatePackedFiles,
  verifyTarballConsumers,
} from './verify-package.mjs'

const execFileAsync = promisify(execFile)
const repositoryRoot = path.resolve(import.meta.dirname, '..')
const expectedName = '@nipe-solutions/react-data-inspector'
const expectedRepository = {
  type: 'git',
  url: 'git+https://github.com/NIPE-Solutions/react-data-inspector.git',
}
const stableSemver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/

export function validateReleaseMetadata(packageJson, packageLock, changelog) {
  assert.equal(packageJson.name, expectedName, 'Unexpected package name')
  assert.deepEqual(
    packageJson.repository,
    expectedRepository,
    'Unexpected package repository',
  )
  assert.match(
    packageJson.version,
    stableSemver,
    `Package version ${packageJson.version} must be a stable semantic version`,
  )
  assert.match(
    changelog,
    new RegExp(
      `^## ${escapeRegExp(packageJson.version)} — \\d{4}-\\d{2}-\\d{2}$`,
      'm',
    ),
    `CHANGELOG.md must contain a dated release entry for ${packageJson.version}`,
  )
  assert.equal(
    packageJson.publishConfig?.access,
    'public',
    'publishConfig must enforce public access',
  )
  assert.equal(
    packageJson.publishConfig?.provenance,
    true,
    'publishConfig must enable provenance',
  )
  assert.equal(
    packageJson.publishConfig?.tag,
    'latest',
    'Stable releases must use the latest dist-tag',
  )
  assert.deepEqual(
    packageJson.dependencies ?? {},
    {},
    'Stable releases must have zero runtime dependencies',
  )
  assert.equal(
    packageLock.version,
    packageJson.version,
    'Package lock version does not match the release version',
  )
  assert.equal(
    packageLock.packages?.['']?.version,
    packageJson.version,
    'Package lock root version does not match the release version',
  )

  return {
    name: packageJson.name,
    version: packageJson.version,
    channel: 'latest',
  }
}

export function validateRepositoryContext({
  branch,
  dirtyEntries,
  dryRun,
  githubActions,
  eventName,
  refName,
  refType,
  version,
}) {
  if (githubActions) {
    assert.equal(
      dirtyEntries.length,
      0,
      'GitHub release tracked state must be clean',
    )
    assert.equal(
      eventName,
      'release',
      'GitHub verification requires a release event',
    )
    assert.equal(refType, 'tag', 'GitHub release verification requires a tag')
    assert.equal(
      refName,
      `v${version}`,
      `Release tag ${refName} must exactly match v${version}`,
    )
    return []
  }

  assert.equal(dryRun, true, 'Local release verification is dry-run only')
  const messages = []
  if (dirtyEntries.length > 0) {
    const noun = dirtyEntries.length === 1 ? 'change' : 'changes'
    messages.push(
      `Local dry-run: allowing ${dirtyEntries.length} tracked working-tree ${noun} for inspection`,
    )
  }
  if (branch && branch !== 'main')
    messages.push(`Local dry-run: running from feature branch ${branch}`)
  return messages
}

export function assertRegistryVersionAbsent(publishedVersion, version) {
  assert.notEqual(
    publishedVersion,
    version,
    `${expectedName}@${version} already exists on the npm registry`,
  )
}

export function parseArguments(args) {
  const usage = 'Usage: validate-release.mjs --dry-run [--output directory]'
  assert.equal(args[0], '--dry-run', usage)
  if (args.length === 1) return { dryRun: true, outputDirectory: undefined }
  assert.equal(args.length, 3, usage)
  assert.equal(args[1], '--output', usage)
  assert.ok(args[2], usage)
  return { dryRun: true, outputDirectory: args[2] }
}

export async function createArtifactManifest(pack, tarballPath, release) {
  assert.equal(
    pack.filename,
    path.basename(tarballPath),
    'Pack metadata filename does not match the release tarball',
  )
  const digest = createHash('sha512')
    .update(await readFile(tarballPath))
    .digest()
  return {
    name: release.name,
    version: release.version,
    channel: release.channel,
    filename: pack.filename,
    integrity: `sha512-${digest.toString('base64')}`,
    sha512: digest.toString('hex'),
    files: pack.files.map(({ path: file }) => file).sort(),
  }
}

export async function verifyRelease({ dryRun = false, outputDirectory } = {}) {
  assert.equal(dryRun, true, 'Release verification requires --dry-run')

  const [packageSource, lockSource, changelog, expectedFilesSource] =
    await Promise.all([
      readFile(path.join(repositoryRoot, 'package.json'), 'utf8'),
      readFile(path.join(repositoryRoot, 'package-lock.json'), 'utf8'),
      readFile(path.join(repositoryRoot, 'CHANGELOG.md'), 'utf8'),
      readFile(path.join(import.meta.dirname, 'package-files.json'), 'utf8'),
    ])
  const packageJson = JSON.parse(packageSource)
  const packageLock = JSON.parse(lockSource)
  const expectedFiles = JSON.parse(expectedFilesSource)
  const release = validateReleaseMetadata(packageJson, packageLock, changelog)

  assert.match(
    packageJson.scripts?.check ?? '',
    /npm run test:release-policy/,
    'The quality gate must include release policy tests',
  )
  assert.doesNotMatch(
    packageJson.scripts?.check ?? '',
    /release:check/,
    'The normal quality gate must not invoke release verification',
  )

  const [{ stdout: status }, { stdout: branch }] = await Promise.all([
    run('git', ['status', '--porcelain', '--untracked-files=no']),
    run('git', ['branch', '--show-current']),
  ])
  const dirtyEntries = status.trim() ? status.trimEnd().split('\n') : []
  for (const message of validateRepositoryContext({
    branch: branch.trim(),
    dirtyEntries,
    dryRun,
    githubActions: process.env.GITHUB_ACTIONS === 'true',
    eventName: process.env.GITHUB_EVENT_NAME,
    refName: process.env.GITHUB_REF_NAME,
    refType: process.env.GITHUB_REF_TYPE,
    version: release.version,
  })) {
    console.log(message)
  }

  const workingRoot = await mkdtemp(
    path.join(tmpdir(), 'react-data-inspector-release-'),
  )
  const packDirectory = outputDirectory
    ? path.resolve(repositoryRoot, outputDirectory)
    : path.join(workingRoot, 'artifact')

  try {
    const npmPaths = await createNpmPaths(workingRoot)
    await mkdir(packDirectory)
    const { stdout } = await runNpm(
      ['pack', repositoryRoot, '--json', '--pack-destination', packDirectory],
      npmPaths.workspace,
      npmPaths,
    )
    const [pack] = JSON.parse(stdout)
    assert.ok(pack, 'npm pack did not report an artifact')

    const expectedFilename =
      `${release.name.replace(/^@/, '').replaceAll('/', '-')}-` +
      `${release.version}.tgz`
    assert.equal(
      pack.filename,
      expectedFilename,
      'npm pack returned an unexpected artifact filename',
    )
    validatePackedFiles(
      pack.files.map(({ path: file }) => file),
      expectedFiles,
    )
    assert.ok(
      pack.size < 40_000,
      `Compressed package must be below 40,000 bytes: ${pack.size}`,
    )

    const tarballPath = path.join(packDirectory, pack.filename)
    await verifyTarballConsumers(tarballPath)
    const publishedVersion = await readRegistryVersion(
      release.name,
      release.version,
      npmPaths,
    )
    assertRegistryVersionAbsent(publishedVersion, release.version)

    await runVisibleNpm(
      [
        'publish',
        '--dry-run',
        '--ignore-scripts',
        '--provenance',
        '--access',
        'public',
        '--tag',
        release.channel,
        tarballPath,
      ],
      npmPaths.workspace,
      npmPaths,
    )

    const manifest = await createArtifactManifest(pack, tarballPath, release)
    const manifestPath = path.join(packDirectory, 'release-manifest.json')
    await writeArtifactManifest(manifestPath, manifest)
    if (outputDirectory) {
      await writeGitHubOutputs({ tarball: pack.filename })
      console.log(`Verified artifact preserved at ${tarballPath}`)
    }
    console.log(
      `Release dry-run passed for ${release.name}@${release.version}; nothing was published`,
    )
    return manifest
  } finally {
    await rm(workingRoot, { recursive: true, force: true })
  }
}

export async function writeArtifactManifest(manifestPath, manifest) {
  const temporaryPath = `${manifestPath}.${randomUUID()}.tmp`
  try {
    await writeFile(temporaryPath, `${JSON.stringify(manifest, null, 2)}\n`, {
      flag: 'wx',
    })
    await link(temporaryPath, manifestPath)
  } finally {
    await rm(temporaryPath, { force: true })
  }
}

async function readRegistryVersion(name, version, npmPaths) {
  try {
    const { stdout } = await runNpm(
      ['view', `${name}@${version}`, 'version', '--json'],
      npmPaths.workspace,
      npmPaths,
    )
    const parsed = JSON.parse(stdout)
    return typeof parsed === 'string' ? parsed : undefined
  } catch (error) {
    const output = `${String(error.stdout ?? '')}\n${String(error.stderr ?? '')}`
    if (/E404|404 Not Found/.test(output)) return undefined
    throw error
  }
}

async function writeGitHubOutputs(outputs) {
  if (!process.env.GITHUB_OUTPUT) return
  const lines = Object.entries(outputs)
    .map(([name, value]) => `${name}=${value}`)
    .join('\n')
  await appendFile(process.env.GITHUB_OUTPUT, `${lines}\n`)
}

async function runVisibleNpm(args, cwd, npmPaths) {
  const { stdout, stderr } = await runNpm(args, cwd, npmPaths)
  if (stdout) process.stdout.write(stdout)
  if (stderr) process.stderr.write(stderr)
}

function run(command, args) {
  return execFileAsync(command, args, {
    cwd: repositoryRoot,
    maxBuffer: 10 * 1024 * 1024,
  })
}

function escapeRegExp(value) {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const isMain =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url

if (isMain) {
  try {
    await verifyRelease(parseArguments(process.argv.slice(2)))
  } catch (error) {
    console.error(formatCommandError(error))
    process.exitCode = 1
  }
}
