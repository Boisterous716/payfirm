import { useState, useEffect } from 'react'
import './App.css'
import { CsvUploader } from './components/CsvUploader'
import { ResultsTable } from './components/ResultsTable'
import { UnmatchedList } from './components/UnmatchedList'
import { HistoryView } from './components/HistoryView'
import { loadCsvCache, clearCsvCache } from './utils/csvCache'
import { matchAndAggregate } from './utils/matchAndAggregate'
import { exportResultsCsv } from './utils/exportResultsCsv'
import { saveRun, loadRuns, clearRuns, type RunEntry } from './utils/runHistory'
import { scrapeTab } from './utils/scrapeTab'
import type { CsvRow, MatchedResult } from '../types'

type AppState = 'idle' | 'csv_loaded' | 'scraping' | 'results' | 'error'
type Tab = 'main' | 'history'

interface ResultData {
  results: MatchedResult[]
  unmatched: string[]
}

function toLocalDatetimeValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function defaultFrom(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  d.setHours(0, 0, 0, 0)
  return toLocalDatetimeValue(d)
}

function defaultTo(): string {
  const d = new Date()
  d.setHours(23, 59, 0, 0)
  return toLocalDatetimeValue(d)
}

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>('main')
  const [state, setState] = useState<AppState>('idle')
  const [csvRows, setCsvRows] = useState<CsvRow[]>([])
  const [csvFileName, setCsvFileName] = useState('')
  const [csvCachedAt, setCsvCachedAt] = useState('')
  const [autoScroll, setAutoScroll] = useState(false)
  const [fromDate, setFromDate] = useState(defaultFrom)
  const [toDate, setToDate] = useState(defaultTo)
  const [resultData, setResultData] = useState<ResultData | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [runs, setRuns] = useState<RunEntry[]>([])

  useEffect(() => {
    loadCsvCache().then((cache) => {
      if (cache) {
        setCsvRows(cache.rows)
        setCsvFileName(cache.fileName)
        setCsvCachedAt(cache.cachedAt)
        setState('csv_loaded')
      }
    })
    loadRuns().then(setRuns)
  }, [])

  function handleCsvLoad(rows: CsvRow[], fileName: string) {
    setCsvRows(rows)
    setCsvFileName(fileName)
    setCsvCachedAt(new Date().toISOString())
    setState('csv_loaded')
  }

  function handleCsvError(msg: string) {
    setErrorMsg(msg)
    setState('error')
  }

  async function handleClearCsv() {
    await clearCsvCache()
    setCsvRows([])
    setCsvFileName('')
    setCsvCachedAt('')
    setState('idle')
  }

  async function handleClearRuns() {
    await clearRuns()
    setRuns([])
  }

  async function handleScrape() {
    setState('scraping')
    setErrorMsg('')

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (!tab?.id) throw new Error('No active tab found.')
      if (!tab.url?.startsWith('https://mail.google.com/mail')) {
        throw new Error('Please navigate to https://mail.google.com/mail and try again.')
      }

      const fromISO = fromDate ? new Date(fromDate).toISOString() : ''
      const toISO = toDate ? new Date(toDate).toISOString() : ''

      const payments = await scrapeTab(tab.id, autoScroll, fromISO, toISO)
      const { results, unmatched } = matchAndAggregate(payments, csvRows)

      await saveRun({ fromFilter: fromDate, toFilter: toDate, results, unmatched })
      setRuns(await loadRuns())

      setResultData({ results, unmatched })
      setState('results')
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unknown error occurred.')
      setState('error')
    }
  }

  function handleStartOver() {
    setResultData(null)
    setErrorMsg('')
    setState(csvRows.length > 0 ? 'csv_loaded' : 'idle')
  }

  function formatDate(iso: string): string {
    try { return new Date(iso).toLocaleString() } catch { return iso }
  }

  const canScrape = state === 'csv_loaded' && csvRows.length > 0

  return (
    <div>
      <div className="app-header">
        <h1>Payfirm</h1>
        <div className="tab-bar">
          <button className={`tab-btn ${activeTab === 'main' ? 'active' : ''}`} onClick={() => setActiveTab('main')}>
            Match
          </button>
          <button className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>
            History {runs.length > 0 && <span className="tab-badge">{runs.length}</span>}
          </button>
        </div>
      </div>

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (
        <HistoryView runs={runs} onClear={handleClearRuns} />
      )}

      {/* ── MAIN TAB ── */}
      {activeTab === 'main' && (
        <>
          {/* CSV status / uploader */}
          {state !== 'results' && (
            <div className="section">
              {csvRows.length > 0 ? (
                <div className="csv-status">
                  <strong>{csvFileName}</strong>
                  <span className="meta">{csvRows.length} entries · cached {formatDate(csvCachedAt)}</span>
                  <div style={{ marginTop: 8 }}>
                    <CsvUploader onLoad={handleCsvLoad} onError={handleCsvError} />
                  </div>
                  <button className="btn-danger" style={{ marginTop: 8, fontSize: 12, padding: '4px 10px' }} onClick={handleClearCsv}>
                    Clear CSV
                  </button>
                </div>
              ) : (
                <CsvUploader onLoad={handleCsvLoad} onError={handleCsvError} />
              )}
            </div>
          )}

          {/* Date/time filter */}
          {(canScrape || state === 'scraping') && (
            <div className="date-filter section">
              <div className="date-filter-row">
                <label>
                  From
                  <input type="datetime-local" value={fromDate} onChange={(e) => setFromDate(e.target.value)} disabled={state === 'scraping'} />
                </label>
                <label>
                  To
                  <input type="datetime-local" value={toDate} onChange={(e) => setToDate(e.target.value)} disabled={state === 'scraping'} />
                </label>
              </div>
            </div>
          )}

          {/* Auto-scroll */}
          {(canScrape || state === 'scraping') && (
            <label className="scroll-option">
              <input type="checkbox" checked={autoScroll} onChange={(e) => setAutoScroll(e.target.checked)} disabled={state === 'scraping'} />
              Auto-scroll to load all emails (slower)
            </label>
          )}

          {/* Match button */}
          {canScrape && (
            <div className="actions">
              <button className="btn-primary" onClick={handleScrape}>Match Payments</button>
            </div>
          )}

          {state === 'scraping' && <p className="status-msg">Scanning Gmail for PayPal payments…</p>}

          {/* Error */}
          {state === 'error' && (
            <div>
              <div className="error-box">{errorMsg}</div>
              <button className="btn-secondary" onClick={handleStartOver}>Start Over</button>
            </div>
          )}

          {/* Results */}
          {state === 'results' && resultData && (
            <div>
              <p className="summary">
                Matched {resultData.results.length} people · {resultData.unmatched.length} unmatched
              </p>
              <div className="actions">
                <button className="btn-success" onClick={() => exportResultsCsv(resultData.results)} disabled={resultData.results.length === 0}>
                  Export CSV
                </button>
                <button className="btn-secondary" onClick={handleStartOver}>Start Over</button>
              </div>
              <ResultsTable results={resultData.results} />
              <UnmatchedList names={resultData.unmatched} />
            </div>
          )}
        </>
      )}
    </div>
  )
}
