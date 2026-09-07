import { useState } from 'react'
export const origin = 'https://react-data-inspector.nipesolutions.com'
export const repository =
  'https://github.com/NIPE-Solutions/react-data-inspector'
export const publishedVersion = import.meta.env.VITE_NPM_VERSION || ''
export function Header({ main = 'main' }: { main?: string }) {
  return (
    <>
      <a className="skip" href={`#${main}`}>
        Skip to content
      </a>
      <header id="top">
        <a className="brand" href="/">
          <img
            className="brand-mark"
            src="/logo.svg"
            width="32"
            height="32"
            alt=""
          />
          <span>React Data Inspector</span>
        </a>
        <nav aria-label="Main">
          <a href="/docs/installation">Install</a>
          <a href="/playground">Playground</a>
          <a href="/docs">Documentation</a>
          <a href={repository}>GitHub ↗</a>
        </nav>
      </header>
    </>
  )
}
export function Footer() {
  return (
    <footer>
      <a href="https://opensource.nipesolutions.com">
        Part of NIPE Open Source
      </a>
      <nav aria-label="Footer">
        <a href={repository}>GitHub ↗</a>
        <a href={`${repository}/blob/main/LICENSE`}>MIT License</a>
        <a href="/imprint">Imprint</a>
        <a href="/privacy">Privacy</a>
        <a href="/limitations">Limitations</a>
        {publishedVersion && (
          <a href="https://www.npmjs.com/package/@nipe-solutions/react-data-inspector">
            npm ↗
          </a>
        )}
        <a href="#top">Back to top ↑</a>
      </nav>
    </footer>
  )
}
export function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState('')
  return (
    <div className="code-example">
      <pre tabIndex={0}>
        <code>{children}</code>
      </pre>
      <button
        className="copy-code"
        aria-label="Copy code"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(children)
            setCopied('Copied')
          } catch {
            setCopied('Select the code to copy')
          }
        }}
      >
        Copy
      </button>
      <span className="copy-feedback" role="status">
        {copied}
      </span>
    </div>
  )
}
export function Installation({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? 'installation compact-install' : 'installation'}>
      {publishedVersion ? (
        <>
          <p>Available on npm · {publishedVersion}</p>
          <Code>{`npm install @nipe-solutions/react-data-inspector@${publishedVersion}`}</Code>
        </>
      ) : (
        <>
          <p>Beta source preview · npm release pending</p>
          {!compact && (
            <>
              <p>
                The repository is public. Build and install the package locally
                while the npm release is being prepared.
              </p>
              <Code>{`git clone ${repository}.git\ncd react-data-inspector\nnpm ci\nnpm run build\nnpm pack\n# In your React application, use the path to the generated .tgz:\nnpm install /path/to/nipe-solutions-react-data-inspector-0.1.0-beta.0.tgz`}</Code>
            </>
          )}
        </>
      )}
      {compact && (
        <a className="install-link" href="/docs/installation">
          {publishedVersion
            ? 'Installation and CSS setup'
            : 'Build from source'}
        </a>
      )}
    </div>
  )
}
