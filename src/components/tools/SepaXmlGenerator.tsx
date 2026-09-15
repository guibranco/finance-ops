import { useState, type ComponentType } from 'react'
import { ArrowDownToLine, ArrowUpFromLine } from 'lucide-react'
import Json2SepaPain008 from './Json2SepaPain008'
import Csv2SepaPain001 from './Csv2SepaPain001'
import { cx, segmented, segmentedBtn, segmentedBtnActive, segmentedBtnInactive, segmentedHint } from '../../ui'

const MODE_KEY = 'ft_sepa_mode'

type Mode = 'dd' | 'ct'

interface ModeDef {
  id: Mode
  label: string
  hint: string
  icon: ComponentType<{ size?: number }>
  component: ComponentType
}

const MODES: ModeDef[] = [
  { id: 'dd', label: 'Direct Debit', hint: 'pain.008 · JSON', icon: ArrowDownToLine, component: Json2SepaPain008 },
  { id: 'ct', label: 'Credit Transfer', hint: 'pain.001 · CSV', icon: ArrowUpFromLine, component: Csv2SepaPain001 },
]

// One "SEPA XML" tab, two generators: collect money (DD, pain.008, from the
// collection JSON) or pay money out (CT, pain.001, from a CSV of payees).
export default function SepaXmlGenerator() {
  const [mode, setMode] = useState<Mode>(() => {
    const saved = localStorage.getItem(MODE_KEY)
    return MODES.some(m => m.id === saved) ? (saved as Mode) : 'dd'
  })
  const active = MODES.find(m => m.id === mode) ?? MODES[0]
  const ActiveGenerator = active.component

  function handleModeChange(next: Mode) {
    setMode(next)
    localStorage.setItem(MODE_KEY, next)
  }

  return (
    <div>
      <div className={segmented} role="tablist" aria-label="SEPA message type">
        {MODES.map(m => {
          const isActive = m.id === mode
          const Icon = m.icon
          return (
            <button
              key={m.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={cx(segmentedBtn, isActive ? segmentedBtnActive : segmentedBtnInactive)}
              onClick={() => handleModeChange(m.id)}
            >
              <Icon size={14} />
              {m.label}
              <span className={segmentedHint}>{m.hint}</span>
            </button>
          )
        })}
      </div>
      <ActiveGenerator />
    </div>
  )
}
