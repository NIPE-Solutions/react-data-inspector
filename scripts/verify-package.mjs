import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import console from 'node:console'
import { createRequire } from 'node:module'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import { promisify } from 'node:util'
import { gzipSync } from 'node:zlib'

const execFileAsync = promisify(execFile)
const repositoryRoot = path.resolve(import.meta.dirname, '..')
const packageName = '@nipe-solutions/react-data-inspector'
const publicRegistry = 'https://registry.npmjs.org/'
const expectedRepository = {
  type: 'git',
  url: 'git+https://github.com/NIPE-Solutions/react-data-inspector.git',
}
const publicExports = {
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
}
const consumerLanes = [
  {
    label: 'React 18',
    react: '18.3.1',
    reactDom: '18.3.1',
    reactTypes: '18.3.31',
    reactDomTypes: '18.3.7',
  },
  {
    label: 'React 19',
    react: '19.3.0',
    reactDom: '19.3.0',
    reactTypes: '19.3.0',
    reactDomTypes: '19.3.0',
  },
]
const lifecycleScripts = [
  'preinstall',
  'install',
  'postinstall',
  'prepublish',
  'prepublishOnly',
  'prepare',
]

export function validatePackedFiles(actualFiles, expectedFiles) {
  const actual = [...actualFiles].sort()
  const expected = [...expectedFiles].sort()
  const unexpected = actual.filter((file) => !expected.includes(file))
  const missing = expected.filter((file) => !actual.includes(file))
  const messages = []

  if (unexpected.length > 0)
    messages.push(`Unexpected packed files: ${unexpected.join(', ')}`)
  if (missing.length > 0)
    messages.push(`Missing packed files: ${missing.join(', ')}`)

  assert.deepEqual(
    actual,
    expected,
    messages.join('\n') || 'Packed file inventory differs from its allowlist',
  )
}

export function sanitizeNpmEnvironment(
  environment,
  { userConfig, globalConfig, cache },
) {
  const sanitized = Object.fromEntries(
    Object.entries(environment).filter(([name]) => {
      const normalized = name.toLowerCase()
      return (
        !normalized.startsWith('npm_config_') &&
        normalized !== 'npm_token' &&
        normalized !== 'node_auth_token' &&
        normalized !== 'yarn_npm_auth_token'
      )
    }),
  )

  return {
    ...sanitized,
    NPM_CONFIG_USERCONFIG: userConfig,
    NPM_CONFIG_GLOBALCONFIG: globalConfig,
    NPM_CONFIG_CACHE: cache,
    NPM_CONFIG_REGISTRY: publicRegistry,
    NPM_CONFIG_IGNORE_SCRIPTS: 'true',
    NPM_CONFIG_AUDIT: 'false',
    NPM_CONFIG_FUND: 'false',
    NPM_CONFIG_UPDATE_NOTIFIER: 'false',
  }
}

export function validatePackageManifest(manifest, expected) {
  assert.equal(manifest.name, packageName, 'Unexpected package name')
  assert.equal(
    manifest.version,
    expected.version,
    'Packed package version differs from the repository manifest',
  )
  assert.deepEqual(
    manifest.repository,
    expectedRepository,
    'Unexpected package repository',
  )
  assert.deepEqual(
    manifest.dependencies ?? {},
    {},
    'Packed package must have zero runtime dependencies',
  )
  assert.deepEqual(manifest.peerDependencies, {
    react: '^18.3.0 || ^19.0.0',
    'react-dom': '^18.3.0 || ^19.0.0',
  })
  assert.deepEqual(manifest.exports, publicExports)
  assert.equal(
    manifest.publishConfig?.access,
    'public',
    'Package must enforce public access',
  )
  assert.equal(
    manifest.publishConfig?.provenance,
    true,
    'Package must enable provenance',
  )
  assert.equal(
    manifest.publishConfig?.tag,
    expected.tag,
    `Package dist-tag must be ${expected.tag}`,
  )
  for (const lifecycle of lifecycleScripts) {
    assert.equal(
      manifest.scripts?.[lifecycle],
      undefined,
      `Packed package must not contain a ${lifecycle} lifecycle script`,
    )
  }
}

export function formatCommandError(error) {
  if (!(error instanceof Error)) return String(error)
  const details = [error.stdout, error.stderr]
    .map((output) => String(output ?? '').trim())
    .filter(Boolean)
  return [error.message.trim(), ...details].join('\n')
}

export async function verifyTarballConsumers(tarballPath) {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), 'react-data-inspector-consumers-'),
  )
  const npmPaths = await createNpmPaths(temporaryRoot)
  const sourceManifest = JSON.parse(
    await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'),
  )

  try {
    for (const lane of consumerLanes) {
      const consumer = path.join(temporaryRoot, lane.label.replace(' ', '-'))
      await mkdir(consumer)
      await writeFile(
        path.join(consumer, 'package.json'),
        `${JSON.stringify({ private: true, type: 'module' }, null, 2)}\n`,
      )

      await runNpm(
        [
          'install',
          '--ignore-scripts',
          '--no-audit',
          '--no-fund',
          '--no-package-lock',
          '--save-exact',
          '--install-strategy=hoisted',
          path.resolve(tarballPath),
          `react@${lane.react}`,
          `react-dom@${lane.reactDom}`,
          `@types/react@${lane.reactTypes}`,
          `@types/react-dom@${lane.reactDomTypes}`,
          'typescript@6.0.3',
        ],
        consumer,
        npmPaths,
      )

      await verifyModulesAndSsr(consumer)
      await verifyTypes(consumer)
      await verifyExamples(consumer)
      await verifyStylesAndManifest(consumer, sourceManifest)
      console.log(
        `${lane.label}: ESM, CJS, types, CSS, examples, and SSR passed`,
      )
    }
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

export async function verifyPackage() {
  const temporaryRoot = await mkdtemp(
    path.join(tmpdir(), 'react-data-inspector-package-'),
  )

  try {
    const packDirectory = path.join(temporaryRoot, 'pack')
    await mkdir(packDirectory)
    const npmPaths = await createNpmPaths(temporaryRoot)
    const expectedFiles = JSON.parse(
      await readFile(
        path.join(import.meta.dirname, 'package-files.json'),
        'utf8',
      ),
    )
    const sourceManifest = JSON.parse(
      await readFile(path.join(repositoryRoot, 'package.json'), 'utf8'),
    )
    const { stdout } = await runNpm(
      ['pack', '--json', '--pack-destination', packDirectory],
      repositoryRoot,
      npmPaths,
    )
    const [pack] = JSON.parse(stdout)
    assert.ok(pack, 'npm pack did not report an artifact')
    validatePackedFiles(
      pack.files.map(({ path: file }) => file),
      expectedFiles,
    )
    assert.ok(pack.size < 40_000, `Tarball is too large: ${pack.size} bytes`)

    const tarballPath = path.join(packDirectory, pack.filename)
    await verifyTarballConsumers(tarballPath)
    const esmGzip = gzipSync(await readFile('dist/index.js')).length
    assert.ok(
      esmGzip < 18_000,
      `Runtime gzip ${esmGzip} exceeds 18KB review budget`,
    )
    const cssGzip = gzipSync(await readFile('dist/styles.css')).length
    assert.ok(cssGzip > 0, 'Published stylesheet must not be empty')
    validatePackageManifest(sourceManifest, {
      version: sourceManifest.version,
      tag: sourceManifest.publishConfig?.tag,
    })
    console.log(
      `Packed package verified (${pack.entryCount} files, ${pack.size} bytes; ESM ${esmGzip} bytes gzip; CSS ${cssGzip} bytes gzip)`,
    )
  } finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

async function verifyModulesAndSsr(consumer) {
  const expectedExports = JSON.stringify(
    [
      'DataInspector',
      'defineInspectorType',
      'formatPath',
      'pathEqual',
      'toJavaScriptPath',
      'toJsonPath',
      'toJsonPointer',
    ].sort(),
  )
  const esm = await run(
    process.execPath,
    [
      '--input-type=module',
      '--eval',
      `
        import assert from 'node:assert/strict'
        import { createElement } from 'react'
        import { renderToString } from 'react-dom/server'
        import * as api from '${packageName}'

        assert.equal(JSON.stringify(Object.keys(api).sort()), '${expectedExports}')
        assert.equal(api.toJsonPointer(['a/b']), '/a~1b')
        assert.match(
          renderToString(createElement(api.DataInspector, { value: { x: 1 } })),
          /role="tree"/,
        )
      `,
    ],
    consumer,
  )
  assert.equal(esm.stderr, '')

  const cjs = await run(
    process.execPath,
    [
      '--input-type=commonjs',
      '--eval',
      `
        const assert = require('node:assert/strict')
        const api = require('${packageName}')
        assert.equal(JSON.stringify(Object.keys(api).sort()), '${expectedExports}')
        assert.equal(api.toJsonPointer(['a/b']), '/a~1b')
      `,
    ],
    consumer,
  )
  assert.equal(cjs.stderr, '')
}

async function verifyTypes(consumer) {
  const source = `
    import {
      DataInspector,
      defineInspectorType,
      toJsonPointer,
      type DataInspectorProps,
      type DataPath,
      type InspectorMessages,
      type InspectorType,
      type RegisteredInspectorType,
      type SearchOptions,
      type SerializationResult,
    } from '${packageName}'
    import { createElement } from 'react'

    class Money { amount = 12.99 }
    const definition: InspectorType<Money> = {
      id: 'money',
      matches: (value): value is Money => value instanceof Money,
      summary: (value) => value.amount.toFixed(2),
    }
    const type: RegisteredInspectorType = defineInspectorType(definition)
    const path: DataPath = ['invoice', 0]
    const search: SearchOptions = { maxResults: 10 }
    const result: SerializationResult = { ok: true, text: '{}' }
    const messages: Partial<InspectorMessages> = {}
    const props: DataInspectorProps = { value: new Money(), types: [type] }
    createElement(DataInspector, props)
    void toJsonPointer(path)
    void search
    void result
    void messages
  `
  await writeFile(path.join(consumer, 'index.ts'), source)
  await writeFile(path.join(consumer, 'index.cts'), source)
  await writeFile(
    path.join(consumer, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          module: 'NodeNext',
          moduleResolution: 'NodeNext',
          strict: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
          noEmit: true,
          skipLibCheck: false,
          types: [],
        },
        include: ['index.ts', 'index.cts'],
      },
      null,
      2,
    )}\n`,
  )
  await run(
    process.execPath,
    ['node_modules/typescript/bin/tsc', '--project', 'tsconfig.json'],
    consumer,
  )
}

async function verifyExamples(consumer) {
  for (const [input, output] of [
    ['examples/live-updates.tsx', 'live-updates.tsx'],
    ['examples/live-data.ts', 'live-data.ts'],
    ['examples/stress-data.ts', 'stress-data.ts'],
    ['examples/update-pulse.tsx', 'update-pulse.tsx'],
    ['examples/customization.tsx', 'customization.tsx'],
    ['website/playground/scenarios.tsx', 'scenarios.tsx'],
  ]) {
    const code = (await readFile(path.join(repositoryRoot, input), 'utf8'))
      .replaceAll("'../src'", `'${packageName}'`)
      .replaceAll("'../../src'", `'${packageName}'`)
      .replaceAll("'../../examples/customization'", "'./customization'")
    await writeFile(path.join(consumer, output), code)
  }
  await writeFile(
    path.join(consumer, 'tsconfig.examples.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          lib: ['ES2022', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          moduleResolution: 'Bundler',
          jsx: 'react-jsx',
          strict: true,
          exactOptionalPropertyTypes: true,
          noUncheckedIndexedAccess: true,
          noEmit: true,
          skipLibCheck: false,
          types: [],
        },
        include: [
          'live-updates.tsx',
          'stress-data.ts',
          'update-pulse.tsx',
          'customization.tsx',
          'scenarios.tsx',
        ],
      },
      null,
      2,
    )}\n`,
  )
  await run(
    process.execPath,
    ['node_modules/typescript/bin/tsc', '--project', 'tsconfig.examples.json'],
    consumer,
  )
}

async function verifyStylesAndManifest(consumer, sourceManifest) {
  const require = createRequire(path.join(consumer, 'package.json'))
  const stylesheetPath = require.resolve(`${packageName}/styles.css`)
  assert.ok(
    (await readFile(stylesheetPath, 'utf8')).trim().length > 0,
    'styles.css must contain CSS',
  )
  const manifest = JSON.parse(
    await readFile(require.resolve(`${packageName}/package.json`), 'utf8'),
  )
  validatePackageManifest(manifest, {
    version: sourceManifest.version,
    tag: sourceManifest.publishConfig?.tag,
  })
}

async function createNpmPaths(temporaryRoot) {
  const paths = {
    userConfig: path.join(temporaryRoot, 'user.npmrc'),
    globalConfig: path.join(temporaryRoot, 'global.npmrc'),
    cache: path.join(temporaryRoot, 'npm-cache'),
  }
  await Promise.all([
    writeFile(paths.userConfig, ''),
    writeFile(paths.globalConfig, ''),
    mkdir(paths.cache),
  ])
  return paths
}

function runNpm(args, cwd, npmPaths) {
  return execFileAsync('npm', args, {
    cwd,
    env: sanitizeNpmEnvironment(process.env, npmPaths),
    maxBuffer: 10 * 1024 * 1024,
  })
}

function run(command, args, cwd = repositoryRoot) {
  return execFileAsync(command, args, {
    cwd,
    maxBuffer: 10 * 1024 * 1024,
  })
}

const isMain =
  process.argv[1] &&
  pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url

if (isMain) {
  try {
    await verifyPackage()
  } catch (error) {
    console.error(formatCommandError(error))
    process.exitCode = 1
  }
}
