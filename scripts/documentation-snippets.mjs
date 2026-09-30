import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

const competitorImport =
  /from ['"](?:react18-json-view|react-json-view-lite|@uiw\/react-json-view)['"]/

export async function readDocumentationSnippets(repositoryRoot) {
  const documentationDirectory = path.join(repositoryRoot, 'website/docs')
  const snippets = []

  for (const file of (await readdir(documentationDirectory)).sort()) {
    const source = await readFile(
      path.join(documentationDirectory, file),
      'utf8',
    )
    let index = 0
    for (const match of source.matchAll(/```tsx?\n([\s\S]*?)```/g)) {
      if (competitorImport.test(match[1])) continue
      snippets.push({
        filename: `${file}-${index++}.tsx`,
        code: match[1],
      })
    }
  }

  return snippets
}
