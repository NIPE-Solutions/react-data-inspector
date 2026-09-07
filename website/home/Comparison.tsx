const rows = [
  ['Valid JSON', 'Core input', 'Supported'],
  ['Real JavaScript types', 'Outside the JSON format', 'Native type adapters'],
  ['Circular references', 'Not representable in JSON', 'Ancestor references'],
  ['Shared identity', 'Lost when serialized', 'Shared-reference targets'],
  [
    'Safe accessors',
    'JSON contains no accessors',
    'Descriptors; getters stay unevaluated',
  ],
  [
    'Controlled state',
    'Depends on the library',
    'Expansion, selection and search',
  ],
  [
    'First-class paths',
    'Depends on the library',
    'Typed paths; compatible JSON Pointer',
  ],
  ['Large-array grouping', 'Depends on the library', 'Hierarchical ranges'],
  [
    'Search collapsed data',
    'Depends on the library',
    'Cancellable, budgeted search',
  ],
  [
    'Custom domain types',
    'Depends on the library',
    'Typed registry with lazy children',
  ],
  [
    'Unstyled mode',
    'Depends on the library',
    'Behavior with application-owned CSS',
  ],
] as const
export function Comparison() {
  return (
    <section className="section" id="choose">
      <div className="section-intro">
        <h2>Choose the right inspector.</h2>
        <p>
          For a serialized API response, a JSON viewer may be enough. For
          application values, ask what survives beyond serialization.
        </p>
      </div>
      <div className="table-scroll" tabIndex={0}>
        <table>
          <caption>
            Capability comparison with a JSON-focused baseline, not a rating of
            individual libraries.
          </caption>
          <thead>
            <tr>
              <th scope="col">Capability</th>
              <th scope="col">Typical JSON viewer</th>
              <th scope="col">React Data Inspector</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([capability, json, inspector]) => (
              <tr key={capability}>
                <th scope="row">{capability}</th>
                <td>{json}</td>
                <td>{inspector}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="annotation">
        Some JSON viewers also support JavaScript values and advanced
        interaction. Check their specific APIs. This comparison describes the
        JSON format boundary; it does not imply that every alternative lacks
        these capabilities.
      </p>
      <p className="section-link">
        <a href="/guides/migrate-from-react18-json-view">
          From react18-json-view
        </a>
        <a href="/guides/migrate-from-react-json-view-lite">
          From react-json-view-lite
        </a>
        <a href="/guides/migrate-from-uiw-react-json-view">
          From @uiw/react-json-view
        </a>
      </p>
    </section>
  )
}
