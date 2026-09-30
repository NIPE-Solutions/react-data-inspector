import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  assertRegistryVersionAbsent,
  createArtifactManifest,
  parseArguments,
  validateReleaseMetadata,
  validateRepositoryContext,
} from './validate-release.mjs'

const repositoryRoot = path.resolve(import.meta.dirname, '..')
const expectedFiles = JSON.parse(
  await readFile(
    path.join(repositoryRoot, 'scripts/package-files.json'),
    'utf8',
  ),
)
const stablePackage = {
  name: '@nipe-solutions/react-data-inspector',
  version: '1.0.0',
  repository: {
    type: 'git',
    url: 'git+https://github.com/NIPE-Solutions/react-data-inspector.git',
  },
  dependencies: {},
  publishConfig: { access: 'public', provenance: true, tag: 'latest' },
}
const stableLock = {
  version: '1.0.0',
  packages: { '': { version: '1.0.0' } },
}
const stableChangelog = '## 1.0.0 — 2026-09-30\n'

test('stable metadata selects the latest channel', () => {
  assert.deepEqual(
    validateReleaseMetadata(stablePackage, stableLock, stableChangelog),
    {
      name: stablePackage.name,
      version: '1.0.0',
      channel: 'latest',
    },
  )
})

test('repository metadata satisfies stable release policy', async () => {
  const [packageJson, packageLock, changelog] = await Promise.all([
    readFile(path.join(repositoryRoot, 'package.json'), 'utf8').then(
      JSON.parse,
    ),
    readFile(path.join(repositoryRoot, 'package-lock.json'), 'utf8').then(
      JSON.parse,
    ),
    readFile(path.join(repositoryRoot, 'CHANGELOG.md'), 'utf8'),
  ])

  assert.deepEqual(
    validateReleaseMetadata(packageJson, packageLock, changelog),
    {
      name: stablePackage.name,
      version: '1.0.0',
      channel: 'latest',
    },
  )
})

test('stable metadata rejects invalid versions and release policy', () => {
  for (const version of ['1.0.0-beta.1', 'v1.0.0', '01.0.0', '1.0']) {
    assert.throws(
      () =>
        validateReleaseMetadata(
          { ...stablePackage, version },
          {
            version,
            packages: { '': { version } },
          },
          `## ${version} — 2026-09-30\n`,
        ),
      /stable semantic version/,
    )
  }

  assert.throws(
    () =>
      validateReleaseMetadata(
        {
          ...stablePackage,
          repository: { type: 'git', url: 'https://example.invalid/repo' },
        },
        stableLock,
        stableChangelog,
      ),
    /repository/,
  )
  assert.throws(
    () =>
      validateReleaseMetadata(
        {
          ...stablePackage,
          publishConfig: { ...stablePackage.publishConfig, tag: 'beta' },
        },
        stableLock,
        stableChangelog,
      ),
    /latest dist-tag/,
  )
  assert.throws(
    () =>
      validateReleaseMetadata(
        {
          ...stablePackage,
          publishConfig: {
            ...stablePackage.publishConfig,
            access: 'restricted',
          },
        },
        stableLock,
        stableChangelog,
      ),
    /public access/,
  )
  assert.throws(
    () =>
      validateReleaseMetadata(
        {
          ...stablePackage,
          publishConfig: { ...stablePackage.publishConfig, provenance: false },
        },
        stableLock,
        stableChangelog,
      ),
    /provenance/,
  )
  assert.throws(
    () =>
      validateReleaseMetadata(
        { ...stablePackage, dependencies: { utility: '1.0.0' } },
        stableLock,
        stableChangelog,
      ),
    /runtime dependencies/,
  )
  assert.throws(
    () =>
      validateReleaseMetadata(
        stablePackage,
        { ...stableLock, version: '0.9.0' },
        stableChangelog,
      ),
    /lock version/,
  )
  assert.throws(
    () => validateReleaseMetadata(stablePackage, stableLock, '## Unreleased\n'),
    /dated release entry/,
  )
})

test('GitHub release context requires a clean exact version tag', () => {
  const context = {
    branch: '',
    dirtyEntries: [],
    dryRun: true,
    githubActions: true,
    eventName: 'release',
    refName: 'v1.0.0',
    refType: 'tag',
    version: '1.0.0',
  }
  assert.deepEqual(validateRepositoryContext(context), [])
  assert.throws(
    () =>
      validateRepositoryContext({
        ...context,
        dirtyEntries: [' M package.json'],
      }),
    /tracked state must be clean/,
  )
  assert.throws(
    () => validateRepositoryContext({ ...context, eventName: 'push' }),
    /release event/,
  )
  assert.throws(
    () => validateRepositoryContext({ ...context, refType: 'branch' }),
    /requires a tag/,
  )
  assert.throws(
    () => validateRepositoryContext({ ...context, refName: 'v1.0.1' }),
    /must exactly match v1\.0\.0/,
  )
})

test('local release inspection is dry-run only and reports context', () => {
  assert.deepEqual(
    validateRepositoryContext({
      branch: 'release/1.0.0',
      dirtyEntries: [' M package.json'],
      dryRun: true,
      githubActions: false,
      eventName: undefined,
      refName: undefined,
      refType: undefined,
      version: '1.0.0',
    }),
    [
      'Local dry-run: allowing 1 tracked working-tree change for inspection',
      'Local dry-run: running from feature branch release/1.0.0',
    ],
  )
  assert.throws(
    () =>
      validateRepositoryContext({
        branch: 'main',
        dirtyEntries: [],
        dryRun: false,
        githubActions: false,
        eventName: undefined,
        refName: undefined,
        refType: undefined,
        version: '1.0.0',
      }),
    /dry-run only/,
  )
})

test('release arguments accept only documented dry-run forms', () => {
  assert.deepEqual(parseArguments(['--dry-run']), {
    dryRun: true,
    outputDirectory: undefined,
  })
  assert.deepEqual(parseArguments(['--dry-run', '--output', 'artifact']), {
    dryRun: true,
    outputDirectory: 'artifact',
  })
  for (const args of [
    [],
    ['--publish'],
    ['--dry-run', '--output'],
    ['--dry-run', '--output', 'artifact', '--extra'],
  ]) {
    assert.throws(() => parseArguments(args), /Usage:/)
  }
})

test('registry guard rejects an existing immutable version', () => {
  assert.doesNotThrow(() => assertRegistryVersionAbsent(undefined, '1.0.0'))
  assert.throws(
    () => assertRegistryVersionAbsent('1.0.0', '1.0.0'),
    /already exists/,
  )
})

test('artifact manifest binds release metadata and inventory to the tarball', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'rdi-release-policy-'))
  const tarball = path.join(
    directory,
    'nipe-solutions-react-data-inspector-1.0.0.tgz',
  )
  try {
    await writeFile(tarball, 'verified artifact\n')
    const manifest = await createArtifactManifest(
      {
        filename: path.basename(tarball),
        files: expectedFiles.map((file) => ({ path: file })),
      },
      tarball,
      { name: stablePackage.name, version: '1.0.0', channel: 'latest' },
    )

    assert.deepEqual(manifest, {
      name: stablePackage.name,
      version: '1.0.0',
      channel: 'latest',
      filename: path.basename(tarball),
      integrity:
        'sha512-12QB5Gs/CHundUNneURSBjHM2QunHFMmpAZQaCVZTsZ5EH6RUFU3BMA3YGiiv3kT8bWYmbh7nbNVBH8kaThyVQ==',
      sha512:
        'd76401e46b3f087ba77543677944520631ccd90ba71c5326a406506825594ec679107e9150553704c0376068a2bf7913f1b59899b87b9db355047f2469387255',
      files: expectedFiles,
    })

    await writeFile(tarball, 'changed artifact\n')
    const changed = await createArtifactManifest(
      {
        filename: path.basename(tarball),
        files: expectedFiles.map((file) => ({ path: file })),
      },
      tarball,
      { name: stablePackage.name, version: '1.0.0', channel: 'latest' },
    )
    assert.notEqual(changed.sha512, manifest.sha512)
    assert.notEqual(changed.integrity, manifest.integrity)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
})
