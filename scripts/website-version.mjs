const packageUrl =
  'https://registry.npmjs.org/@nipe-solutions%2freact-data-inspector'
const versionPattern = /^\d+\.\d+\.\d+(?:-[\w.-]+)?$/

export async function resolvePublishedVersion({
  sourceVersion,
  requirePublication,
  expectedVersion,
  fetchImpl = fetch,
  attempts = 6,
  wait = () => new Promise((resolve) => setTimeout(resolve, 10000)),
}) {
  assertVersion(sourceVersion, 'source package')
  if (!requirePublication) return sourceVersion
  if (expectedVersion) assertVersion(expectedVersion, 'expected npm')

  const tags = expectedVersion ? ['latest'] : ['latest', 'beta']
  for (let attempt = 0; attempt < attempts; attempt++) {
    for (const tag of tags) {
      const response = await fetchImpl(`${packageUrl}/${tag}`, {
        signal: AbortSignal.timeout(20000),
      })
      if (response.status === 404) continue
      if (!response.ok)
        throw Error(`Cannot verify npm publication: ${response.status}`)

      const { version } = await response.json()
      assertVersion(version, 'registry release')
      if (!expectedVersion || version === expectedVersion) return version
    }

    if (attempt < attempts - 1) {
      console.log('Waiting for npm publication to become readable…')
      await wait()
    }
  }

  if (expectedVersion)
    throw Error(
      `The exact npm version ${expectedVersion} is not readable on latest; refusing mismatched installation copy`,
    )
  throw Error(
    'Published package is not readable; refusing stale installation copy',
  )
}

function assertVersion(version, label) {
  if (typeof version !== 'string' || !versionPattern.test(version))
    throw Error(`${label} has no valid release version`)
}
