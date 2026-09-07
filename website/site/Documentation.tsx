import { BenchmarkEvidence } from './BenchmarkEvidence'
import { useEffect, useState } from 'react'
import { marked, type Tokens } from 'marked'
import { articles, type Article } from '../articles'
import { Header, Footer, Installation } from './Chrome'
import { Markdown, headingId } from './Markdown'
import { TypeMuseum } from '../home/TypeMuseum'
import { createDocumentationSearch } from './doc-search'
import { KeyboardModel } from '../home/Visuals'
const searchDocumentation = createDocumentationSearch(articles)
const groups = [
  'Getting started',
  'Core behavior',
  'Concepts',
  'Customization',
  'Reference',
  'Quality',
  'Migration',
]
export function Documentation({ article }: { article: Article }) {
  const [filter, setFilter] = useState('')
  const [navigationOpen, setNavigationOpen] = useState(true)
  useEffect(() => {
    if (window.matchMedia('(max-width: 760px)').matches)
      setNavigationOpen(false)
  }, [])
  const results = searchDocumentation(filter)
  const headings = marked
    .lexer(article.content)
    .filter(
      (token): token is Tokens.Heading =>
        token.type === 'heading' && token.depth === 2,
    )
  return (
    <>
      <Header />
      <main id="main" className="documentation doc-layout">
        <aside data-open={navigationOpen}>
          <button
            className="doc-nav-toggle"
            aria-expanded={navigationOpen}
            aria-controls="doc-navigation"
            onClick={() => setNavigationOpen(!navigationOpen)}
          >
            Browse documentation
          </button>
          <label htmlFor="doc-filter">Search documentation</label>
          <input
            id="doc-filter"
            type="search"
            placeholder="Search titles and content…"
            value={filter}
            onChange={(event) => setFilter(event.currentTarget.value)}
          />
          {filter.trim() && (
            <div className="doc-search-results">
              <p role="status">
                {results.length
                  ? `${results.length} pages found`
                  : 'No matching pages'}
              </p>
              <ul aria-label="Documentation search results">
                {results.map((result) => (
                  <li key={result.path}>
                    <a href={result.path}>{result.title}</a>
                    <p>{result.excerpt}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          <nav id="doc-navigation" aria-label="Documentation">
            {groups.map((group) => (
              <div key={group}>
                <h2>{group}</h2>
                {articles
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <a
                      key={item.path}
                      href={item.path}
                      aria-current={
                        item.path === article.path ? 'page' : undefined
                      }
                    >
                      {item.title}
                    </a>
                  ))}
              </div>
            ))}
          </nav>
        </aside>
        <article className="doc-article">
          <a className="breadcrumb" href="/docs">
            Documentation / {article.group}
          </a>
          <h1>{article.title}</h1>
          <p className="doc-description">{article.description}</p>
          {headings.length > 1 && (
            <nav className="on-page" aria-label="On this page">
              {headings.map((token) => (
                <a key={token.text} href={`#${headingId(token.text)}`}>
                  {token.text}
                </a>
              ))}
            </nav>
          )}
          {article.path === '/docs/installation' && <Installation />}
          {article.path === '/accessibility' && <KeyboardModel />}
          <Markdown source={article.content} />
          {article.path === '/performance' && <BenchmarkEvidence />}
          {article.path === '/concepts/javascript-types' && <TypeMuseum />}
          <div className="doc-next">
            <a href="/playground">Try it in the playground</a>
            <a href="/reference/api">API reference</a>
            <a href="/limitations">Known limitations</a>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
