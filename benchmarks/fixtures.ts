export function fixtures(): Record<string, unknown> {
  let deep: unknown = 1
  for (let i = 0; i < 1000; i++) deep = { child: deep }
  const shared = { id: 42, nested: { value: 'needle' } }
  const cycle: Record<string, unknown> = {}
  cycle.self = cycle
  return {
    small: { id: 42, name: 'needle', active: true },
    deep,
    wide: Object.fromEntries(
      Array.from({ length: 100000 }, (_, i) => [`key${i}`, i]),
    ),
    nodes1k: Array.from({ length: 1000 }, (_, i) => ({ id: i })),
    nodes10k: Array.from({ length: 10000 }, (_, i) => ({ id: i })),
    nodes100k: Array.from({ length: 100000 }, (_, i) => ({ id: i })),
    array500k: Array(500000).fill(1),
    cycles: Array(10000).fill(cycle),
    shared: Array(10000).fill(shared),
  }
}
