import { Fragment, createElement, type ReactNode } from 'react'
import { marked, type Token, type Tokens } from 'marked'
import { Code, repository } from './Chrome'
export const headingId = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
function hrefFor(href: string) {
  if (href.startsWith('../examples/'))
    return `${repository}/blob/main/examples/${href.slice(12)}`
  if (href.startsWith('../benchmarks/'))
    return `${repository}/blob/main/benchmarks/${href.slice(14)}`
  if (href === 'api.md' || href.startsWith('api.md#'))
    return href.replace('api.md', '/reference/api')
  if (href === '../docs/api.md') return '/reference/api'
  return /^(https?:\/\/|\/|#|mailto:)/.test(href)
    ? href
    : `${repository}/blob/main/docs/${href}`
}
function decode(text: string) {
  return text.replace(
    /&(lt|gt|amp|quot|#39);/g,
    (_, entity: string) =>
      ({ lt: '<', gt: '>', amp: '&', quot: '"', '#39': "'" })[entity] ?? '',
  )
}
function content(tokens: Token[]): ReactNode {
  return tokens.map((token, index) => {
    let node: ReactNode
    switch (token.type) {
      case 'space':
        return null
      case 'heading': {
        const t = token as Tokens.Heading
        if (t.depth === 1) return null
        node = createElement(
          `h${Math.min(6, t.depth)}`,
          { id: headingId(t.text) },
          content(t.tokens),
        )
        break
      }
      case 'paragraph':
        node = <p>{content((token as Tokens.Paragraph).tokens)}</p>
        break
      case 'text': {
        const t = token as Tokens.Text
        node = t.tokens ? content(t.tokens) : decode(t.text)
        break
      }
      case 'escape':
        node = decode((token as Tokens.Escape).text)
        break
      case 'codespan':
        node = <code>{decode((token as Tokens.Codespan).text)}</code>
        break
      case 'code':
        node = <Code>{(token as Tokens.Code).text}</Code>
        break
      case 'strong':
        node = <strong>{content((token as Tokens.Strong).tokens)}</strong>
        break
      case 'em':
        node = <em>{content((token as Tokens.Em).tokens)}</em>
        break
      case 'del':
        node = <del>{content((token as Tokens.Del).tokens)}</del>
        break
      case 'link': {
        const t = token as Tokens.Link
        node = <a href={hrefFor(t.href)}>{content(t.tokens)}</a>
        break
      }
      case 'list': {
        const t = token as Tokens.List
        const items = t.items.map((item, i) => (
          <li key={i}>{content(item.tokens)}</li>
        ))
        node = t.ordered ? <ol>{items}</ol> : <ul>{items}</ul>
        break
      }
      case 'blockquote':
        node = (
          <blockquote>
            {content((token as Tokens.Blockquote).tokens)}
          </blockquote>
        )
        break
      case 'hr':
        node = <hr />
        break
      case 'br':
        node = <br />
        break
      case 'table': {
        const t = token as Tokens.Table
        node = (
          <div className="table-scroll" tabIndex={0}>
            <table>
              <thead>
                <tr>
                  {t.header.map((cell, i) => (
                    <th scope="col" key={i}>
                      {content(cell.tokens)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.rows.map((row, i) => (
                  <tr key={i}>
                    {row.map((cell, j) => (
                      <td key={j}>{content(cell.tokens)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        break
      }
      default:
        node = token.raw
    }
    return <Fragment key={index}>{node}</Fragment>
  })
}
export function Markdown({ source }: { source: string }) {
  return <>{content(marked.lexer(source))}</>
}
