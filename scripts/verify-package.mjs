import { execFileSync } from 'node:child_process'
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import assert from 'node:assert/strict'
import { gzipSync } from 'node:zlib'
const pack = JSON.parse(
  execFileSync('npm', ['pack', '--json'], { encoding: 'utf8' }),
)[0]
assert(
  pack.files.every((file) =>
    /^(dist\/[^/]+|README\.md|LICENSE|package\.json)$/.test(file.path),
  ),
)
const dir = mkdtempSync(join(tmpdir(), 'rdi-package-'))
try {
  writeFileSync(
    join(dir, 'package.json'),
    JSON.stringify({ private: true, type: 'module' }),
  )
  execFileSync(
    'npm',
    [
      'install',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      resolve(pack.filename),
      'react@19',
      'react-dom@19',
      '@types/react@19',
    ],
    { cwd: dir, stdio: 'pipe' },
  )
  writeFileSync(
    join(dir, 'check.mjs'),
    `import assert from 'node:assert/strict';import {createRequire} from 'node:module';import * as pkg from '@nipe-solutions/react-data-inspector';import {createElement} from 'react';import {renderToString} from 'react-dom/server';const require=createRequire(import.meta.url);const cjs=require('@nipe-solutions/react-data-inspector');assert.equal(typeof cjs.DataInspector,'function');assert.equal(pkg.toJsonPointer(['a/b']),'/a~1b');assert.match(renderToString(createElement(pkg.DataInspector,{value:{x:1}})),/role="tree"/);assert.ok(require.resolve('@nipe-solutions/react-data-inspector/styles.css'));assert.deepEqual(Object.keys(pkg).sort(),['DataInspector','defineInspectorType','formatPath','pathEqual','toJavaScriptPath','toJsonPath','toJsonPointer'].sort());`,
  )
  execFileSync(process.execPath, ['check.mjs'], { cwd: dir, stdio: 'inherit' })
  writeFileSync(
    join(dir, 'check.ts'),
    `import {DataInspector,defineInspectorType,toJsonPointer} from '@nipe-solutions/react-data-inspector';import {createElement} from 'react';class Money {amount=12.99};const type=defineInspectorType<Money>({id:'money',matches:(v):v is Money=>v instanceof Money,summary:v=>v.amount.toFixed(2)});createElement(DataInspector,{value:new Money(),types:[type]});toJsonPointer(['x',0]);`,
  )
  execFileSync(
    process.execPath,
    [
      resolve('node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2022',
      'check.ts',
    ],
    { cwd: dir, stdio: 'inherit' },
  )
  writeFileSync(join(dir, 'check.cts'), readFileSync(join(dir, 'check.ts')))
  execFileSync(
    process.execPath,
    [
      resolve('node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2022',
      'check.cts',
    ],
    { cwd: dir, stdio: 'inherit' },
  )
  for (const [input, output] of [
    ['examples/live-updates.tsx', 'live-updates.tsx'],
    ['examples/live-data.ts', 'live-data.ts'],
    ['examples/stress-data.ts', 'stress-data.ts'],
    ['examples/update-pulse.tsx', 'update-pulse.tsx'],
    ['examples/customization.tsx', 'customization.tsx'],
    ['website/playground/scenarios.tsx', 'scenarios.tsx'],
  ]) {
    const code = readFileSync(input, 'utf8')
      .replaceAll("'../src'", "'@nipe-solutions/react-data-inspector'")
      .replaceAll("'../../src'", "'@nipe-solutions/react-data-inspector'")
      .replaceAll("'../../examples/customization'", "'./customization'")
    writeFileSync(join(dir, output), code)
  }
  execFileSync(
    process.execPath,
    [
      resolve('node_modules/typescript/bin/tsc'),
      '--noEmit',
      '--strict',
      '--noUncheckedIndexedAccess',
      '--exactOptionalPropertyTypes',
      '--jsx',
      'react-jsx',
      '--target',
      'ES2022',
      '--module',
      'ESNext',
      '--moduleResolution',
      'Bundler',
      'live-updates.tsx',
      'stress-data.ts',
      'update-pulse.tsx',
      'customization.tsx',
      'scenarios.tsx',
    ],
    { cwd: dir, stdio: 'inherit' },
  )
  const gzip = gzipSync(readFileSync('dist/index.js')).length
  assert(gzip < 18000, `Runtime gzip ${gzip} exceeds 18KB review budget`)
  console.log(
    `Tarball consumer imports and SSR passed; ESM gzip ${gzip} bytes; CSS ${gzipSync(readFileSync('dist/styles.css')).length} bytes gzip.`,
  )
} finally {
  rmSync(dir, { recursive: true, force: true })
  rmSync(pack.filename)
}
