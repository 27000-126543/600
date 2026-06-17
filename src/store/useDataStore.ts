import { create } from 'zustand'

interface DataState {
  selectedCity: string | null
  selectedBranch: string | null
  dateRange: { start: string; end: string }
  loading: boolean
  error: string | null
  setSelectedCity: (cityId: string | null) => void
  setSelectedBranch: (branchId: string | null) => void
  setDateRange: (start: string, end: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

const useDataStore = create<DataState>()((set) => ({
  selectedCity: null,
  selectedBranch: null,
  dateRange: { start: '', end: '' },
  loading: false,
  error: null,
  setSelectedCity: (cityId) => set({ selectedCity: cityId }),
  setSelectedBranch: (branchId) => set({ selectedBranch: branchId }),
  setDateRange: (start, end) => set({ dateRange: { start, end } }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error })
}))

export default useDataStore
