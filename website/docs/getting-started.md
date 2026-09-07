## Put a value in a product panel

Complete [installation](/docs/installation) first, including the stylesheet import. The inspector needs only a value; your application continues to own it.

```tsx
import { useState } from 'react'
import { DataInspector } from '@nipe-solutions/react-data-inspector'
import '@nipe-solutions/react-data-inspector/styles.css'

export function JobPanel() {
  const [job, setJob] = useState({
    id: 'job-42',
    attempts: 1,
    receivedAt: new Date('2026-09-07T09:00:00Z'),
    labels: new Set(['normalization']),
  })

  return (
    <section>
      <h2>Background job</h2>
      <button
        onClick={() =>
          setJob((current) => ({
            ...current,
            attempts: current.attempts + 1,
          }))
        }
      >
        Record another attempt
      </button>
      <DataInspector
        value={job}
        searchable
        aria-label="Background job payload"
      />
    </section>
  )
}
```

The button updates React state outside the inspector. Rerendering shows the new value while expansion remains associated with its paths.

## Start with the defaults

- The root opens; child branches start closed.
- Selection is uncontrolled and initially empty.
- Built-in copy actions are available. Search controls are opt-in.
- The default presentation is `inspector`, the density is `compact`, and the theme follows the system preference.
- Input is read-only. The component never becomes the owner of your data.

Choose [classic presentation](/guides/presentation) for a more traditional object-viewer appearance. Change colors through [CSS variables](/reference/styling); no custom row component is needed.

## Connect the next interaction

| Need                          | Next step                                                              |
| ----------------------------- | ---------------------------------------------------------------------- |
| Open a particular branch      | [Expansion](/docs/expansion)                                           |
| React to a selected value     | [Selection](/docs/selection)                                           |
| Coordinate multiple controls  | [Controlled state](/guides/controlled-state)                           |
| Find values in collapsed data | [Search](/docs/search)                                                 |
| Paste an API response         | [Your JSON in the playground](/playground?section=json)                |
| Use server rendering          | [SSR and hydration](/docs/installation#server-rendering-and-hydration) |

## Check the boundary before adoption

Read the [limitations](/limitations) and [accessibility audit status](/accessibility) for the current beta. A successful local example does not replace testing with your application's data, customizations, and assistive technologies.
