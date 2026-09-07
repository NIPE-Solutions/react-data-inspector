import { useState } from 'react'
import { DataInspector } from '../../src'
export function JsonInput() {
  const [text, setText] = useState('{"status":"ready","items":[1,2,3]}')
  const [value, setValue] = useState<unknown>({
    status: 'ready',
    items: [1, 2, 3],
  })
  const [error, setError] = useState('')
  return (
    <>
      <div className="lab-intro">
        <h2>Bring your own JSON.</h2>
        <p>
          Parsed locally with JSON.parse. For Date, Map, cycles and other
          JavaScript values, use predefined scenarios. No JavaScript expressions
          are executed.
        </p>
      </div>
      <form
        className="lab-json"
        onSubmit={(event) => {
          event.preventDefault()
          try {
            setValue(JSON.parse(text))
            setError('')
          } catch {
            setError('Invalid JSON. Check quotes, commas and brackets.')
          }
        }}
      >
        <label htmlFor="lab-json">JSON input</label>
        <textarea
          id="lab-json"
          value={text}
          onChange={(event) => setText(event.target.value)}
          spellCheck={false}
        />
        <button type="submit">Inspect JSON</button>
        <p role="alert">{error}</p>
      </form>
      <DataInspector
        value={value}
        searchable
        theme="light"
        aria-label="JSON inspector"
      />
    </>
  )
}
