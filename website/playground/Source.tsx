import { useState } from 'react'
export function Source({
  code,
  title = 'Source code',
}: {
  code: string
  title?: string
}) {
  const [status, setStatus] = useState('')
  return (
    <details className="lab-source">
      <summary>{title}</summary>
      <button
        onClick={() => {
          void navigator.clipboard?.writeText(code).then(
            () => setStatus('Copied'),
            () => setStatus('Select the code below to copy.'),
          )
          if (!navigator.clipboard) setStatus('Select the code below to copy.')
        }}
      >
        Copy source
      </button>
      <span role="status">{status}</span>
      <pre tabIndex={0}>
        <code>{code}</code>
      </pre>
    </details>
  )
}
