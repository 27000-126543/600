export type UserRole = 'staff' | 'supervisor' | 'manager' | 'director'

export type ApprovalLevel = 1 | 2 | 3 | 4

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'processing'

export interface ApprovalLevelInfo {
  level: ApprovalLevel
  name: string
  requiredRole: UserRole
  description: string
}

const approvalLevelHierarchy: UserRole[] = ['staff', 'supervisor', 'manager', 'director']

const approvalLevelMap: Record<ApprovalLevel, ApprovalLevelInfo> = {
  1: {
    level: 1,
    name: '一级审批',
    requiredRole: 'supervisor',
    description: '主管审批'
  },
  2: {
    level: 2,
    name: '二级审批',
    requiredRole: 'manager',
    description: '经理审批'
  },
  3: {
    level: 3,
    name: '三级审批',
    requiredRole: 'director',
    description: '总监审批'
  },
  4: {
    level: 4,
    name: '终极审批',
    requiredRole: 'director',
    description: '终极审批'
  }
}

const approvalStatusMap: Record<ApprovalStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回',
  processing: '审批中'
}

export const canApprove = (userRole: UserRole, currentLevel: ApprovalLevel): boolean => {
  const levelInfo = approvalLevelMap[currentLevel]
  if (!levelInfo) return false

  const userRoleIndex = approvalLevelHierarchy.indexOf(userRole)
  const requiredRoleIndex = approvalLevelHierarchy.indexOf(levelInfo.requiredRole)

  return userRoleIndex >= requiredRoleIndex
}

export const getNextLevel = (currentLevel: ApprovalLevel): ApprovalLevel | null => {
  const nextLevel = (currentLevel + 1) as ApprovalLevel
  return approvalLevelMap[nextLevel] ? nextLevel : null
}

export const getApprovalLevelInfo = (level: ApprovalLevel): ApprovalLevelInfo | null => {
  return approvalLevelMap[level] || null
}

export const getApprovalStatusText = (status: ApprovalStatus | string): string => {
  return approvalStatusMap[status as ApprovalStatus] || String(status)
}
