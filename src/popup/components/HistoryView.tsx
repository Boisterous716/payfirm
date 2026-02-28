import { useState } from 'react'
import type { RunEntry } from '../utils/runHistory'
import { ResultsTable } from './ResultsTable'
import { UnmatchedList } from './UnmatchedList'
import { exportResultsCsv } from '../utils/exportResultsCsv'

interface Props {
  runs: RunEntry[]
  onClear: () => void
}

function formatDatetime(iso: string): string {
  try { return new Date(iso).toLocaleString() } catch { return iso }
}

function formatFilter(from: string, to: string): string {
  const parts = []
  if (from) parts.push(`from ${new Date(from).toLocaleString()}`)
  if (to) parts.push(`to ${new Date(to).toLocaleString()}`)
  return parts.length ? parts.join(' ') : 'no filter'
}

export function HistoryView({ runs, onClear }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)

  if (runs.length === 0) {
    return <p className="empty">No past runs yet. Match payments to build history.</p>
  }

  return (
    <div>
      <div className="history-header">
        <span>{runs.length} past run{runs.length !== 1 ? 's' : ''}</span>
        <button className="btn-danger" style={{ fontSize: 11, padding: '3px 8px' }} onClick={onClear}>
          Clear History
        </button>
      </div>

      {runs.map((run, i) => {
        const total = run.results.reduce((s, r) => s + r.total_amount_usd, 0)
        const payments = run.results.reduce((s, r) => s + r.payment_count, 0)
        const isOpen = expanded === i

        return (
          <div key={run.runAt} className="run-entry">
            <button
              className="run-header"
              onClick={() => setExpanded(isOpen ? null : i)}
            >
              <span className="run-date">{formatDatetime(run.runAt)}</span>
              <span className="run-meta">
                {run.results.length} matched · ${(Math.round(total * 100) / 100).toFixed(2)} · {payments} payments
              </span>
              <span className="run-chevron">{isOpen ? '▲' : '▼'}</span>
            </button>

            {isOpen && (
              <div className="run-body">
                <p className="hint" style={{ marginBottom: 6 }}>
                  Filter: {formatFilter(run.fromFilter, run.toFilter)}
                </p>
                <div className="actions" style={{ marginBottom: 8 }}>
                  <button
                    className="btn-success"
                    style={{ fontSize: 12, padding: '5px 10px' }}
                    onClick={() => exportResultsCsv(run.results)}
                    disabled={run.results.length === 0}
                  >
                    Export CSV
                  </button>
                </div>
                <ResultsTable results={run.results} />
                <UnmatchedList names={run.unmatched} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
