import { useState } from 'react'
const checks = [
  [
    'Keyboard navigation',
    'Tab into the tree. Use arrows, Home/End and type-ahead. Enter expands branches or follows references; Space selects. F2 opens actions; closing restores tree focus.',
  ],
  [
    'Search & references',
    'Search a collapsed branch. Use Enter/Shift+Enter and next/previous controls. Follow shared and circular references. Check the revealed target and selected details.',
  ],
  [
    'Live external updates',
    'Expand stats and events, select a field, then start streaming. Pause, reorder events, remove a selected path and replace the dataset. Check path-oriented state and refreshed search.',
  ],
  [
    'Large values',
    'Open the 500,000-item dataset. Expand a range and use End. Enable measurements and confirm that mounted rows remain bounded. Search for a late index and observe reported limits.',
  ],
  [
    'Screen reader',
    'With VoiceOver/Safari or NVDA/Firefox, verify levels, expansion, selection, reference targets, search status and action names. Repeat while rows are virtualized.',
  ],
  [
    'Data lifetime',
    'Use browser memory tools with measurements disabled. Repeatedly replace and unmount a large dataset, collect garbage, and compare retained paths. Do not infer a leak from total heap alone.',
  ],
] as const
export function Validation() {
  const [checked, setChecked] = useState<string[]>([])
  return (
    <>
      <div className="lab-intro">
        <h2>Evidence, one interaction at a time.</h2>
        <p>
          This checklist is local to this visit. Checking a task records your
          own observation; it does not certify the library or change its release
          classification.
        </p>
      </div>
      <div className="lab-checklist">
        {checks.map(([title, text]) => (
          <label key={title}>
            <input
              type="checkbox"
              checked={checked.includes(title)}
              onChange={(e) =>
                setChecked(
                  e.target.checked
                    ? [...checked, title]
                    : checked.filter((item) => item !== title),
                )
              }
            />
            <span>
              <strong>{title}</strong>
              <span>{text}</span>
            </span>
          </label>
        ))}
      </div>
      <p role="status">
        {checked.length} of {checks.length} tasks marked in this visit.
      </p>
      <button onClick={() => setChecked([])}>Reset observations</button>
      <h3>What the automated suite covers</h3>
      <p>
        Scenario switching, shared links, Money and unstyled rendering, external
        updates with retained expansion and search, bounded large arrays,
        mounting/unmounting, mobile layout and axe checks are exercised in
        Chromium, Firefox and WebKit. Run <code>npm run test:e2e</code> for
        current results; this page does not execute CI.
      </p>
      <h3>What remains manual</h3>
      <p>
        Actual screen-reader behavior, current Safari/mobile Safari,
        representative application integration and retained browser heaps still
        need recorded validation. The project remains{' '}
        <strong>PRIVATE PREVIEW READY</strong>.
      </p>
    </>
  )
}
