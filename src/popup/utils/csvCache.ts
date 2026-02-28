import type { CsvRow } from '../../types'

const STORAGE_KEY = 'payfirm_csv_cache'

export interface CsvCache {
  rows: CsvRow[]
  cachedAt: string
  fileName: string
}

export async function saveCsvCache(rows: CsvRow[], fileName: string): Promise<void> {
  const cache: CsvCache = { rows, cachedAt: new Date().toISOString(), fileName }
  await chrome.storage.local.set({ [STORAGE_KEY]: cache })
}

export async function loadCsvCache(): Promise<CsvCache | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY)
  return (result[STORAGE_KEY] as CsvCache) ?? null
}

export async function clearCsvCache(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY)
}
