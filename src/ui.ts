// Shared Tailwind utility-class constants for the design patterns every tool
// screen repeats (cards, form fields, buttons, badges, alerts, tables...).
// Centralizing them here means every component draws from one definition
// instead of re-typing (and risking drift in) the same long utility strings.

export const appShell = 'flex flex-col min-h-screen';

export const appHeader =
  'sticky top-0 z-100 bg-purple-dark border-b border-black/12 px-7 flex items-center justify-between h-[68px] shadow-[0_2px_12px_rgba(94,43,108,0.3)] max-tool:px-4';

export const headerBrand = 'flex items-center gap-3.5';

export const brandLogo =
  'w-10 h-10 rounded-[10px] bg-white/15 border border-white/20 flex items-center justify-center shrink-0';

export const brandTitle = "text-[1.1rem] font-bold tracking-[-0.01em] text-white leading-[1.2]";
export const brandSubtitle = "text-[0.72rem] text-white/60 font-normal tracking-[0.02em]";

export const headerBadge =
  "flex items-center gap-1.5 bg-green-bright/20 border border-green-bright/40 text-[#c6f06a] text-[0.72rem] font-semibold px-2.5 py-[5px] rounded-full font-mono tracking-[0.04em]";

export const headerBadgeDot = 'w-1.5 h-1.5 rounded-full bg-green-bright animate-pulse-dot';

export const tabNav =
  'bg-surface border-b-2 border-[rgba(121,55,139,0.12)] flex gap-0.5 px-5 overflow-x-auto shadow-[0_1px_4px_rgba(121,55,139,0.06)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-tool:px-4';

export const tabBtn =
  'flex items-center gap-2 px-[18px] py-3.5 bg-transparent border-0 border-b-2 border-transparent text-text-muted font-ui text-[0.85rem] font-medium cursor-pointer whitespace-nowrap transition-colors relative -mb-0.5 hover:text-purple hover:bg-purple-dim max-tool:px-3';
export const tabBtnActive = 'text-purple border-b-purple font-bold';

export const tabIcon =
  'w-[22px] h-[22px] rounded-[6px] flex items-center justify-center shrink-0 bg-bg border border-border transition-colors [&_svg]:size-[13px]';
export const tabIconActive = 'bg-purple-dim border-purple-border';

export const tabLabel = 'max-tool:hidden';

export const appMain = 'flex-1 overflow-y-auto';
export const toolWrapper = 'max-w-[1500px] mx-auto px-7 pt-7 pb-12 max-tool:p-4';
export const toolHeader = 'mb-7';
export const toolHeaderTitle = "text-[1.4rem] font-bold text-purple-dark mb-1 tracking-[-0.02em]";
export const toolHeaderDesc = 'text-[0.88rem] text-text-muted';

export const toolGrid2 = 'grid grid-cols-2 gap-5 max-tool:grid-cols-1';

export const card =
  'bg-white border border-border rounded-lg p-[22px] shadow-md transition-[border-color,box-shadow] duration-[180ms] focus-within:border-purple-border focus-within:shadow-lg';

export const cardTitle = 'text-[0.78rem] font-bold tracking-[0.07em] uppercase text-text-muted mb-3.5 flex items-center gap-2';
export const cardTitleDot = 'w-1.5 h-1.5 rounded-full bg-purple shrink-0';
export const cardTitleDotGreen = 'w-1.5 h-1.5 rounded-full bg-green shrink-0';

export const formField = 'mb-4 last:mb-0';
export const formLabel = "block text-[0.78rem] font-bold text-text-muted mb-[7px] tracking-[0.03em]";

export const formInput =
  'w-full px-[13px] py-2.5 bg-bg border border-border rounded-sm text-text font-mono text-[0.82rem] outline-none transition-[border-color,box-shadow] duration-[180ms] placeholder:text-text-faint focus:border-purple-border focus:shadow-[0_0_0_3px_var(--color-purple-dim)] focus:bg-white';
export const formSelect = `${formInput} select-arrow cursor-pointer`;

export const codeAreaWrap = 'relative';
export const codeArea =
  'w-full min-h-[200px] p-3.5 bg-code-bg border border-code-border rounded-sm text-code-text font-mono text-[0.8rem] leading-[1.6] resize-y outline-none transition-[border-color,box-shadow] duration-[180ms] placeholder:text-text-faint focus:border-purple-border focus:shadow-[0_0_0_3px_var(--color-purple-dim)] focus:bg-white read-only:cursor-default read-only:bg-code-bg';
export const codeAreaSm = 'min-h-[120px]';
export const codeAreaTall = 'min-h-[380px]';
export const codeAreaXl = 'min-h-[480px]';

export const btn =
  'inline-flex items-center justify-center gap-[7px] px-[18px] py-2.5 border-0 rounded-sm font-ui text-[0.85rem] font-semibold cursor-pointer transition-all whitespace-nowrap disabled:opacity-35 disabled:cursor-not-allowed disabled:hover:transform-none';
export const btnPrimary = 'bg-purple text-white shadow-purple hover:bg-purple-dark hover:-translate-y-px hover:shadow-purple-lg active:translate-y-0';
export const btnSecondary = 'bg-green-dim text-green border border-green-border hover:bg-[rgba(118,164,50,0.18)]';
export const btnGhost = 'bg-bg text-text-muted border border-border hover:text-purple hover:border-purple-border hover:bg-purple-dim';
export const btnDanger = 'bg-danger-dim text-danger border border-[rgba(192,57,43,0.2)] hover:bg-[rgba(192,57,43,0.12)]';
export const btnRow = 'flex gap-2.5 flex-wrap mt-4';

export const btnCopy =
  'absolute top-2.5 right-2.5 px-[11px] py-[5px] text-[0.73rem] bg-purple text-white border-0 rounded-md cursor-pointer font-ui font-semibold transition-all shadow-[0_1px_4px_rgba(121,55,139,0.2)] hover:bg-purple-dark';
export const btnCopyCopied = 'bg-green hover:bg-green';

export const badge = 'inline-flex items-center gap-[5px] px-2.5 py-1 rounded-full text-[0.72rem] font-bold tracking-[0.06em] uppercase font-mono';
export const badgeVariants = {
  ready: 'bg-purple-dim text-purple border border-purple-border',
  success: 'bg-green-dim text-green border border-green-border',
  error: 'bg-danger-dim text-danger border border-[rgba(192,57,43,0.2)]',
  raise: 'bg-[rgba(37,99,235,0.07)] text-info border border-[rgba(37,99,235,0.2)]',
  failed: 'bg-danger-dim text-danger border border-[rgba(192,57,43,0.2)]',
} as const;

export const alert = 'p-3 rounded-sm text-[0.82rem] leading-[1.5] mt-3.5';
export const alertVariants = {
  error: 'bg-danger-dim text-danger border border-[rgba(192,57,43,0.2)] font-mono',
  success: 'bg-green-dim text-green border border-green-border',
  info: 'bg-[rgba(37,99,235,0.06)] text-info border border-[rgba(37,99,235,0.18)]',
  warning: 'bg-warning-dim text-warning border border-warning-border font-mono',
} as const;
export const alertList = 'mt-1 pl-[18px]';
export const alertListItem = 'my-0.5';

export const diffGrid = 'grid grid-cols-2 gap-3 max-tool:grid-cols-1';
export const diffPane =
  'bg-code-bg border border-code-border rounded-sm p-3.5 font-mono text-[0.78rem] leading-[1.6] whitespace-pre-wrap break-all overflow-auto max-h-[460px] text-code-text';
export const diffAdded = 'bg-[rgba(118,164,50,0.15)] block';
export const diffRemoved = 'bg-[rgba(192,57,43,0.12)] block';
export const diffChanged = 'bg-[rgba(234,179,8,0.12)] block';

export const rulesGrid = 'grid [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))] gap-3 mt-3.5';
export const ruleCard = 'bg-bg border border-border border-l-[3px] border-l-purple rounded-sm px-4 py-3.5';
export const ruleCardTitle = "text-[0.8rem] font-bold text-text mb-[7px]";
export const ruleCardText = 'text-[0.77rem] text-text-muted mb-1 font-mono last:mb-0';

export const scheduleItemsList =
  'flex flex-col gap-2 max-h-[220px] overflow-y-auto py-1 [scrollbar-width:thin] [scrollbar-color:var(--color-border)_transparent]';
export const scheduleItemCheck =
  'flex items-start gap-2.5 px-3 py-2.5 bg-bg border border-border rounded-sm cursor-pointer transition-colors hover:border-purple-border hover:bg-purple-dim';
export const scheduleItemCheckbox = 'mt-0.5 accent-purple w-[15px] h-[15px] shrink-0 cursor-pointer';
export const itemInfo = 'font-mono text-[0.76rem] text-text-muted leading-[1.6]';
export const itemId = 'text-purple font-semibold';
export const itemAmount = 'text-text font-semibold';

export const divider = 'h-px bg-border my-[22px]';

export const statTileRow = 'flex gap-3 flex-wrap mt-3.5';
export const statTile = 'flex-1 min-w-[150px] bg-code-bg border border-code-border rounded-sm px-3.5 py-3';
export const statTileLabel = "text-[0.72rem] text-text-muted uppercase tracking-[0.04em]";
export const statTileValue = 'font-mono text-[1.05rem] font-bold text-text mt-1';

export const tableWrap = 'overflow-x-auto border border-border rounded-sm mt-3.5';
export const vizTableWrap = `${tableWrap} max-h-[560px]`;
export const table = 'w-full border-collapse font-mono text-[0.78rem]';
export const vizTable = 'w-full border-collapse font-mono text-[0.76rem]';
export const th = 'px-2.5 py-2 text-right border-b border-border-subtle whitespace-nowrap';
export const thFirst = 'px-2.5 py-2 text-left border-b border-border-subtle whitespace-normal break-all';
export const td = 'px-2.5 py-2 text-right border-b border-border-subtle whitespace-nowrap';
export const tdFirst = 'px-2.5 py-2 text-left border-b border-border-subtle whitespace-normal break-all';
export const theadRow = "bg-code-bg font-ui text-[0.72rem] uppercase tracking-[0.03em] text-text-muted sticky top-0";
export const vizTh = 'px-2.5 py-[7px] text-left border-b border-border-subtle whitespace-nowrap';
export const vizThNum = 'px-2.5 py-[7px] text-right border-b border-border-subtle whitespace-nowrap';
export const vizTd = 'px-2.5 py-[7px] text-left border-b border-border-subtle whitespace-nowrap';
export const vizTdNum = 'px-2.5 py-[7px] text-right border-b border-border-subtle whitespace-nowrap';
export const vizTheadRow =
  "bg-code-bg font-ui text-[0.7rem] uppercase tracking-[0.03em] text-text-muted sticky top-0 cursor-pointer select-none hover:text-purple";
export const vizRowHover = 'hover:bg-purple-dim';
export const vizSortArrow = 'ml-1 opacity-60 text-[0.65rem]';

export const reconRowVariants = {
  match: '',
  mismatch: 'bg-danger-dim',
  'raw-only': 'bg-warning-dim',
  'journal-only': 'bg-warning-dim',
} as const;

export const statusPill = "font-ui font-bold text-[0.7rem] tracking-[0.03em] px-[9px] py-0.5 rounded-full whitespace-nowrap";
export const reconStatusVariants = {
  match: 'text-green bg-green-dim border border-green-border',
  mismatch: 'text-danger bg-danger-dim border border-[rgba(192,57,43,0.2)]',
  'raw-only': 'text-warning bg-warning-dim border border-warning-border',
  'journal-only': 'text-warning bg-warning-dim border border-warning-border',
} as const;

export const entryGlEntryVariants = {
  debit: "font-ui font-bold text-[0.68rem] tracking-[0.03em] px-[9px] py-0.5 rounded-full whitespace-nowrap text-info bg-[rgba(37,99,235,0.07)] border border-[rgba(37,99,235,0.2)]",
  credit: "font-ui font-bold text-[0.68rem] tracking-[0.03em] px-[9px] py-0.5 rounded-full whitespace-nowrap text-green bg-green-dim border border-green-border",
} as const;

export const amtNeg = 'text-danger';
export const amtPos = 'text-green';

export const fileList = 'flex flex-col gap-2 mt-3.5';
export const fileRow =
  'flex items-center gap-2.5 px-3 py-2.5 bg-bg border border-border rounded-sm cursor-pointer transition-colors hover:border-purple-border hover:bg-purple-dim';
export const fileRowActive = 'border-purple bg-purple-dim';
export const fileRowError = 'border-[rgba(192,57,43,0.3)] bg-danger-dim';
export const fileName = 'font-mono text-[0.78rem] text-text flex-1 break-all';
export const fileMeta = 'font-mono text-[0.72rem] text-text-muted whitespace-nowrap';
export const fileRemoveBtn =
  'bg-transparent border-0 text-text-faint cursor-pointer text-[0.9rem] px-1.5 py-0.5 rounded-md leading-none hover:text-danger hover:bg-danger-dim';

export const typeBadgeVariants = {
  pain008: `${statusPill} text-purple bg-purple-dim border border-purple-border`,
  pain001: `${statusPill} text-green bg-green-dim border border-green-border`,
  unknown: `${statusPill} text-danger bg-danger-dim border border-[rgba(192,57,43,0.2)]`,
} as const;

export const seqBadgeBase = "font-ui font-bold text-[0.66rem] tracking-[0.03em] px-2 py-0.5 rounded-full whitespace-nowrap";
export const seqBadgeVariants = {
  FRST: 'text-info bg-[rgba(37,99,235,0.07)] border border-[rgba(37,99,235,0.2)]',
  RCUR: 'text-green bg-green-dim border border-green-border',
  OOFF: 'text-warning bg-warning-dim border border-warning-border',
  FNAL: 'text-danger bg-danger-dim border border-[rgba(192,57,43,0.2)]',
} as const;

export const pmtInfCard = 'bg-bg border border-border rounded-sm px-4 py-3.5 mt-3 first:mt-3.5';
export const pmtInfCardHead = 'flex items-center gap-2.5 flex-wrap mb-2';
export const pmtInfId = 'font-mono text-[0.78rem] text-text font-semibold';
export const pmtInfDetail = 'text-[0.78rem] text-text-muted font-mono';

export const vizToolbar = 'flex gap-2.5 flex-wrap items-center mb-3.5';
export const vizToolbarInput = 'w-auto min-w-[170px]';

export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
