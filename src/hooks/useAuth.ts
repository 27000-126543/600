import useAuthStore from '@/store/useAuthStore'

const roleLabelMap: Record<string, string> = {
  headquarters: '总行',
  branch: '分行',
  subbranch: '支行'
}

export function useAuth() {
  const store = useAuthStore()
  return {
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    isHeadquarters: store.user?.role === 'headquarters',
    isBranch: store.user?.role === 'branch',
    isSubbranch: store.user?.role === 'subbranch',
    roleLabel: store.user ? roleLabelMap[store.user.role] || '' : '',
    login: store.login,
    logout: store.logout,
    hasPermission: store.hasPermission
  }
}
