import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  createNpmPaths,
  formatCommandError,
  runNpm,
  sanitizeNpmEnvironment,
  validatePackageManifest,
  validatePackedFiles,
} from './verify-package.mjs'

const repositoryRoot = path.resolve(import.meta.dirname, '..')
const expectedFiles = JSON.parse(
  await readFile(
    path.join(repositoryRoot, 'scripts/package-files.json'),
    'utf8',
  ),
)

const stableManifest = {
  name: '@nipe-solutions/react-data-inspector',
  version: '1.0.0',
  repository: {
    type: 'git',
    url: 'git+https://github.com/NIPE-Solutions/react-data-inspector.git',
  },
  dependencies: {},
  peerDependencies: {
    react: '^18.3.0 || ^19.0.0',
    'react-dom': '^18.3.0 || ^19.0.0',
  },
  publishConfig: { access: 'public', provenance: true, tag: 'latest' },
  exports: {
    '.': {
      import: {
        types: './dist/index.d.ts',
        default: './dist/index.js',
      },
      require: {
        types: './dist/index.d.cts',
        default: './dist/index.cjs',
      },
    },
    './styles.css': './dist/styles.css',
    './package.json': './package.json',
  },
  scripts: { test: 'vitest run' },
}

test('packed inventory rejects missing and private files', () => {
  assert.doesNotThrow(() => validatePackedFiles(expectedFiles, expectedFiles))
  assert.throws(
    () =>
      validatePackedFiles([...expectedFiles, 'src/private.ts'], expectedFiles),
    /Unexpected packed files: src\/private\.ts/,
  )
  assert.throws(
    () => validatePackedFiles(expectedFiles.slice(1), expectedFiles),
    /Missing packed files: LICENSE/,
  )
})

test('npm environment uses isolated configuration without credentials', () => {
  const result = sanitizeNpmEnvironment(
    {
      PATH: '/usr/bin',
      HTTPS_PROXY: 'http://proxy.invalid',
      NODE_EXTRA_CA_CERTS: '/tmp/ca.pem',
      npm_config_allow_scripts: '@example/lower',
      NPM_CONFIG_ALLOW_SCRIPTS: '@example/upper',
      NPM_CONFIG_USERCONFIG: '/home/person/.npmrc',
      npm_config_globalconfig: '/etc/npmrc',
      NPM_CONFIG_CACHE: '/home/person/.npm',
      npm_config_registry: 'https://registry.example.invalid',
      'npm_config_//registry.npmjs.org/:_authToken': 'secret',
      NPM_TOKEN: 'secret',
      NODE_AUTH_TOKEN: 'secret',
    },
    {
      userConfig: '/tmp/isolated-user.npmrc',
      globalConfig: '/tmp/isolated-global.npmrc',
      cache: '/tmp/isolated-cache',
    },
  )

  assert.equal(result.PATH, '/usr/bin')
  assert.equal(result.HTTPS_PROXY, 'http://proxy.invalid')
  assert.equal(result.NODE_EXTRA_CA_CERTS, '/tmp/ca.pem')
  assert.equal(result.npm_config_allow_scripts, undefined)
  assert.equal(result.NPM_CONFIG_ALLOW_SCRIPTS, undefined)
  assert.equal(result.NPM_TOKEN, undefined)
  assert.equal(result.NODE_AUTH_TOKEN, undefined)
  assert.equal(result['npm_config_//registry.npmjs.org/:_authToken'], undefined)
  assert.equal(result.NPM_CONFIG_USERCONFIG, '/tmp/isolated-user.npmrc')
  assert.equal(result.NPM_CONFIG_GLOBALCONFIG, '/tmp/isolated-global.npmrc')
  assert.equal(result.NPM_CONFIG_CACHE, '/tmp/isolated-cache')
  assert.equal(result.NPM_CONFIG_REGISTRY, 'https://registry.npmjs.org/')
  assert.equal(result.NPM_CONFIG_IGNORE_SCRIPTS, 'true')
  assert.equal(result.NPM_CONFIG_AUDIT, 'false')
  assert.equal(result.NPM_CONFIG_FUND, 'false')
  assert.equal(result.NPM_CONFIG_UPDATE_NOTIFIER, 'false')
})

test('npm commands ignore a package-local project configuration', async () => {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), 'react-data-inspector-npm-config-'),
  )
  try {
    const hostilePackage = path.join(temporaryRoot, 'package')
    await mkdir(hostilePackage)
    await writeFile(
      path.join(hostilePackage, '.npmrc'),
      [
        'registry=https://registry.example.invalid/',
        'custom-project-setting=loaded',
        '//registry.npmjs.org/:_authToken=project-secret',
      ].join('\n'),
    )
    const npmPaths = await createNpmPaths(temporaryRoot)
    const loadedFromProject = JSON.parse(
      (await runNpm(['config', 'list', '--json'], hostilePackage, npmPaths))
        .stdout,
    )
    const { stdout } = await runNpm(
      ['config', 'list', '--json'],
      npmPaths.workspace,
      npmPaths,
    )
    const config = JSON.parse(stdout)

    assert.equal(loadedFromProject['custom-project-setting'], 'loaded')
    assert.equal(config['custom-project-setting'], undefined)
    assert.equal(config.registry, 'https://registry.npmjs.org/')
    assert.doesNotMatch(stdout, /project-secret|registry\.example\.invalid/)
    assert.notEqual(npmPaths.workspace, hostilePackage)
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
})

test('stable package manifest exposes only the supported consumer contract', () => {
  assert.doesNotThrow(() =>
    validatePackageManifest(stableManifest, {
      version: '1.0.0',
      tag: 'latest',
    }),
  )
  assert.throws(
    () =>
      validatePackageManifest(
        {
          ...stableManifest,
          publishConfig: { ...stableManifest.publishConfig, tag: 'beta' },
        },
        { version: '1.0.0', tag: 'latest' },
      ),
    /dist-tag/,
  )
  assert.throws(
    () =>
      validatePackageManifest(
        { ...stableManifest, dependencies: { utility: '1.0.0' } },
        { version: '1.0.0', tag: 'latest' },
      ),
    /runtime dependencies/,
  )
  assert.throws(
    () =>
      validatePackageManifest(
        {
          ...stableManifest,
          scripts: { ...stableManifest.scripts, postinstall: 'node setup.mjs' },
        },
        { version: '1.0.0', tag: 'latest' },
      ),
    /postinstall lifecycle script/,
  )
  for (const lifecycle of [
    'preprepare',
    'postprepare',
    'dependencies',
    'prepack',
    'postpack',
    'publish',
    'postpublish',
  ]) {
    assert.throws(
      () =>
        validatePackageManifest(
          {
            ...stableManifest,
            scripts: {
              ...stableManifest.scripts,
              [lifecycle]: 'node unexpected.mjs',
            },
          },
          { version: '1.0.0', tag: 'latest' },
        ),
      new RegExp(`${lifecycle} lifecycle script`),
    )
  }
})

test('command failures include captured compiler diagnostics', () => {
  const error = Object.assign(new Error('Command failed: tsc'), {
    stdout: 'index.ts(1,1): error TS1000: Invalid fixture\n',
    stderr: '',
  })

  assert.equal(
    formatCommandError(error),
    'Command failed: tsc\nindex.ts(1,1): error TS1000: Invalid fixture',
  )
})
