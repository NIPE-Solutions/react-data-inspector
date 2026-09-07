import type { Article } from '../articles'
// Plain text is enough for excerpts; Markdown is always rendered by React, never HTML.
const plain = (source: string) =>
  source
    .replace(/```[^\n]*\n/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#*`>|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
export function createDocumentationSearch(pages: readonly Article[]) {
  const index = pages.map((page) => ({
    page,
    body: plain(page.content),
    title: page.title.toLowerCase(),
  }))
  return (query: string) => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
    if (!terms.length) return []
    return index
      .flatMap(({ page, body, title }) => {
        const text = `${title} ${page.description} ${body}`.toLowerCase()
        if (!terms.every((term) => text.includes(term))) return []
        const offset = Math.max(0, body.toLowerCase().indexOf(terms[0]!) - 55)
        return [
          {
            path: page.path,
            title: page.title,
            excerpt: `${offset ? '…' : ''}${body.slice(offset, offset + 180)}${body.length > offset + 180 ? '…' : ''}`,
            rank: terms.filter((term) => title.includes(term)).length,
          },
        ]
      })
      .sort((a, b) => b.rank - a.rank)
  }
}
