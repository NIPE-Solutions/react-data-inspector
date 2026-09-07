import { Live as LiveExample } from '../../examples/live-updates'
import source from '../../examples/live-updates.tsx?raw'
import dataSource from '../../examples/live-data.ts?raw'
import { Source } from './Source'
export function Live() {
  return (
    <>
      <LiveExample />
      <Source
        code={source.replaceAll(
          "'../src'",
          "'@nipe-solutions/react-data-inspector'",
        )}
        title="live-updates.tsx — application source"
      />
      <Source code={dataSource} title="live-data.ts — external update model" />
    </>
  )
}
