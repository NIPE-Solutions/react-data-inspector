import results from '../../benchmarks/results.json'
export function BenchmarkEvidence() {
  const cases = results.rows.filter((row) =>
    ['small', 'wide', 'array500k'].includes(row.name),
  )
  return (
    <section className="benchmark-evidence">
      <h2>Recorded model measurements</h2>
      <p>
        Snapshot: {results.date.slice(0, 10)}. {results.environment.cpu},{' '}
        {results.environment.platform} {results.environment.arch}, Node{' '}
        {results.environment.node}. These are model operations, not browser
        frame rates or React render times.
      </p>
      <div className="table-scroll" tabIndex={0}>
        <table>
          <caption>
            Median of 10 samples after one warmup. Fixture construction
            excluded; expansion depth 2, ranges remain closed.
          </caption>
          <thead>
            <tr>
              <th scope="col">Fixture</th>
              <th scope="col">Expanded model</th>
              <th scope="col">Model rows</th>
            </tr>
          </thead>
          <tbody>
            {cases.map((row) => (
              <tr key={row.name}>
                <th scope="row">
                  {row.name === 'array500k'
                    ? '500,000-item array'
                    : row.name === 'wide'
                      ? '100,000-property object'
                      : 'Small object'}
                </th>
                <td>{row.expanded.medianMs.toFixed(3)} ms</td>
                <td>{row.visibleRows}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="annotation">
        The wide object pays for synchronous own-key enumeration. The array
        opens only its first level of ranges. These cases perform different
        work; dataset size alone is not a speed comparison.{' '}
        <a href="/evidence/model.json">
          Download every raw sample and environment field.
        </a>
      </p>
    </section>
  )
}
