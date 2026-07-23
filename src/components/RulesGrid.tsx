import type { CSSProperties } from 'react'
import { cardTitle, cardTitleDot, cx, ruleCard, ruleCardTitle, ruleCardText, rulesGrid } from '../ui'

export interface Rule {
  label: string
  rule: string
}

interface RulesGridProps {
  title: string
  rules: Rule[]
  style?: CSSProperties
}

// Renders the "field mapping / transformation rules" reference card shown
// under a tool's converter, driven by a plain [{ label, rule }] list.
export default function RulesGrid({ title, rules, style }: RulesGridProps) {
  return (
    <div style={style}>
      <div className={cx(cardTitle, 'mb-3')}>
        <span className={cardTitleDot} /> {title}
      </div>
      <div className={rulesGrid}>
        {rules.map(r => (
          <div className={ruleCard} key={r.label}>
            <h4 className={ruleCardTitle}>{r.label}</h4>
            <p className={ruleCardText}>{r.rule}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
