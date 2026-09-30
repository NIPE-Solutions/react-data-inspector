import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import test from 'node:test'
import { promisify } from 'node:util'
import { parse } from 'yaml'

const execFileAsync = promisify(execFile)
const repositoryRoot = path.resolve(import.meta.dirname, '..')
const releaseTarball = 'nipe-solutions-react-data-inspector-1.0.0.tgz'
const expectedFiles = JSON.parse(
  await readFile(
    path.join(repositoryRoot, 'scripts/package-files.json'),
    'utf8',
  ),
)

test('CI retains the React matrix without publication privileges', async () => {
  validateCiWorkflow(await readWorkflow('.github/workflows/ci.yml'))
})

test('release separates verification, publication, and deployment', async () => {
  validateReleaseWorkflow(await readWorkflow('.github/workflows/release.yml'))
})

test('publish shell accepts only the verified artifact pair', async () => {
  const workflow = await readWorkflow('.github/workflows/release.yml')
  const script = workflow.jobs.publish.steps.at(-1).run

  await withArtifact(async ({ artifactDirectory, binaryDirectory, marker }) => {
    await runPublishScript(script, artifactDirectory, binaryDirectory, marker)
    assert.equal(
      await readFile(marker, 'utf8'),
      `publish --ignore-scripts --provenance --access public --tag latest ${releaseTarball}\n`,
    )
  })

  const mutations = [
    async ({ artifactDirectory }) =>
      writeFile(path.join(artifactDirectory, 'extra.txt'), 'unexpected\n'),
    async ({ artifactDirectory }) =>
      rename(
        path.join(artifactDirectory, releaseTarball),
        path.join(artifactDirectory, 'substituted.tgz'),
      ),
    async ({ manifestPath, manifest }) =>
      writeManifest(manifestPath, { ...manifest, filename: 'substituted.tgz' }),
    async ({ manifestPath, manifest }) =>
      writeManifest(manifestPath, { ...manifest, version: '1.0.1' }),
    async ({ manifestPath, manifest }) =>
      writeManifest(manifestPath, { ...manifest, channel: 'beta' }),
    async ({ artifactDirectory }) =>
      writeFile(
        path.join(artifactDirectory, releaseTarball),
        'changed tarball\n',
      ),
    async ({ manifestPath, manifest }) =>
      writeManifest(manifestPath, {
        ...manifest,
        files: manifest.files.slice(1),
      }),
  ]

  for (const mutate of mutations) {
    await withArtifact(async (fixture) => {
      await mutate(fixture)
      await assert.rejects(() =>
        runPublishScript(
          script,
          fixture.artifactDirectory,
          fixture.binaryDirectory,
          fixture.marker,
        ),
      )
      await assert.rejects(() => readFile(fixture.marker, 'utf8'), /ENOENT/)
    })
  }
})

test('workflow validators reject weakened trust boundaries', async () => {
  const ci = await readWorkflow('.github/workflows/ci.yml')
  const ciMutations = [
    (copy) => (copy.permissions = { contents: 'write' }),
    (copy) => (copy.jobs.test.strategy.matrix.react = ['19.3.0']),
    (copy) => (copy.jobs.publish = { 'runs-on': 'ubuntu-24.04' }),
    (copy) => (copy.jobs.test.permissions = { 'id-token': 'write' }),
    (copy) => delete findAction(copy.jobs.test, 'actions/upload-artifact').if,
    (copy) =>
      (findAction(copy.jobs.test, 'actions/upload-artifact').with[
        'retention-days'
      ] = 30),
    (copy) =>
      (findRun(copy.jobs.test, 'npm run check')['continue-on-error'] = true),
    (copy) => (copy.jobs.deploy.if = 'always()'),
    (copy) => delete findRun(copy.jobs.deploy, 'npm run build:website').env,
  ]
  for (const mutate of ciMutations) {
    const copy = structuredClone(ci)
    mutate(copy)
    assert.throws(() => validateCiWorkflow(copy))
  }

  const release = await readWorkflow('.github/workflows/release.yml')
  const releaseMutations = [
    (copy) => (copy.on.release.types = ['created']),
    (copy) => delete copy.jobs.verify.if,
    (copy) => (copy.permissions = { 'id-token': 'write' }),
    (copy) => (copy.jobs.verify.permissions = { 'id-token': 'write' }),
    (copy) => (copy.concurrency.group = 'release-${{ github.ref }}'),
    (copy) => delete findAction(copy.jobs.verify, 'actions/checkout').with,
    (copy) =>
      (findRun(copy.jobs.verify, 'git merge-base').run = 'git status --short'),
    (copy) =>
      (findRun(copy.jobs.verify, 'npm run release:check').run =
        'npm pack --dry-run'),
    (copy) =>
      (findRun(copy.jobs.verify, 'npm run test:e2e')['continue-on-error'] =
        true),
    (copy) =>
      (findAction(copy.jobs.verify, 'actions/upload-artifact').with.name =
        'different-artifact'),
    (copy) => (copy.jobs.publish.environment = 'unprotected'),
    (copy) => (copy.jobs.publish.permissions = { contents: 'write' }),
    (copy) => copy.jobs.publish.steps.unshift({ uses: 'actions/checkout@v7' }),
    (copy) =>
      (findAction(copy.jobs.publish, 'actions/download-artifact').with.name =
        'different-artifact'),
    (copy) => (copy.jobs.deploy.permissions = { 'id-token': 'write' }),
    (copy) => delete findRun(copy.jobs.deploy, 'npm run build:website').env,
  ]
  for (const mutate of releaseMutations) {
    const copy = structuredClone(release)
    mutate(copy)
    assert.throws(() => validateReleaseWorkflow(copy))
  }
})

async function readWorkflow(relativePath) {
  return parse(await readFile(path.join(repositoryRoot, relativePath), 'utf8'))
}

async function withArtifact(assertion) {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), 'react-data-inspector-publish-'),
  )
  const artifactDirectory = path.join(temporaryRoot, 'artifact')
  const binaryDirectory = path.join(temporaryRoot, 'bin')
  const marker = path.join(temporaryRoot, 'published')
  const manifestPath = path.join(artifactDirectory, 'release-manifest.json')
  try {
    await Promise.all([mkdir(artifactDirectory), mkdir(binaryDirectory)])
    const npmShim = path.join(binaryDirectory, 'npm')
    await writeFile(
      npmShim,
      '#!/bin/sh\nprintf "%s\\n" "$*" > "$PUBLISH_MARKER"\n',
    )
    await chmod(npmShim, 0o755)
    const tarballPath = path.join(artifactDirectory, releaseTarball)
    const tarball = Buffer.from('verified tarball\n')
    await writeFile(tarballPath, tarball)
    const digest = createHash('sha512').update(tarball).digest()
    const manifest = {
      name: '@nipe-solutions/react-data-inspector',
      version: '1.0.0',
      channel: 'latest',
      filename: releaseTarball,
      integrity: `sha512-${digest.toString('base64')}`,
      sha512: digest.toString('hex'),
      files: expectedFiles,
    }
    await writeManifest(manifestPath, manifest)
    await assertion({
      artifactDirectory,
      binaryDirectory,
      manifest,
      manifestPath,
      marker,
    })
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

function writeManifest(manifestPath, manifest) {
  return writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)
}

function runPublishScript(script, artifactDirectory, binaryDirectory, marker) {
  return execFileAsync('bash', ['-c', script], {
    cwd: artifactDirectory,
    env: {
      ...process.env,
      GITHUB_REF_NAME: 'v1.0.0',
      PATH: `${binaryDirectory}:${process.env.PATH}`,
      PUBLISH_MARKER: marker,
      RELEASE_TARBALL: releaseTarball,
    },
  })
}

function stepsFor(job) {
  assert.ok(Array.isArray(job?.steps), 'job must define executable steps')
  return job.steps
}

function runCommands(job) {
  return stepsFor(job)
    .map((step) => step.run)
    .filter((command) => typeof command === 'string')
}

function assertRequiredCommands(job, expected) {
  assert.deepEqual(runCommands(job), expected)
  for (const command of expected) {
    const step = stepsFor(job).find((candidate) => candidate.run === command)
    assert.ok(step, `${command} must be an exact required step`)
    assert.equal(step.if, undefined)
    assert.equal(step['continue-on-error'], undefined)
  }
}

function findAction(job, action) {
  const step = stepsFor(job).find((candidate) =>
    candidate.uses?.startsWith(`${action}@`),
  )
  assert.ok(step, `${action} step is required`)
  return step
}

function findRun(job, fragment) {
  const step = stepsFor(job).find((candidate) =>
    candidate.run?.includes(fragment),
  )
  assert.ok(step, `${fragment} command is required`)
  return step
}

function assertActionMajor(job, action, major = 7) {
  assert.equal(findAction(job, action).uses, `${action}@v${major}`)
}

function assertNodeSetup(job, { registry = false } = {}) {
  assertActionMajor(job, 'actions/setup-node')
  const setup = findAction(job, 'actions/setup-node')
  assert.equal(String(setup.with?.['node-version']), '24')
  if (registry) {
    assert.equal(setup.with?.['registry-url'], 'https://registry.npmjs.org')
    assert.equal(setup.with?.cache, undefined)
  } else {
    assert.equal(setup.with?.cache, 'npm')
    assert.equal(setup.with?.['cache-dependency-path'], 'package-lock.json')
  }
}

function validateCiWorkflow(workflow) {
  assert.deepEqual(workflow.permissions, { contents: 'read' })
  assert.equal(
    workflow.concurrency.group,
    'react-data-inspector-ci-${{ github.ref }}',
  )
  assert.equal(workflow.concurrency['cancel-in-progress'], false)
  assert.deepEqual(Object.keys(workflow.jobs).sort(), [
    'deploy',
    'test',
    'verify',
  ])
  assert.doesNotMatch(JSON.stringify(workflow), /npm publish/)
  assert.doesNotMatch(JSON.stringify(workflow), /"id-token":"write"/)

  const matrix = workflow.jobs.test
  assert.equal(matrix['runs-on'], 'ubuntu-24.04')
  assert.ok(matrix['timeout-minutes'] > 0)
  assert.ok(matrix['timeout-minutes'] <= 60)
  assert.equal(matrix.strategy?.['fail-fast'], false)
  assert.deepEqual(matrix.strategy?.matrix?.react, ['18.3.1', '19.3.0'])
  assertActionMajor(matrix, 'actions/checkout')
  assertNodeSetup(matrix)
  assertRequiredCommands(matrix, [
    'npm ci',
    'npm install --no-save --ignore-scripts react@${{ matrix.react }} react-dom@${{ matrix.react }}',
    'npm run check',
    'npx playwright install --with-deps chromium firefox webkit',
    'npm run test:e2e',
    'npm run benchmark',
  ])
  const artifact = findAction(matrix, 'actions/upload-artifact')
  assertActionMajor(matrix, 'actions/upload-artifact')
  assert.equal(artifact.if, 'failure()')
  assert.equal(artifact['continue-on-error'], true)
  assert.equal(artifact.with?.name, 'evidence-react-${{ matrix.react }}')
  assert.equal(artifact.with?.['if-no-files-found'], 'ignore')
  assert.ok(artifact.with?.['retention-days'] <= 7)
  assert.match(artifact.with?.path ?? '', /test-results/)
  assert.match(artifact.with?.path ?? '', /benchmarks\/results\.json/)

  const verify = workflow.jobs.verify
  assert.equal(verify.if, 'always()')
  assert.equal(verify.needs, 'test')
  assert.deepEqual(runCommands(verify), ['test "$RESULT" = success'])

  const deploy = workflow.jobs.deploy
  assert.equal(deploy.needs, 'verify')
  assert.equal(
    deploy.if,
    "needs.verify.result == 'success' && github.event_name != 'pull_request' && github.ref_type != 'tag'",
  )
  assert.equal(deploy.permissions, undefined)
  assertActionMajor(deploy, 'actions/checkout')
  assertNodeSetup(deploy)
  assertRequiredCommands(deploy, [
    'npm ci',
    'npm run build:website',
    'node scripts/deploy-website.mjs',
  ])
  assert.deepEqual(findRun(deploy, 'npm run build:website').env, {
    REQUIRE_NPM_PUBLICATION: 'true',
  })
}

function validateReleaseWorkflow(workflow) {
  assert.deepEqual(workflow.on, { release: { types: ['published'] } })
  assert.deepEqual(workflow.permissions, { contents: 'read' })
  assert.equal(
    workflow.concurrency.group,
    'npm-nipe-solutions-react-data-inspector-stable',
  )
  assert.equal(workflow.concurrency['cancel-in-progress'], false)
  assert.deepEqual(Object.keys(workflow.jobs).sort(), [
    'deploy',
    'publish',
    'verify',
  ])

  const verify = workflow.jobs.verify
  assert.equal(verify.if, 'github.event.release.prerelease == false')
  assert.equal(verify['runs-on'], 'ubuntu-24.04')
  assert.ok(verify['timeout-minutes'] > 0)
  assert.ok(verify['timeout-minutes'] <= 60)
  assert.deepEqual(verify.outputs, {
    tarball: '${{ steps.release.outputs.tarball }}',
  })
  assert.equal(verify.permissions, undefined)
  assertActionMajor(verify, 'actions/checkout')
  assert.equal(findAction(verify, 'actions/checkout').with?.['fetch-depth'], 0)
  assertNodeSetup(verify)
  assertRequiredCommands(verify, [
    'git merge-base --is-ancestor HEAD origin/main',
    'npm ci',
    'npm audit --audit-level=moderate',
    'npm run format:check',
    'npm run typecheck',
    'npm test',
    'npm run test:release-policy',
    'npm run build',
    'npm run build:website',
    'npm run test:website',
    'npx playwright install --with-deps chromium firefox webkit',
    'npm run test:e2e',
    'npm run release:check -- --dry-run --output release-artifact',
    'npm run benchmark',
  ])
  const releaseStep = findRun(verify, 'npm run release:check')
  assert.equal(releaseStep.id, 'release')
  const upload = findAction(verify, 'actions/upload-artifact')
  assertActionMajor(verify, 'actions/upload-artifact')
  assert.equal(upload.with?.name, 'npm-package-stable')
  assert.equal(upload.with?.path, 'release-artifact')
  assert.equal(upload.with?.['if-no-files-found'], 'error')
  assert.ok(upload.with?.['retention-days'] <= 7)
  assert.ok(
    stepsFor(verify).indexOf(upload) > stepsFor(verify).indexOf(releaseStep),
  )

  const publish = workflow.jobs.publish
  assert.equal(publish.needs, 'verify')
  assert.equal(publish.environment, 'npm')
  assert.equal(publish['runs-on'], 'ubuntu-24.04')
  assert.ok(publish['timeout-minutes'] > 0)
  assert.ok(publish['timeout-minutes'] <= 10)
  assert.deepEqual(publish.permissions, { 'id-token': 'write' })
  assert.equal(
    stepsFor(publish).some((step) =>
      step.uses?.startsWith('actions/checkout@'),
    ),
    false,
  )
  assertNodeSetup(publish, { registry: true })
  assertActionMajor(publish, 'actions/download-artifact', 8)
  const download = findAction(publish, 'actions/download-artifact')
  assert.equal(download.with?.name, 'npm-package-stable')
  assert.equal(download.with?.path, 'release-artifact')
  assert.equal(runCommands(publish).length, 1)

  const finalStep = publish.steps.at(-1)
  assert.equal(finalStep.name, 'Validate and publish verified artifact')
  assert.equal(finalStep['working-directory'], 'release-artifact')
  assert.equal(
    finalStep.env?.RELEASE_TARBALL,
    '${{ needs.verify.outputs.tarball }}',
  )
  assert.doesNotMatch(finalStep.run, /npm (ci|install|run)|vite|tsc/)
  assert.equal((finalStep.run.match(/npm publish/g) ?? []).length, 1)
  assert.match(
    finalStep.run,
    /npm publish --ignore-scripts --provenance --access public --tag latest "\$RELEASE_TARBALL"/,
  )

  const deploy = workflow.jobs.deploy
  assert.equal(deploy.needs, 'publish')
  assert.equal(deploy.permissions, undefined)
  assertActionMajor(deploy, 'actions/checkout')
  assertNodeSetup(deploy)
  assertRequiredCommands(deploy, [
    'npm ci',
    'npm run build:website',
    'node scripts/deploy-website.mjs',
  ])
  assert.deepEqual(findRun(deploy, 'npm run build:website').env, {
    REQUIRE_NPM_PUBLICATION: 'true',
  })
}
