import { useState, type ComponentType } from 'react'
import {
  ArrowLeftRight,
  FileSearch,
  LayoutGrid,
  RefreshCw,
  Scale,
  Table2,
  Undo2,
  Zap,
} from 'lucide-react'
import CollectionItem2ResubmissionItem from './components/tools/CollectionItem2ResubmissionItem'
import CollectionItem2ShadowLedger from './components/tools/CollectionItem2ShadowLedger'
import UpdateCollectionStatus from './components/tools/UpdateCollectionStatus'
import Json2SepaPain008 from './components/tools/Json2SepaPain008'
import PaymentSchedule2Refund from './components/tools/PaymentSchedule2Refund'
import ShadowLedgerReconciliation from './components/tools/ShadowLedgerReconciliation'
import ShadowLedgerVisualizer from './components/tools/ShadowLedgerVisualizer'
import SepaFileVisualizer from './components/tools/SepaFileVisualizer'
import {
  appHeader,
  appMain,
  appShell,
  brandLogo,
  brandSubtitle,
  brandTitle,
  cx,
  headerBadge,
  headerBadgeDot,
  headerBrand,
  tabBtn,
  tabBtnActive,
  tabIcon,
  tabIconActive,
  tabLabel,
  tabNav,
  toolHeader,
  toolHeaderDesc,
  toolHeaderTitle,
  toolWrapper,
} from './ui'

const ACTIVE_TAB_KEY = 'ft_active_tab'

interface Tool {
  id: string
  label: string
  icon: ComponentType<{ size?: number }>
  component: ComponentType
  desc: string
}

const TOOLS: Tool[] = [
  {
    id: 'resubmission',
    label: 'Resubmission',
    icon: RefreshCw,
    component: CollectionItem2ResubmissionItem,
    desc: 'Transform rejected collections into resubmission documents',
  },
  {
    id: 'shadow-ledger',
    label: 'Collection → Shadow Ledger',
    icon: LayoutGrid,
    component: CollectionItem2ShadowLedger,
    desc: 'Convert Collection Items into Shadow Ledger requests',
  },
  {
    id: 'reject',
    label: 'Process Collection',
    icon: ArrowLeftRight,
    component: UpdateCollectionStatus,
    desc: 'Generate historic and new collection documents for any target status',
  },
  {
    id: 'sepa',
    label: 'SEPA XML',
    icon: Zap,
    component: Json2SepaPain008,
    desc: 'Convert Direct Debit JSON to SEPA pain.008.001.08 XML',
  },
  {
    id: 'refund',
    label: 'Refund Schedule',
    icon: Undo2,
    component: PaymentSchedule2Refund,
    desc: 'Generate refund schedule items and collection documents',
  },
  {
    id: 'gl-reconcile',
    label: 'GL Reconciliation',
    icon: Scale,
    component: ShadowLedgerReconciliation,
    desc: 'Reconcile the Collection Items CSV export against the D365 GL Journal CSV export',
  },
  {
    id: 'sl-visualizer',
    label: 'SL Visualizer',
    icon: Table2,
    component: ShadowLedgerVisualizer,
    desc: 'Browse and filter a Shadow Ledger entries JSON payload, with a per-dimension debit/credit balance check',
  },
  {
    id: 'sepa-visualizer',
    label: 'SEPA File Visualizer',
    icon: FileSearch,
    component: SepaFileVisualizer,
    desc: 'Load pain.008 (Direct Debit) or pain.001 (Credit Transfer) SEPA XML files and browse their structure',
  },
]

export default function App() {
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem(ACTIVE_TAB_KEY)
    return TOOLS.some(t => t.id === saved) ? saved! : 'resubmission'
  })
  const activeMeta = TOOLS.find(t => t.id === activeTab)
  const ActiveTool = activeMeta?.component

  function handleTabChange(id: string) {
    setActiveTab(id)
    localStorage.setItem(ACTIVE_TAB_KEY, id)
  }

  return (
    <div className={appShell}>
      <header className={appHeader}>
        <div className={headerBrand}>
          <div className={brandLogo}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="2" width="8" height="8" rx="2" fill="#93cd3f" />
              <rect x="12" y="2" width="8" height="8" rx="2" fill="rgba(147,205,63,0.5)" />
              <rect x="2" y="12" width="8" height="8" rx="2" fill="rgba(147,205,63,0.5)" />
              <rect x="12" y="12" width="8" height="8" rx="2" fill="rgba(147,205,63,0.25)" />
            </svg>
          </div>
          <div>
            <h1 className={brandTitle}>Finance Ops Toolbox</h1>
            <p className={brandSubtitle}>Internal collection &amp; payment tools</p>
          </div>
        </div>
        <div className={headerBadge}>
          <span className={headerBadgeDot} />
          Internal · 8 tools
        </div>
      </header>

      <nav className={tabNav}>
        {TOOLS.map(tool => {
          const isActive = activeTab === tool.id
          const Icon = tool.icon
          return (
            <button
              key={tool.id}
              className={cx(tabBtn, isActive && tabBtnActive)}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => handleTabChange(tool.id)}
            >
              <span className={cx(tabIcon, isActive && tabIconActive)}>
                <Icon size={13} />
              </span>
              <span className={tabLabel}>{tool.label}</span>
            </button>
          )
        })}
      </nav>

      <main className={appMain}>
        <div className={toolWrapper}>
          <div className={toolHeader}>
            <h2 className={toolHeaderTitle}>{activeMeta?.label}</h2>
            <p className={toolHeaderDesc}>{activeMeta?.desc}</p>
          </div>
          {ActiveTool && <ActiveTool />}
        </div>
      </main>
    </div>
  )
}
