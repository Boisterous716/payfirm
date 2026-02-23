import { describe, it, expect, beforeEach } from 'vitest'
import { saveCsvCache, loadCsvCache, clearCsvCache } from '../csvCache'
import { clearMockStore } from '../../../test/setup'
import type { CsvRow } from '../../../types'

const ROWS: CsvRow[] = [
  { reddit_username: 'johndoe', full_name: 'John Doe' },
  { reddit_username: 'janedoe', full_name: 'Jane Doe' },
]

beforeEach(clearMockStore)

describe('csvCache', () => {
  it('returns null when no cache exists', async () => {
    expect(await loadCsvCache()).toBeNull()
  })

  it('saves and loads rows with file name', async () => {
    await saveCsvCache(ROWS, 'users.csv')
    const cache = await loadCsvCache()
    expect(cache?.rows).toEqual(ROWS)
    expect(cache?.fileName).toBe('users.csv')
  })

  it('stores a cachedAt ISO timestamp', async () => {
    await saveCsvCache(ROWS, 'users.csv')
    const cache = await loadCsvCache()
    expect(() => new Date(cache!.cachedAt)).not.toThrow()
    expect(isNaN(new Date(cache!.cachedAt).getTime())).toBe(false)
  })

  it('overwrites previous cache on re-save', async () => {
    await saveCsvCache(ROWS, 'old.csv')
    await saveCsvCache([], 'new.csv')
    const cache = await loadCsvCache()
    expect(cache?.fileName).toBe('new.csv')
    expect(cache?.rows).toHaveLength(0)
  })

  it('returns null after clearing', async () => {
    await saveCsvCache(ROWS, 'users.csv')
    await clearCsvCache()
    expect(await loadCsvCache()).toBeNull()
  })
})
