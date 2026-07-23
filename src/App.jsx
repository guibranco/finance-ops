import { useState } from 'react'
import CollectionItem2ResubmissionItem from './components/tools/CollectionItem2ResubmissionItem'
import CollectionItem2ShadowLedger from './components/tools/CollectionItem2ShadowLedger'
import UpdateCollectionStatus from './components/tools/UpdateCollectionStatus'
import Json2SepaPain008 from './components/tools/Json2SepaPain008'
import PaymentSchedule2Refund from './components/tools/PaymentSchedule2Refund'
import ShadowLedgerReconciliation from './components/tools/ShadowLedgerReconciliation'
import ShadowLedgerVisualizer from './components/tools/ShadowLedgerVisualizer'
import SepaFileVisualizer from './components/tools/SepaFileVisualizer'

const ACTIVE_TAB_KEY = 'ft_active_tab'

const TOOLS = [
  {
    id: 'resubmission',
    label: 'Resubmission',
    icon: '↻',
    component: CollectionItem2ResubmissionItem,
    desc: 'Transform rejected collections into resubmission documents',
  },
  {
    id: 'shadow-ledger',
    label: 'Collection → Shadow Ledger',
    icon: '⊞',
    component: CollectionItem2ShadowLedger,
    desc: 'Convert Collection Items into Shadow Ledger requests',
  },
  {
    id: 'reject',
    label: 'Process Collection',
    icon: '⇄',
    component: UpdateCollectionStatus,
    desc: 'Generate historic and new collection documents for any target status',
  },
  {
    id: 'sepa',
    label: 'SEPA XML',
    icon: '⌁',
    component: Json2SepaPain008,
    desc: 'Convert Direct Debit JSON to SEPA pain.008.001.08 XML',
  },
  {
    id: 'refund',
    label: 'Refund Schedule',
    icon: '↩',
    component: PaymentSchedule2Refund,
    desc: 'Generate refund schedule items and collection documents',
  },
  {
    id: 'gl-reconcile',
    label: 'GL Reconciliation',
    icon: '⚖',
    component: ShadowLedgerReconciliation,
    desc: 'Reconcile the Collection Items CSV export against the D365 GL Journal CSV export',
  },
  {
    id: 'sl-visualizer',
    label: 'SL Visualizer',
    icon: '▤',
    component: ShadowLedgerVisualizer,
    desc: 'Browse and filter a Shadow Ledger entries JSON payload, with a per-dimension debit/credit balance check',
  },
  {
    id: 'sepa-visualizer',
    label: 'SEPA File Visualizer',
    icon: '⟐',
    component: SepaFileVisualizer,
    desc: 'Load pain.008 (Direct Debit) or pain.001 (Credit Transfer) SEPA XML files and browse their structure',
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_TAB_KEY)
    return TOOLS.some(t => t.id === saved) ? saved : 'resubmission'
  })
  const ActiveTool = TOOLS.find(t => t.id === activeTab)?.component
  const activeMeta = TOOLS.find(t => t.id === activeTab)

  function handleTabChange(id) {
    setActiveTab(id)
    localStorage.setItem(ACTIVE_TAB_KEY, id)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <div className="brand-logo">
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="8" height="8" rx="2" fill="#93cd3f" />
              <rect x="12" y="2" width="8" height="8" rx="2" fill="rgba(147,205,63,0.5)" />
              <rect x="2" y="12" width="8" height="8" rx="2" fill="rgba(147,205,63,0.5)" />
              <rect x="12" y="12" width="8" height="8" rx="2" fill="rgba(147,205,63,0.25)" />
            </svg>
          </div>
          <div className="brand-text">
            <h1>Finance Ops Toolbox</h1>
            <p>Internal collection &amp; payment tools</p>
          </div>
        </div>
        <div className="header-badge">
          <span className="header-badge-dot" />
          Internal · 8 tools
        </div>
      </header>

      <nav className="tab-nav">
        {TOOLS.map(tool => (
          <button
            key={tool.id}
            className={`tab-btn${activeTab === tool.id ? ' active' : ''}`}
            onClick={() => handleTabChange(tool.id)}
          >
            <span className="tab-icon">{tool.icon}</span>
            <span className="tab-label">{tool.label}</span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        <div className="tool-wrapper">
          <div className="tool-header">
            <h2>{activeMeta?.label}</h2>
            <p>{activeMeta?.desc}</p>
          </div>
          {ActiveTool && <ActiveTool />}
        </div>
      </main>
    </div>
  )
}
