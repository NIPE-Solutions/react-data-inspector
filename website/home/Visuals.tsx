import { useState } from 'react'
export function IdentityDiagram() {
  const [relation, setRelation] = useState<'shared' | 'circular'>('shared')
  return (
    <div className="identity-explainer">
      <div
        className="identity-controls"
        role="group"
        aria-label="Object relationships"
      >
        <button
          aria-pressed={relation === 'shared'}
          onClick={() => setRelation('shared')}
        >
          ↗ Shared identity
        </button>
        <button
          aria-pressed={relation === 'circular'}
          onClick={() => setRelation('circular')}
        >
          ↩ Circular reference
        </button>
        <p>
          {relation === 'shared'
            ? 'Two paths. One object. Changing the original is visible through both references.'
            : 'A reference back into its own ancestor chain. Following it recursively would never finish.'}
        </p>
      </div>
      <svg
        className="identity-map"
        viewBox="0 0 640 180"
        role="img"
        aria-label={
          relation === 'shared'
            ? 'user and copyOfUser connect to the same object identity'
            : 'self connects back to the root object'
        }
      >
        <defs>
          <marker
            id="graph-arrow"
            markerWidth="8"
            markerHeight="8"
            refX="6"
            refY="3"
            orient="auto"
          >
            <path d="M0 0 L6 3 L0 6" fill="none" stroke="currentColor" />
          </marker>
        </defs>
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="connection-lines"
        >
          {relation === 'shared' ? (
            <>
              <path
                d="M165 45 H295 Q320 45 320 70 V90 H420"
                markerEnd="url(#graph-arrow)"
              />
              <path d="M165 135 H295 Q320 135 320 110 V90" />
            </>
          ) : (
            <path
              d="M180 120 H475 Q530 120 530 70 Q530 30 470 30 H185"
              markerEnd="url(#graph-arrow)"
            />
          )}
        </g>
        {relation === 'shared' ? (
          <>
            <text x="30" y="50">
              $.user
            </text>
            <text x="30" y="140">
              $.copyOfUser
            </text>
            <rect x="430" y="55" width="200" height="70" rx="4" />
            <text x="450" y="86">
              Object {'{ id: 42 }'}
            </text>
            <text className="graph-caption" x="450" y="108">
              same identity
            </text>
          </>
        ) : (
          <>
            <text x="45" y="35">
              $ · root
            </text>
            <text x="45" y="125">
              $.self
            </text>
            <text className="graph-caption" x="215" y="160">
              back to an ancestor
            </text>
          </>
        )}
      </svg>
      <p className="identity-note">
        Circular references point into their own ancestor chain. Shared
        references point to an object already seen elsewhere. Those are
        different relationships, and the inspector preserves that distinction.{' '}
        <a href="/concepts/object-graphs">Read the graph model</a>
      </p>
    </div>
  )
}
const layers = [
  ['CSS variables', 'Colors, type and spacing'],
  ['Data attributes', 'Style semantic states'],
  ['Slots', 'Replace one piece of content'],
  ['Custom types', 'Describe domain values'],
  ['Actions', 'Connect application behavior'],
  ['Controlled state', 'Own selection and expansion'],
  ['Unstyled', 'Own the entire appearance'],
] as const
export function CustomizationLayers() {
  return (
    <ol className="customization-layers" aria-label="Customization layers">
      {layers.map(([name, description]) => (
        <li key={name}>
          <span>{name}</span>
          <small>{description}</small>
        </li>
      ))}
    </ol>
  )
}
export const keyboard = [
  ['↑ ↓', 'Navigate visible nodes'],
  ['← →', 'Collapse / expand; parent / child'],
  ['Home End', 'First / last visible node'],
  ['Enter', 'Activate branch, reference or leaf'],
  ['Space', 'Select focused node'],
  ['F2', 'Open node actions'],
] as const
export function KeyboardModel() {
  return (
    <dl className="keyboard-model">
      {keyboard.map(([keys, description]) => (
        <div key={keys}>
          <dt>
            <kbd>{keys}</kbd>
          </dt>
          <dd>{description}</dd>
        </div>
      ))}
    </dl>
  )
}
