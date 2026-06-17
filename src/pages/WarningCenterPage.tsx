import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Clock,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  XCircle,
  Search,
} from 'lucide-react'
import { getWarnings, approveWarning } from '@/api'
import useWarningStore from '@/store/useWarningStore'
import { useAuth } from '@/hooks/useAuth'
import ApprovalFlow from '@/components/business/ApprovalFlow'
import { formatDate } from '@/utils/format'
import type { Warning, WarningLevel, WarningStatus, WarningType } from '@/api/mock'

const levelColors: Record<WarningLevel, string> = {
  high: 'bg-red-500',
  medium: 'bg-orange-500',
  low: 'bg-yellow-500',
}

const levelLabels: Record<WarningLevel, string> = {
  high: '高',
  medium: '中',
  low: '低',
}

const statusLabels: Record<WarningStatus, string> = {
  pending: '待处理',
  approved: '已通过',
  rejected: '已驳回',
  completed: '已完成',
}

const statusColors: Record<WarningStatus, string> = {
  pending: 'bg-blue-100 text-blue-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  completed: 'bg-gray-100 text-gray-700',
}

const typeLabels: Record<WarningType, string> = {
  wait_time: '等候时长超标',
  satisfaction: '满意度过低',
}

export default function WarningCenterPage() {
  const navigate = useNavigate()
  const { user, isHeadquarters, isBranch, isSubbranch } = useAuth()
  const { warnings, filters, setWarnings, setFilters, getFilteredWarnings } = useWarningStore()
  const [loading, setLoading] = useState(true)
  const [selectedWarning, setSelectedWarning] = useState<Warning | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  useEffect(() => {
    loadWarnings()
  }, [])

  const loadWarnings = async () => {
    setLoading(true)
    try {
      const data = await getWarnings()
      setWarnings(data as any[])
    } finally {
      setLoading(false)
    }
  }

  const filteredWarnings = useMemo(() => {
    let result = warnings as Warning[]
    if (filters.status) {
      result = result.filter(w => w.status === filters.status)
    }
    if (filters.level) {
      result = result.filter(w => w.level === filters.level)
    }
    if (filters.type) {
      result = result.filter(w => w.type === filters.type)
    }
    if (filters.search) {
      result = result.filter(w => w.branchName.includes(filters.search))
    }
    return result
  }, [warnings, filters])

  const totalPages = Math.ceil(filteredWarnings.length / pageSize)
  const paginatedWarnings = filteredWarnings.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const pendingCount = warnings.filter(w => (w as Warning).status === 'pending').length
  const processedCount = warnings.filter(w => (w as Warning).status !== 'pending').length
  const todayCount = warnings.filter(w => {
    const today = new Date().toDateString()
    return new Date((w as Warning).triggeredAt).toDateString() === today
  }).length

  const canApprove = (warning: Warning): boolean => {
    if (warning.status !== 'pending') return false
    if (isHeadquarters) return warning.currentLevel === 3
    if (isBranch) return warning.currentLevel === 2
    if (isSubbranch) return warning.currentLevel === 1
    return false
  }

  const handleApprove = async (action: 'approve' | 'reject', comment: string) => {
    if (!selectedWarning) return
    try {
      const updated = await approveWarning(
        selectedWarning.id,
        selectedWarning.currentLevel,
        action,
        comment,
        user?.name || ''
      )
      if (updated) {
        const updatedList = (warnings as Warning[]).map(w =>
          w.id === updated.id ? updated : w
        )
        setWarnings(updatedList as any[])
        setSelectedWarning(updated)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const openDetail = (warning: Warning) => {
    setSelectedWarning(warning)
    setShowModal(true)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ [key]: value })
    setCurrentPage(1)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">预警中心</h1>
          <p className="text-gray-500 mt-1">实时监控网点运营异常，及时处理预警信息</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">待处理预警</p>
              <p className="text-2xl font-bold text-blue-600">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-green-50 flex items-center justify-center">
              <Check className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">已处理预警</p>
              <p className="text-2xl font-bold text-green-600">{processedCount}</p>
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">今日新增</p>
              <p className="text-2xl font-bold text-orange-600">{todayCount}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">筛选：</span>
          </div>
          <select
            className="input-field text-sm py-1.5 w-32"
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">全部状态</option>
            <option value="pending">待处理</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="completed">已完成</option>
          </select>
          <select
            className="input-field text-sm py-1.5 w-32"
            value={filters.level || ''}
            onChange={(e) => handleFilterChange('level', e.target.value)}
          >
            <option value="">全部级别</option>
            <option value="high">高级</option>
            <option value="medium">中级</option>
            <option value="low">低级</option>
          </select>
          <select
            className="input-field text-sm py-1.5 w-32"
            value={filters.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
          >
            <option value="">全部类型</option>
            <option value="wait_time">等候时长</option>
            <option value="satisfaction">满意度</option>
          </select>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索网点名称"
              className="input-field text-sm py-1.5 pl-9 w-48"
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded w-2/3" />
            </div>
          ))
        ) : paginatedWarnings.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>暂无预警记录</p>
          </div>
        ) : (
          paginatedWarnings.map((warning: Warning) => (
            <div
              key={warning.id}
              className="card p-5 cursor-pointer hover:shadow-md transition-all"
              onClick={() => openDetail(warning)}
            >
              <div className="flex items-start gap-4">
                <div className={`w-1.5 h-16 rounded-full ${levelColors[warning.level]} flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-gray-800 truncate">
                      {warning.branchName}
                    </h3>
                    <span className={`status-badge ${levelColors[warning.level]} text-white`}>
                      {levelLabels[warning.level]}级
                    </span>
                    <span className="status-badge bg-gray-100 text-gray-600">
                      {typeLabels[warning.type]}
                    </span>
                    <span className={`status-badge ${statusColors[warning.status]}`}>
                      {statusLabels[warning.status]}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-3">{warning.description}</p>
                  <div className="flex items-center gap-6 text-sm text-gray-400">
                    <span>触发时间：{formatDate(warning.triggeredAt as any)}</span>
                    {warning.status === 'rejected' ? (
                      <span>第{warning.currentLevel}级驳回</span>
                    ) : warning.status === 'approved' ? (
                      <span>三级审批已通过</span>
                    ) : (
                      <span>当前审批：第{warning.currentLevel}级</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
              </div>
            </div>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              className={`w-8 h-8 rounded-md text-sm ${
                currentPage === page
                  ? 'bg-primary-600 text-white'
                  : 'border border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          ))}
          <button
            className="p-2 rounded-md border border-gray-200 hover:bg-gray-50 disabled:opacity-50"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {showModal && selectedWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-bold text-gray-800">预警详情</h2>
              <button
                className="p-1 hover:bg-gray-100 rounded"
                onClick={() => setShowModal(false)}
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-3 h-3 rounded-full ${levelColors[selectedWarning.level]}`} />
                  <span className="font-semibold text-gray-800 text-lg">
                    {selectedWarning.branchName}
                  </span>
                </div>
                <div className="flex gap-3 text-sm text-gray-500 mb-4">
                  <span>{typeLabels[selectedWarning.type]}</span>
                  <span>·</span>
                  <span>{levelLabels[selectedWarning.level]}级预警</span>
                  <span>·</span>
                  <span>{formatDate(selectedWarning.triggeredAt as any)}</span>
                </div>
                <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                  {selectedWarning.description}
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-4">审批流程</h3>
                <ApprovalFlow
                  currentLevel={selectedWarning.currentLevel}
                  status={selectedWarning.status}
                  approvals={selectedWarning.approvals}
                  onApprove={(comment) => handleApprove('approve', comment)}
                  onReject={(comment) => handleApprove('reject', comment)}
                />
              </div>

              {canApprove(selectedWarning) && (
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button
                    className="btn-secondary"
                    onClick={() => navigate(`/branch/${selectedWarning.branchId}`)}
                  >
                    查看网点详情
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
