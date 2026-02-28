import { describe, it, expect, beforeEach } from 'vitest'
import { saveRun, loadRuns, clearRuns } from '../runHistory'
import { clearMockStore } from '../../../test/setup'

function entry(label = '') {
  return { fromFilter: label, toFilter: '', results: [], unmatched: [] }
}

beforeEach(clearMockStore)

describe('runHistory', () => {
  it('returns an empty array when no history exists', async () => {
    expect(await loadRuns()).toEqual([])
  })

  it('saves a run and loads it back', async () => {
    await saveRun(entry('a'))
    const runs = await loadRuns()
    expect(runs).toHaveLength(1)
    expect(runs[0].fromFilter).toBe('a')
  })

  it('stores a runAt ISO timestamp', async () => {
    await saveRun(entry())
    const [run] = await loadRuns()
    expect(isNaN(new Date(run.runAt).getTime())).toBe(false)
  })

  it('prepends new runs so newest is first', async () => {
    await saveRun(entry('first'))
    await saveRun(entry('second'))
    const runs = await loadRuns()
    expect(runs[0].fromFilter).toBe('second')
    expect(runs[1].fromFilter).toBe('first')
  })

  it('caps stored runs at 50', async () => {
    for (let i = 0; i < 55; i++) await saveRun(entry(String(i)))
    expect(await loadRuns()).toHaveLength(50)
  })

  it('retains the most recent runs when capped', async () => {
    for (let i = 0; i < 55; i++) await saveRun(entry(String(i)))
    const runs = await loadRuns()
    // Newest (54) should be first, oldest retained should be 5
    expect(runs[0].fromFilter).toBe('54')
    expect(runs[49].fromFilter).toBe('5')
  })

  it('clears all runs', async () => {
    await saveRun(entry())
    await clearRuns()
    expect(await loadRuns()).toHaveLength(0)
  })
})
