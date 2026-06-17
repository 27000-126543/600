import { create } from 'zustand'

type UserRole = 'headquarters' | 'branch' | 'subbranch'

interface User {
  id: string
  username: string
  name: string
  role: UserRole
  cityId?: string
  branchId?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  hasPermission: (permission: string) => boolean
}

const rolePermissions: Record<UserRole, string[]> = {
  headquarters: ['view_national', 'view_city', 'view_branch', 'approve_level3', 'manage_reports', 'view_monitor', 'manage_users'],
  branch: ['view_city', 'view_branch', 'approve_level2', 'view_reports', 'view_monitor', 'manage_schedule'],
  subbranch: ['view_branch', 'approve_level1', 'upload_schedule', 'view_reports']
}

const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  login: (user, token) => set({ user, token, isAuthenticated: true }),
  logout: () => set({ user: null, token: null, isAuthenticated: false }),
  hasPermission: (permission) => {
    const { user } = get()
    if (!user) return false
    return rolePermissions[user.role]?.includes(permission) ?? false
  }
}))

export default useAuthStore
