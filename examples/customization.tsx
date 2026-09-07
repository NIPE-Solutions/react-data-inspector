import { useState } from 'react'
import {
  DataInspector,
  defineInspectorType,
  formatPath,
  type DataPath,
  type InspectorSlotProps,
  type InspectorNodeContext,
} from '../src'
export class Money {
  constructor(
    readonly amount: number,
    readonly currency: string,
  ) {}
}
export const moneyType = defineInspectorType<Money>({
  id: 'money',
  matches: (value): value is Money => value instanceof Money,
  summary: (value) => `${value.currency} ${value.amount.toFixed(2)}`,
  children: (value) => ({
    count: 2,
    getPage: (offset, limit) =>
      [
        { key: 'amount', value: value.amount },
        { key: 'currency', value: value.currency },
      ].slice(offset, offset + limit),
  }),
})
export function PlusToggle({ expanded }: InspectorSlotProps) {
  return <span>{expanded ? '−' : '+'}</span>
}
export function ControlledExample() {
  const [expanded, setExpanded] = useState<readonly DataPath[]>([[]])
  const [selected, setSelected] = useState<DataPath | null>(null)
  const [details, setDetails] = useState<InspectorNodeContext | null>(null)
  return (
    <div className="controlled-example">
      <div>
        <button onClick={() => setExpanded([[], ['user']])}>
          Expand user from application
        </button>
        <DataInspector
          value={{ user: { id: 42, name: 'Nicholas' }, active: true }}
          expandedPaths={expanded}
          onExpandedPathsChange={setExpanded}
          selectedPath={selected}
          onSelectedPathChange={(path, node) => {
            setSelected(path)
            setDetails(node)
          }}
        />
      </div>
      <aside aria-label="Selected node details">
        <span>Selected path</span>
        <code>{selected ? formatPath(selected) : 'Select a node'}</code>
        <span>Expanded paths</span>
        <code>{expanded.map(formatPath).join(', ') || 'None'}</code>
        <span>Selected value</span>
        <code>
          {details
            ? `${details.type}: ${details.summary}`
            : 'Your application receives the path and node context.'}
        </code>
      </aside>
    </div>
  )
}
export const customizationValue = {
  invoice: 'INV-0042',
  price: new Money(12.99, 'EUR'),
  customer: { id: 42, name: 'Nicholas' },
  paid: true,
}
