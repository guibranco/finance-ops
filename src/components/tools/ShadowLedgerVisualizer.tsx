import { useMemo, useState } from "react";
import { AlertTriangle, Check, Download } from "lucide-react";
import {
  alert,
  alertVariants,
  amtNeg,
  amtPos,
  btn,
  btnGhost,
  btnPrimary,
  btnRow,
  btnSecondary,
  card,
  cardTitle,
  cardTitleDot,
  cardTitleDotGreen,
  codeArea,
  codeAreaTall,
  codeAreaWrap,
  cx,
  entryGlEntryVariants,
  formInput,
  formSelect,
  statTile,
  statTileLabel,
  statTileRow,
  statTileValue,
  vizRowHover,
  vizSortArrow,
  vizTable,
  vizTableWrap,
  vizTd,
  vizTdNum,
  vizTh,
  vizThNum,
  vizTheadRow,
  vizToolbar,
  vizToolbarInput,
} from "../../ui";

interface ShadowLedgerEntry {
  id?: number | string;
  policyNumber?: string;
  amount?: number;
  glEntry?: string;
  operation?: string;
  [key: string]: unknown;
}

interface EntriesPayload {
  entries: ShadowLedgerEntry[];
  isTruncated: boolean;
}

interface PostingBalance {
  posting: string;
  debit: number;
  credit: number;
  diff: number;
  balanced: boolean;
}

interface Stats {
  count: number;
  net: number;
  debit: number;
  credit: number;
  policies: number;
  batches: number;
}

// Built-in sample: a Refund and its RefundWriteOff for one policy. Each row holds only
// the fields that vary; everything else is shared by every entry.
type SampleRow = [
  id: number,
  amount: number,
  categoryCode: string,
  amountComponent: string,
  glChartCode: string,
  glEntry: string,
  operation: string,
  createdTime: string,
];

// prettier-ignore
const SAMPLE_ROWS: SampleRow[] = [
  [1269403, -6.93, "", "Premium", "133206", "Credit", "Refund", "22:03:30.3961529"],
  [1269404, -5.82, "", "PremiumNet", "410101", "Debit", "Refund", "22:03:30.3961629"],
  [1269405, -0.18, "LVY", "TaxOrLevy", "310916", "Debit", "Refund", "22:03:30.3961689"],
  [1269406, -0.93, "ICF", "TaxOrLevy", "310916", "Debit", "Refund", "22:03:30.39617"],
  [1270538, 6.93, "", "Premium", "133206", "Debit", "RefundWriteOff", "22:04:54.8347902"],
  [1270539, 5.82, "", "PremiumNet", "410101", "Credit", "RefundWriteOff", "22:04:54.8347989"],
  [1270540, 0.18, "LVY", "TaxOrLevy", "310916", "Credit", "RefundWriteOff", "22:04:54.8348053"],
  [1270541, 0.93, "ICF", "TaxOrLevy", "310916", "Credit", "RefundWriteOff", "22:04:54.8348065"],
];

const SAMPLE_PAYLOAD: EntriesPayload = {
  entries: SAMPLE_ROWS.map(
    ([
      id,
      amount,
      categoryCode,
      amountComponent,
      glChartCode,
      glEntry,
      operation,
      createdTime,
    ]) => ({
      id,
      policyNumber: "OUT00275391",
      riskId: 1,
      riskCode: "VEH",
      valueDate: "2026-06-16T00:00:00",
      transactionDate: "2026-06-16T00:00:00",
      amount,
      categoryCode,
      amountComponent,
      glChartCode,
      dimension: `${glChartCode}-STI_000_F-VEH-CCU------STI-000-F-MOT-PER-PES-CAL-DIR---`,
      glEntry,
      operation,
      createdDate: `2026-06-16T${createdTime}+00:00`,
      batchId: "BATCH-DEBTORS-021FD-20260617-010023-2101",
      transactionReference: "OUT00275391-1-3-VEH-3",
      paymentMethod: "Card",
      providerFilename: null,
      salesSource: "CCU",
      costCentreL1: "STI",
      costCentreL2: "000",
      costCentreL3: "F",
      product: "MOT",
      productGroup: "PER",
      reportingSegment: "PES",
      salesChannel: "CAL",
      distributionChannel: "DIR",
      companyCode: "2101",
      collectionItemId: "Collection-1-3",
      riskMajorVersion: 3,
      paymentScheduleId: "948dfaab-e5b5-4b7c-8c52-e0a035cf14e6",
      paymentScheduleItemId: "8baaad39-7d3b-42b0-9478-7aec6fa0ead2",
    }),
  ),
  isTruncated: false,
};

const DEFAULT_KEYS = [
  "id",
  "policyNumber",
  "transactionReference",
  "riskCode",
  "amountComponent",
  "categoryCode",
  "glEntry",
  "amount",
  "operation",
  "valueDate",
  "glChartCode",
  "dimension",
  "batchId",
  "collectionItemId",
];

const LABEL_OVERRIDES: Record<string, string> = {
  id: "ID",
  policyNumber: "Policy Number",
  riskId: "Risk ID",
  riskCode: "Risk Code",
  valueDate: "Value Date",
  transactionDate: "Transaction Date",
  amount: "Amount",
  categoryCode: "Category",
  amountComponent: "Component",
  glChartCode: "GL Chart Code",
  dimension: "Dimension",
  glEntry: "GL Entry",
  operation: "Operation",
  createdDate: "Created Date",
  batchId: "Batch ID",
  transactionReference: "Transaction Ref",
  paymentMethod: "Payment Method",
  providerFilename: "Provider Filename",
  salesSource: "Sales Source",
  costCentreL1: "Cost Centre L1",
  costCentreL2: "Cost Centre L2",
  costCentreL3: "Cost Centre L3",
  product: "Product",
  productGroup: "Product Group",
  reportingSegment: "Reporting Segment",
  salesChannel: "Sales Channel",
  distributionChannel: "Distribution Channel",
  companyCode: "Company Code",
  collectionItemId: "Collection Item ID",
  riskMajorVersion: "Risk Version",
  paymentScheduleId: "Payment Schedule ID",
  paymentScheduleItemId: "Schedule Item ID",
};

/** Turns a camelCase key into a Title Case label. */
function humanize(key: string): string {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/^./, (c) => c.toUpperCase());
}

/** Column header for an entry key, preferring the explicit overrides. */
function labelFor(key: string): string {
  return LABEL_OVERRIDES[key] || humanize(key);
}

/** Rounds to 2 decimal places (currency precision). */
function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

// Accepts either { entries: [...], isTruncated } or a bare array of entries.
function parseEntriesPayload(text: string): EntriesPayload {
  const data = JSON.parse(text) as unknown;
  let entries: ShadowLedgerEntry[];
  let isTruncated = false;
  if (Array.isArray(data)) {
    entries = data as ShadowLedgerEntry[];
  } else if (data && Array.isArray((data as { entries?: unknown }).entries)) {
    const obj = data as { entries: ShadowLedgerEntry[]; isTruncated?: boolean };
    entries = obj.entries;
    isTruncated = Boolean(obj.isTruncated);
  } else {
    throw new Error(
      'Expected a JSON object with an "entries" array, or a bare array of entries.',
    );
  }
  if (entries.length === 0)
    throw new Error("No entries found in the provided JSON.");
  return { entries, isTruncated };
}

/** Every key present across the entries, in first-seen order. */
function collectColumns(entries: ShadowLedgerEntry[]): string[] {
  const seen = new Set<string>();
  const cols: string[] = [];
  entries.forEach((e) => {
    Object.keys(e).forEach((k) => {
      if (!seen.has(k)) {
        seen.add(k);
        cols.push(k);
      }
    });
  });
  return cols;
}

/** Stringifies any value without producing "[object Object]". */
function toSafeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return JSON.stringify(value);
}

/** Display text for a table cell: fixed-2 amounts, trimmed dates, "—" for empty. */
function formatValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (key === "amount") {
    const n = Number(value);
    return Number.isNaN(n) ? toSafeString(value) : n.toFixed(2);
  }
  if (typeof value === "boolean") return value ? "true" : "false";
  if (Array.isArray(value)) return value.join(", ");
  if (
    typeof value === "string" &&
    key.endsWith("Date") &&
    value.includes("T")
  ) {
    return key === "createdDate"
      ? value.replace(/\.\d+/, "").replace(/[+-]\d{2}:\d{2}$/, "")
      : value.split("T")[0];
  }
  return toSafeString(value);
}

/** Sort comparator: empty values first, numbers numerically, everything else as text. */
function compareValues(a: unknown, b: unknown): number {
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return toSafeString(a).localeCompare(toSafeString(b));
}

/** Summary totals and distinct policy/batch counts for the summary tiles. */
function buildStats(entries: ShadowLedgerEntry[]): Stats {
  const policies = new Set<string>();
  const batches = new Set<string>();
  let net = 0,
    debit = 0,
    credit = 0;
  entries.forEach((e) => {
    if (e.policyNumber) policies.add(toSafeString(e.policyNumber));
    if (e.batchId) batches.add(toSafeString(e.batchId));
    const amt = Number(e.amount) || 0;
    net += amt;
    const dir = (e.glEntry || "").toString().toLowerCase();
    if (dir === "debit") debit += Math.abs(amt);
    else if (dir === "credit") credit += Math.abs(amt);
  });
  return {
    count: entries.length,
    net: round2(net),
    debit: round2(debit),
    credit: round2(credit),
    policies: policies.size,
    batches: batches.size,
  };
}

// Double-entry balance is checked per posting (transaction reference + operation), not per
// dimension: the dimension string is prefixed by the GL chart code, so each GL account is
// naturally one-sided (e.g. a Collection debits 133206 and credits 410101/310916/310917).
function buildPostingBalance(entries: ShadowLedgerEntry[]): PostingBalance[] {
  const byPosting = new Map<string, { debit: number; credit: number }>();
  entries.forEach((e) => {
    const dir = (e.glEntry || "").toString().toLowerCase();
    if (dir !== "debit" && dir !== "credit") return;
    const posting = `${toSafeString(e.transactionReference) || "(no reference)"} · ${e.operation || "(no operation)"}`;
    const totals = byPosting.get(posting) ?? { debit: 0, credit: 0 };
    totals[dir] += Math.abs(Number(e.amount) || 0);
    byPosting.set(posting, totals);
  });
  return [...byPosting.entries()]
    .map(([posting, v]) => {
      const debit = round2(v.debit),
        credit = round2(v.credit);
      return {
        posting,
        debit,
        credit,
        diff: round2(debit - credit),
        balanced: Math.abs(debit - credit) <= 0.01,
      };
    })
    .sort((a, b) => a.posting.localeCompare(b.posting));
}

/** Triggers a browser download of `text` as a CSV file. */
function downloadCsv(filename: string, text: string) {
  const blob = new Blob([text], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** A single labelled figure in the summary row. */
function StatTile({
  label,
  value,
}: Readonly<{ label: string; value: string }>) {
  return (
    <div className={statTile}>
      <div className={statTileLabel}>{label}</div>
      <div className={statTileValue}>{value}</div>
    </div>
  );
}

/** Success alert when every posting balances, otherwise the list of unbalanced postings. */
function BalanceAlert({
  unbalanced,
}: Readonly<{ unbalanced: PostingBalance[] }>) {
  if (unbalanced.length === 0) {
    return (
      <div className={cx(alert, alertVariants.success)}>
        ✓ Debit and credit totals balance for every posting (transaction
        reference + operation).
      </div>
    );
  }
  return (
    <div data-testid="alert-error" className={cx(alert, alertVariants.error)}>
      <strong>
        {unbalanced.length} posting
        {unbalanced.length === 1 ? "" : "s"} out of balance:
      </strong>
      <ul className="mt-1 pl-[18px]">
        {unbalanced.map((p) => (
          <li className="my-0.5" key={p.posting}>
            {p.posting} — debit {p.debit} vs credit {p.credit} (Δ{p.diff})
          </li>
        ))}
      </ul>
    </div>
  );
}

/** One table cell, with GL-entry badges and signed amount colouring. */
function EntryCell({
  entry,
  field,
}: Readonly<{
  entry: ShadowLedgerEntry;
  field: string;
}>) {
  if (field === "glEntry") {
    const dir = (entry.glEntry || "").toString().toLowerCase();
    const isDirection = dir === "debit" || dir === "credit";
    return (
      <td className={vizTd}>
        {isDirection ? (
          <span className={entryGlEntryVariants[dir]}>
            {String(entry.glEntry)}
          </span>
        ) : (
          formatValue(field, entry[field])
        )}
      </td>
    );
  }
  if (field === "amount") {
    const amt = Number(entry.amount) || 0;
    return (
      <td className={cx(vizTdNum, amt < 0 ? amtNeg : amtPos)}>
        {formatValue(field, entry[field])}
      </td>
    );
  }
  return <td className={vizTd}>{formatValue(field, entry[field])}</td>;
}

/** Summary tiles plus the per-posting balance result. */
function SummaryCard({
  stats,
  unbalanced,
}: Readonly<{ stats: Stats; unbalanced: PostingBalance[] }>) {
  return (
    <div className={card}>
      <div className={cardTitle}>
        <span
          className={unbalanced.length === 0 ? cardTitleDotGreen : cardTitleDot}
        />{" "}
        Summary
      </div>
      <div className={statTileRow}>
        <StatTile label="Entries" value={stats.count.toLocaleString()} />
        <StatTile label="Net amount" value={stats.net.toLocaleString()} />
        <StatTile label="Total debit" value={stats.debit.toLocaleString()} />
        <StatTile label="Total credit" value={stats.credit.toLocaleString()} />
        <StatTile label="Policies" value={stats.policies.toLocaleString()} />
        <StatTile label="Batches" value={stats.batches.toLocaleString()} />
      </div>
      <BalanceAlert unbalanced={unbalanced} />
    </div>
  );
}

interface EntriesToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  glEntryFilter: string;
  onGlEntryFilterChange: (value: string) => void;
  operationFilter: string;
  onOperationFilterChange: (value: string) => void;
  operations: string[];
  showAllColumns: boolean;
  onShowAllColumnsChange: (value: boolean) => void;
}

/** Search box, GL-entry and operation filters, and the all-columns toggle. */
function EntriesToolbar({
  search,
  onSearchChange,
  glEntryFilter,
  onGlEntryFilterChange,
  operationFilter,
  onOperationFilterChange,
  operations,
  showAllColumns,
  onShowAllColumnsChange,
}: Readonly<EntriesToolbarProps>) {
  return (
    <div className={vizToolbar}>
      <input
        type="text"
        className={formInput}
        placeholder="Search entries..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
      <select
        className={cx(formSelect, vizToolbarInput)}
        value={glEntryFilter}
        onChange={(e) => onGlEntryFilterChange(e.target.value)}
      >
        <option value="all">All GL entries</option>
        <option value="debit">Debit</option>
        <option value="credit">Credit</option>
      </select>
      <select
        className={cx(formSelect, vizToolbarInput)}
        value={operationFilter}
        onChange={(e) => onOperationFilterChange(e.target.value)}
      >
        <option value="all">All operations</option>
        {operations.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-1.5 text-[0.8rem] text-text-muted cursor-pointer">
        <input
          type="checkbox"
          checked={showAllColumns}
          onChange={(e) => onShowAllColumnsChange(e.target.checked)}
        />
        <span>Show all columns</span>
      </label>
    </div>
  );
}

interface EntriesTableProps {
  entries: ShadowLedgerEntry[];
  columns: string[];
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
}

/** Sortable table of entries over the visible columns. */
function EntriesTable({
  entries,
  columns,
  sortKey,
  sortDir,
  onSort,
}: Readonly<EntriesTableProps>) {
  return (
    <div className={vizTableWrap}>
      <table className={vizTable}>
        <thead>
          <tr className={vizTheadRow}>
            {columns.map((key) => (
              <th
                key={key}
                className={key === "amount" ? vizThNum : vizTh}
                onClick={() => onSort(key)}
              >
                {labelFor(key)}
                {sortKey === key && (
                  <span className={vizSortArrow}>
                    {sortDir === "asc" ? "▲" : "▼"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((e, idx) => (
            <tr key={String(e.id ?? idx)} className={vizRowHover}>
              {columns.map((key) => (
                <EntryCell key={key} entry={e} field={key} />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Paste-and-inspect tool for Shadow Ledger entries, with a per-posting balance check. */
export default function ShadowLedgerVisualizer() {
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<EntriesPayload | null>(null);

  const [search, setSearch] = useState("");
  const [glEntryFilter, setGlEntryFilter] = useState("all");
  const [operationFilter, setOperationFilter] = useState("all");
  const [showAllColumns, setShowAllColumns] = useState(false);
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [downloaded, setDownloaded] = useState(false);

  const allColumns = useMemo(
    () => (result ? collectColumns(result.entries) : []),
    [result],
  );
  const visibleKeys = useMemo(
    () =>
      showAllColumns
        ? allColumns
        : DEFAULT_KEYS.filter((k) => allColumns.includes(k)),
    [showAllColumns, allColumns],
  );
  const operations = useMemo(
    () =>
      result
        ? [
            ...new Set(
              result.entries
                .map((e) => e.operation)
                .filter((op): op is string => Boolean(op)),
            ),
          ].sort((a, b) => a.localeCompare(b))
        : [],
    [result],
  );

  const filteredEntries = useMemo(() => {
    if (!result) return [];
    const term = search.trim().toLowerCase();
    return result.entries.filter((e) => {
      if (
        glEntryFilter !== "all" &&
        (e.glEntry || "").toString().toLowerCase() !== glEntryFilter
      )
        return false;
      if (operationFilter !== "all" && e.operation !== operationFilter)
        return false;
      return !term || JSON.stringify(e).toLowerCase().includes(term);
    });
  }, [result, search, glEntryFilter, operationFilter]);

  const sortedEntries = useMemo(() => {
    const rows = [...filteredEntries];
    rows.sort((a, b) => {
      const cmp = compareValues(a[sortKey], b[sortKey]);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return rows;
  }, [filteredEntries, sortKey, sortDir]);

  const stats = useMemo(
    () => (result ? buildStats(result.entries) : null),
    [result],
  );
  const postingBalance = useMemo(
    () => (result ? buildPostingBalance(result.entries) : []),
    [result],
  );
  const unbalancedPostings = postingBalance.filter((p) => !p.balanced);

  /** Parses the pasted JSON and resets filters and sorting for the new result. */
  function handleVisualize() {
    setError("");
    setResult(null);
    if (!input.trim()) {
      setError("Please enter Shadow Ledger entries JSON.");
      return;
    }
    try {
      const parsed = parseEntriesPayload(input);
      setResult(parsed);
      setSearch("");
      setGlEntryFilter("all");
      setOperationFilter("all");
      setSortKey("id");
      setSortDir("asc");
    } catch (e) {
      setError((e as Error).message);
    }
  }

  /** Sorts by `key`, toggling direction when it is already the sort key. */
  function handleSort(key: string) {
    if (key === sortKey) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  /** Exports the filtered, sorted entries over the visible columns as CSV. */
  function handleDownload() {
    if (!sortedEntries.length) return;
    const header = visibleKeys.map((k) => `"${labelFor(k)}"`).join(",");
    const lines = sortedEntries.map((e) =>
      visibleKeys
        .map((k) => {
          const cell = toSafeString(e[k]);
          return `"${cell.replaceAll('"', '""')}"`;
        })
        .join(","),
    );
    downloadCsv("shadow-ledger-entries.csv", [header, ...lines].join("\n"));
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className={card}>
        <div className={cardTitle}>
          <span className={cardTitleDot} /> Shadow Ledger Entries JSON
        </div>
        <div className={codeAreaWrap}>
          <textarea
            className={cx(codeArea, codeAreaTall)}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setError("");
            }}
            placeholder="Paste a Shadow Ledger entries JSON payload here..."
          />
        </div>
        <div className={btnRow}>
          <button className={cx(btn, btnPrimary)} onClick={handleVisualize}>
            Visualize →
          </button>
          <button
            className={cx(btn, btnGhost)}
            onClick={() => {
              setInput(JSON.stringify(SAMPLE_PAYLOAD, null, 2));
              setError("");
              setResult(null);
            }}
          >
            Load sample
          </button>
          <button
            className={cx(btn, btnGhost)}
            onClick={() => {
              setInput("");
              setError("");
              setResult(null);
            }}
          >
            Clear
          </button>
        </div>
        {error && (
          <div
            data-testid="alert-error"
            className={cx(alert, alertVariants.error)}
          >
            {error}
          </div>
        )}
      </div>

      {result?.isTruncated && (
        <div
          className={cx(alert, alertVariants.warning, "flex items-center gap-2")}
        >
          <AlertTriangle size={14} /> This result set is truncated — not all
          matching entries were returned by the source query.
        </div>
      )}

      {stats && <SummaryCard stats={stats} unbalanced={unbalancedPostings} />}

      {result && (
          <div className={card}>
            <div className={cardTitle}>
              <span className={cardTitleDot} /> Entries (
              {sortedEntries.length.toLocaleString()} of{" "}
              {result.entries.length.toLocaleString()})
            </div>

            <EntriesToolbar
              search={search}
              onSearchChange={setSearch}
              glEntryFilter={glEntryFilter}
              onGlEntryFilterChange={setGlEntryFilter}
              operationFilter={operationFilter}
              onOperationFilterChange={setOperationFilter}
              operations={operations}
              showAllColumns={showAllColumns}
              onShowAllColumnsChange={setShowAllColumns}
            />

            <EntriesTable
              entries={sortedEntries}
              columns={visibleKeys}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />

            <div className={btnRow}>
              <button
                type="button"
                className={cx(btn, btnSecondary)}
                onClick={handleDownload}
              >
                {downloaded ? <Check size={14} /> : <Download size={14} />}
                {downloaded ? "Downloaded" : "Download visible columns as CSV"}
              </button>
            </div>
          </div>
      )}
    </div>
  );
}
