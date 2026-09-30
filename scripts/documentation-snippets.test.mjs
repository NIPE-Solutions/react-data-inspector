import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'
import { readDocumentationSnippets } from './documentation-snippets.mjs'

const repositoryRoot = path.resolve(import.meta.dirname, '..')

test('documentation snippets select every current package example', async () => {
  const snippets = await readDocumentationSnippets(repositoryRoot)

  assert.equal(snippets.length, 24)
  assert.equal(new Set(snippets.map(({ filename }) => filename)).size, 24)
  assert.ok(
    snippets.every(
      ({ code }) =>
        !/from ['"](?:react18-json-view|react-json-view-lite|@uiw\/react-json-view)['"]/.test(
          code,
        ),
    ),
  )
  assert.ok(
    snippets.some(({ code }) =>
      code.includes("from '@nipe-solutions/react-data-inspector'"),
    ),
  )
})
