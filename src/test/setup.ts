// Shared in-memory store for chrome.storage.local mock.
// Individual test files import clearMockStore() and call it in beforeEach.
export const mockStore: Record<string, unknown> = {}

export function clearMockStore() {
  Object.keys(mockStore).forEach((k) => delete mockStore[k])
}

;(globalThis as Record<string, unknown>).chrome = {
  storage: {
    local: {
      get: async (key: string) => ({ [key]: mockStore[key] }),
      set: async (items: Record<string, unknown>) => {
        Object.assign(mockStore, items)
      },
      remove: async (key: string | string[]) => {
        const keys = typeof key === 'string' ? [key] : key
        keys.forEach((k) => delete mockStore[k])
      },
    },
  },
}
