// Renders the "field mapping / transformation rules" reference card shown
// under a tool's converter, driven by a plain [{ label, rule }] list.
export default function RulesGrid({ title, rules, style }) {
  return (
    <div style={style}>
      <div className="card-title" style={{ marginBottom: 12 }}>
        <span className="card-title-dot" /> {title}
      </div>
      <div className="rules-grid">
        {rules.map(r => (
          <div className="rule-card" key={r.label}>
            <h4>{r.label}</h4>
            <p>{r.rule}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
