import Papa from 'papaparse'
import type { CsvRow } from '../../types'

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim().replace(/\s+/g, '_')
}

export function parseCsv(text: string): CsvRow[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  })

  if (result.errors.length > 0) {
    const fatal = result.errors.find((e) => e.type === 'Delimiter' || e.code === 'UndetectableDelimiter')
    if (fatal) throw new Error(`CSV parse error: ${fatal.message}`)
  }

  const rows: CsvRow[] = []
  for (const raw of result.data) {
    const reddit_username = (raw['reddit_username'] ?? raw['username'] ?? '').trim()
    const full_name = (raw['full_name'] ?? raw['name'] ?? '').trim()

    if (reddit_username && full_name) {
      rows.push({ reddit_username, full_name })
    }
  }

  if (rows.length === 0) {
    throw new Error('CSV must have "reddit_username" (or "username") and "full_name" (or "name") columns with data.')
  }

  return rows
}
