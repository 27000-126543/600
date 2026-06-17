import { create } from 'zustand'

interface Warning {
  [key: string]: any
}

interface WarningFilters {
  status?: string
  level?: string
  type?: string
  search?: string
}

interface WarningState {
  warnings: Warning[]
  filters: WarningFilters
  setWarnings: (warnings: Warning[]) => void
  updateWarning: (id: string, updates: Partial<Warning>) => void
  setFilters: (filters: Partial<WarningFilters>) => void
  getFilteredWarnings: () => Warning[]
}

const useWarningStore = create<WarningState>()((set, get) => ({
  warnings: [],
  filters: {},
  setWarnings: (warnings) => set({ warnings }),
  updateWarning: (id, updates) =>
    set((state) => ({
      warnings: state.warnings.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      )
    })),
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters }
    })),
  getFilteredWarnings: () => {
    const { warnings, filters } = get()
    return warnings.filter((w) => {
      if (filters.status && w.status !== filters.status) return false
      if (filters.level && w.level !== filters.level) return false
      if (filters.type && w.type !== filters.type) return false
      return true
    })
  }
}))

export default useWarningStore
