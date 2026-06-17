import { useState, useEffect } from 'react'
import {
  Calendar,
  Upload,
  Download,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle,
  FileSpreadsheet,
  Info,
} from 'lucide-react'
import {
  getBranches,
  getSchedule,
  checkScheduleGap,
  uploadSchedule,
} from '@/api'
import { useAuth } from '@/hooks/useAuth'
import type { Branch, Schedule, ScheduleTeller } from '@/api/mock'
import type { ScheduleGapResult } from '@/api'

const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

const shifts = [
  { id: 'morning', label: '早班', time: '08:00-12:00' },
  { id: 'afternoon', label: '午班', time: '12:00-17:00' },
  { id: 'full', label: '全班', time: '08:00-17:00' },
]

function getWeekStartDates(): string[] {
  const result: string[] = []
  const now = new Date()
  const day = now.getDay() || 7
  const monday = new Date(now)
  monday.setDate(now.getDate() - day + 1)
  
  for (let i = 0; i < 4; i++) {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i * 7)
    result.push(d.toISOString().split('T')[0])
  }
  return result
}

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  const end = new Date(d)
  end.setDate(d.getDate() + 6)
  const m1 = d.getMonth() + 1
  const d1 = d.getDate()
  const m2 = end.getMonth() + 1
  const d2 = end.getDate()
  return `${m1}月${d1}日 - ${m2}月${d2}日`
}

export default function SchedulePage() {
  const { user, isHeadquarters, isBranch } = useAuth()
  const [branches, setBranches] = useState<Branch[]>([])
  const [selectedBranch, setSelectedBranch] = useState('')
  const [weekDates, setWeekDates] = useState<string[]>([])
  const [selectedWeek, setSelectedWeek] = useState('')
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [gapResult, setGapResult] = useState<ScheduleGapResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    const dates = getWeekStartDates()
    setWeekDates(dates)
    setSelectedWeek(dates[0])
    loadBranches()
  }, [])

  useEffect(() => {
    if (selectedBranch && selectedWeek) {
      loadSchedule()
      loadGapCheck()
    }
  }, [selectedBranch, selectedWeek])

  const loadBranches = async () => {
    const data = await getBranches()
    setBranches(data.slice(0, 20))
    if (data.length > 0) {
      setSelectedBranch(data[0].id)
    }
  }

  const loadSchedule = async () => {
    setLoading(true)
    try {
      const data = await getSchedule(selectedBranch, selectedWeek)
      setSchedules(data)
    } finally {
      setLoading(false)
    }
  }

  const loadGapCheck = async () => {
    try {
      const data = await checkScheduleGap(selectedBranch, selectedWeek)
      setGapResult(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('请上传 Excel 文件')
      return
    }
    try {
      const result = await uploadSchedule(selectedBranch, file, selectedWeek)
      if (result.success) {
        alert('上传成功')
        loadSchedule()
        loadGapCheck()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const allTellers = new Map<string, ScheduleTeller>()
  schedules.forEach(s => {
    s.tellers.forEach(t => allTellers.set(t.tellerId, t))
  })
  const tellerList = Array.from(allTellers.values())

  const getTellerShift = (tellerId: string, dayIndex: number) => {
    const schedule = schedules[dayIndex]
    if (!schedule) return null
    const teller = schedule.tellers.find(t => t.tellerId === tellerId)
    return teller || null
  }

  const getShiftLabel = (shift: string) => {
    return shifts.find(s => s.id === shift)?.label || shift
  }

  const selectedBranchData = branches.find(b => b.id === selectedBranch)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">排班管理</h1>
          <p className="text-gray-500 mt-1">管理网点排班计划，智能校验人力与客流匹配度</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">选择周：</span>
            <select
              className="input-field text-sm py-1.5 w-52"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
            >
              {weekDates.map(d => (
                <option key={d} value={d}>{formatWeekLabel(d)}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-600">网点：</span>
            <select
              className="input-field text-sm py-1.5 w-56"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={!isHeadquarters && !isBranch}
            >
              {branches.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          <div className="flex-1" />

          <button className="btn-secondary flex items-center gap-1.5 text-sm">
            <Download className="w-4 h-4" />
            下载模板
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <div className="card">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">排班表</h3>
              <span className="text-sm text-gray-500">
                {selectedBranchData?.name || ''} - {formatWeekLabel(selectedWeek)}
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 font-medium text-gray-600 bg-gray-50 w-32 sticky left-0">柜员</th>
                    {weekDays.map((day, i) => (
                      <th key={i} className="text-center p-3 font-medium text-gray-600 bg-gray-50 min-w-[100px]">
                        <div>{day}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        加载中...
                      </td>
                    </tr>
                  ) : tellerList.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-12 text-center text-gray-400">
                        <FileSpreadsheet className="w-10 h-10 mx-auto mb-2 opacity-50" />
                        <p>暂无排班数据</p>
                        <p className="text-xs mt-1">请上传排班表开始管理</p>
                      </td>
                    </tr>
                  ) : (
                    tellerList.map((teller, idx) => (
                      <tr key={teller.tellerId} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}>
                        <td className="p-3 font-medium text-gray-700 sticky left-0 bg-inherit">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-semibold">
                              {teller.tellerName.charAt(0)}
                            </div>
                            <span>{teller.tellerName}</span>
                          </div>
                        </td>
                        {weekDays.map((_, dayIdx) => {
                          const t = getTellerShift(teller.tellerId, dayIdx)
                          if (!t) {
                            return (
                              <td key={dayIdx} className="p-3 text-center text-gray-300">
                                休
                              </td>
                            )
                          }
                          return (
                            <td key={dayIdx} className="p-3 text-center">
                              <div className="inline-flex flex-col items-center gap-0.5">
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                  t.shift === 'full' ? 'bg-primary-100 text-primary-700' :
                                  t.shift === 'morning' ? 'bg-blue-100 text-blue-700' :
                                  'bg-orange-100 text-orange-700'
                                }`}>
                                  {getShiftLabel(t.shift)}
                                </span>
                                <span className="text-xs text-gray-400">窗口{t.windowNumber}</span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-span-4 space-y-6">
          <div
            className={`card p-6 border-2 border-dashed transition-all ${
              isDragging ? 'border-primary-400 bg-primary-50' : 'border-gray-200'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="text-center">
              <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-primary-500' : 'text-gray-300'}`} />
              <p className="text-sm font-medium text-gray-700 mb-1">拖拽上传排班表</p>
              <p className="text-xs text-gray-400 mb-4">支持 .xlsx / .xls 格式</p>
              <label className="btn-primary cursor-pointer inline-flex items-center gap-1.5 text-sm">
                <Upload className="w-4 h-4" />
                选择文件
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  onChange={(e) => handleFileUpload(e.target.files)}
                />
              </label>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">人力校验结果</h3>
              {gapResult && (
                gapResult.needWarning ? (
                  <span className="status-badge bg-red-100 text-red-700 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    缺口预警
                  </span>
                ) : (
                  <span className="status-badge bg-green-100 text-green-700 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    配置合理
                  </span>
                )
              )}
            </div>

            {gapResult ? (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500">预计客流</span>
                    <span className="font-medium text-gray-800">{gapResult.predictedFlow}人/天</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500">可用窗口</span>
                    <span className="font-medium text-gray-800">{gapResult.availableWindows}个</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-500">需配窗口</span>
                    <span className="font-medium text-gray-800">{gapResult.requiredWindows}个</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">人力缺口</span>
                    <span className={`font-medium ${gapResult.needWarning ? 'text-red-600' : 'text-green-600'}`}>
                      {gapResult.gap > 0 ? `缺${gapResult.gap}个窗口 (${gapResult.gapPercentage.toFixed(1)}%)` : '无缺口'}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${gapResult.needWarning ? 'bg-red-500' : 'bg-green-500'}`}
                      style={{ width: `${Math.min(100, (gapResult.availableWindows / Math.max(1, gapResult.requiredWindows)) * 100)}%` }}
                    />
                  </div>
                </div>

                {gapResult.needWarning && (
                  <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-red-700">
                        <p className="font-medium mb-1">人力配置不足</p>
                        <p>当前排班窗口数低于需求20%以上，建议增派柜员或调整班次。</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Info className="w-3.5 h-3.5" />
                    <span>单窗口日均处理能力：{gapResult.perWindowCapacity}人</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-gray-400 text-sm">
                暂无数据
              </div>
            )}
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-gray-800 mb-4">排班统计</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">柜员总数</span>
                </div>
                <span className="font-semibold text-gray-800">{tellerList.length}人</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">总班次</span>
                </div>
                <span className="font-semibold text-gray-800">
                  {schedules.reduce((sum, s) => sum + s.tellers.length, 0)}班/周
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">平均窗口</span>
                </div>
                <span className="font-semibold text-gray-800">
                  {schedules.length > 0
                    ? Math.round(schedules.reduce((sum, s) => sum + s.tellers.length, 0) / 7)
                    : 0}个/天
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
