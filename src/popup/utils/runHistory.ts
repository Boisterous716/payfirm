import type { MatchedResult } from '../../types'

const STORAGE_KEY = 'payfirm_run_history'
const MAX_RUNS = 50

export interface RunEntry {
  runAt: string          // ISO timestamp
  fromFilter: string     // datetime-local value used
  toFilter: string
  results: MatchedResult[]
  unmatched: string[]
}

export async function saveRun(entry: Omit<RunEntry, 'runAt'>): Promise<void> {
  const existing = await loadRuns()
  const updated: RunEntry[] = [
    { ...entry, runAt: new Date().toISOString() },
    ...existing,
  ].slice(0, MAX_RUNS)
  await chrome.storage.local.set({ [STORAGE_KEY]: updated })
}

export async function loadRuns(): Promise<RunEntry[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return (result[STORAGE_KEY] as RunEntry[]) ?? []
}

export async function clearRuns(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY)
}
