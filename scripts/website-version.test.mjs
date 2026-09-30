import assert from 'node:assert/strict'
import test from 'node:test'
import { resolvePublishedVersion } from './website-version.mjs'

const response = (status, version) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => ({ version }),
})

test('local website builds use the source package version without registry access', async () => {
  const version = await resolvePublishedVersion({
    sourceVersion: '1.0.0',
    requirePublication: false,
    fetchImpl: () => {
      throw Error('registry must not be queried')
    },
  })

  assert.equal(version, '1.0.0')
})

test('release website waits for the exact stable version on latest', async () => {
  const requested = []
  const versions = ['0.9.0', '1.0.0']
  const version = await resolvePublishedVersion({
    sourceVersion: '1.0.0',
    requirePublication: true,
    expectedVersion: '1.0.0',
    attempts: 2,
    wait: async () => {},
    fetchImpl: async (url) => {
      requested.push(url)
      assert.match(url, /\/latest$/)
      return response(200, versions.shift())
    },
  })

  assert.equal(version, '1.0.0')
  assert.equal(requested.length, 2)
})

test('non-release deployment may use the prerelease bridge', async () => {
  const version = await resolvePublishedVersion({
    sourceVersion: '1.0.0',
    requirePublication: true,
    attempts: 1,
    fetchImpl: async (url) =>
      url.endsWith('/latest') ? response(404) : response(200, '0.1.0-beta.0'),
  })

  assert.equal(version, '0.1.0-beta.0')
})

test('release website rejects a different published version', async () => {
  await assert.rejects(
    () =>
      resolvePublishedVersion({
        sourceVersion: '1.0.0',
        requirePublication: true,
        expectedVersion: '1.0.0',
        attempts: 1,
        fetchImpl: async () => response(200, '0.9.0'),
      }),
    /exact npm version 1\.0\.0/,
  )
})
