import dayjs from 'dayjs'
import { calculateAvgWaitTime, calculateBranchMetrics, type QueueData, type Transaction, type Review, type BranchMetrics } from './metrics'
import type { WarningResult } from './warningRules'

export interface WaitTimeAnalysis {
  currentAvg: number
  previousAvg: number
  samePeriodAvg: number
  monthOverMonth: number
  yearOverYear: number
  trend: 'up' | 'down' | 'stable'
  [key: string]: any
}

export interface ComplaintDistribution {
  category: string
  count: number
  percentage: number
}

export interface DeviceFailureRate {
  deviceId: string
  deviceName: string
  totalCount: number
  failureCount: number
  failureRate: number
}

export interface ReportData {
  queueData?: QueueData[]
  historyData?: QueueData[]
  transactions?: Transaction[]
  reviews?: Review[]
  devicesData?: DeviceData[]
  metrics?: BranchMetrics
  warnings?: WarningResult[]
  [key: string]: any
}

export interface DeviceData {
  deviceId: string
  deviceName: string
  status: 'normal' | 'fault' | 'maintenance'
  timestamp: number
  [key: string]: any
}

export interface Report {
  id: string
  scope: string
  scopeId: string
  title: string
  generatedAt: string
  period: string
  waitTimeAnalysis: WaitTimeAnalysis | null
  complaintDistribution: ComplaintDistribution[]
  deviceFailureRate: DeviceFailureRate[]
  recommendations: string[]
  metrics: BranchMetrics | null
  warnings: WarningResult[]
  [key: string]: any
}

export const generateWaitTimeAnalysis = (
  queueData: QueueData[],
  historyData: QueueData[]
): WaitTimeAnalysis | null => {
  if (queueData.length === 0) return null

  const currentAvg = calculateAvgWaitTime(queueData)

  const sortedQueueData = [...queueData].sort((a, b) => a.timestamp - b.timestamp)
  const sortedHistoryData = [...(historyData || [])].sort((a, b) => a.timestamp - b.timestamp)

  const currentStart = sortedQueueData[0]?.timestamp || 0
  const currentEnd = sortedQueueData[sortedQueueData.length - 1]?.timestamp || 0
  const currentPeriod = currentEnd - currentStart

  const previousPeriodData = sortedHistoryData.filter(d =>
    d.timestamp < currentStart && d.timestamp >= currentStart - currentPeriod
  )
  const previousAvg = calculateAvgWaitTime(previousPeriodData)

  const samePeriodLastYear = sortedHistoryData.filter(d => {
    const lastYear = dayjs(d.timestamp).add(1, 'year')
    return lastYear.valueOf() >= currentStart && lastYear.valueOf() <= currentEnd
  })
  const samePeriodAvg = calculateAvgWaitTime(samePeriodLastYear)

  const monthOverMonth = previousAvg > 0
    ? Number(((currentAvg - previousAvg) / previousAvg).toFixed(4))
    : 0
  const yearOverYear = samePeriodAvg > 0
    ? Number(((currentAvg - samePeriodAvg) / samePeriodAvg).toFixed(4))
    : 0

  let trend: 'up' | 'down' | 'stable' = 'stable'
  if (Math.abs(monthOverMonth) > 0.05) {
    trend = monthOverMonth > 0 ? 'up' : 'down'
  }

  return {
    currentAvg,
    previousAvg,
    samePeriodAvg,
    monthOverMonth,
    yearOverYear,
    trend
  }
}

export const generateComplaintDistribution = (reviews: Review[]): ComplaintDistribution[] => {
  if (reviews.length === 0) return []

  const complaintKeywords: Record<string, string[]> = {
    '等候时间过长': ['慢', '等待', '等候', '排队', '久'],
    '服务态度差': ['态度', '不好', '差', '不耐烦', '凶'],
    '业务不熟练': ['不熟练', '不懂', '错误', '搞错', '慢'],
    '环境问题': ['环境', '脏', '乱', '差', '热', '冷'],
    '设备故障': ['设备', '坏了', '故障', '不能用', '卡']
  }

  const categoryCounts: Record<string, number> = {}
  let totalComplaints = 0

  reviews.forEach(review => {
    if (review.rating <= 2 && review.comment) {
      totalComplaints++
      let categorized = false
      Object.entries(complaintKeywords).forEach(([category, keywords]) => {
        if (keywords.some(kw => review.comment?.includes(kw))) {
          categoryCounts[category] = (categoryCounts[category] || 0) + 1
          categorized = true
        }
      })
      if (!categorized) {
        categoryCounts['其他'] = (categoryCounts['其他'] || 0) + 1
      }
    }
  })

  return Object.entries(categoryCounts)
    .map(([category, count]) => ({
      category,
      count,
      percentage: totalComplaints > 0 ? Number(((count / totalComplaints) * 100).toFixed(1)) : 0
    }))
    .sort((a, b) => b.count - a.count)
}

export const generateDeviceFailureRate = (devicesData: DeviceData[]): DeviceFailureRate[] => {
  if (devicesData.length === 0) return []

  const deviceMap = new Map<string, { name: string; total: number; failures: number }>()

  devicesData.forEach(device => {
    const existing = deviceMap.get(device.deviceId) || { name: device.deviceName, total: 0, failures: 0 }
    existing.total++
    if (device.status === 'fault') {
      existing.failures++
    }
    existing.name = device.deviceName || existing.name
    deviceMap.set(device.deviceId, existing)
  })

  const result: DeviceFailureRate[] = []
  deviceMap.forEach((data, deviceId) => {
    result.push({
      deviceId,
      deviceName: data.name,
      totalCount: data.total,
      failureCount: data.failures,
      failureRate: data.total > 0 ? Number(((data.failures / data.total) * 100).toFixed(2)) : 0
    })
  })

  return result.sort((a, b) => b.failureRate - a.failureRate)
}

export const generateRecommendations = (
  metrics: BranchMetrics | null | undefined,
  warnings: WarningResult[] | null | undefined
): string[] => {
  const recommendations: string[] = []

  if (warnings && warnings.length > 0) {
    warnings.forEach(warning => {
      if (warning.type === 'wait_time') {
        if (warning.level === 'error') {
          recommendations.push('紧急：建议立即增开服务窗口，优化叫号流程，降低客户等候时间')
        } else {
          recommendations.push('建议：动态调整窗口开放数量，加强客流高峰期人员配置')
        }
      }
      if (warning.type === 'satisfaction') {
        recommendations.push('建议：加强服务质量培训，开展服务礼仪专项提升活动')
      }
    })
  }

  if (metrics) {
    if (metrics.avgWaitTime > 15) {
      recommendations.push(`当前平均等候时长${metrics.avgWaitTime.toFixed(1)}分钟，建议优化业务办理流程`)
    }
    if (metrics.satisfaction < 85) {
      recommendations.push(`当前满意度${metrics.satisfaction.toFixed(1)}%，建议建立客户反馈快速响应机制`)
    }
    if (metrics.overallEfficiency < 80) {
      recommendations.push(`整体效率评分${metrics.overallEfficiency.toFixed(1)}，建议开展柜员技能培训`)
    }
    const lowEfficiencyTellers = metrics.tellerEfficiencies.filter(t => t.efficiencyScore < 70)
    if (lowEfficiencyTellers.length > 0) {
      recommendations.push(`建议对${lowEfficiencyTellers.length}名低效柜员进行针对性辅导`)
    }
  }

  if (recommendations.length === 0) {
    recommendations.push('各项指标运行良好，建议持续保持并优化现有服务流程')
  }

  return recommendations
}

export const generateReport = (
  scope: string,
  scopeId: string,
  data: ReportData
): Report => {
  const now = dayjs()
  const queueData = data.queueData || []
  const historyData = data.historyData || []
  const transactions = data.transactions || []
  const reviews = data.reviews || []
  const devicesData = data.devicesData || []
  const warnings = data.warnings || []

  const metrics = data.metrics || calculateBranchMetrics(queueData, transactions, reviews)
  const waitTimeAnalysis = generateWaitTimeAnalysis(queueData, historyData)
  const complaintDistribution = generateComplaintDistribution(reviews)
  const deviceFailureRate = generateDeviceFailureRate(devicesData)
  const recommendations = generateRecommendations(metrics, warnings)

  const period = queueData.length > 0
    ? `${dayjs(queueData[0].timestamp).format('YYYY-MM-DD')} 至 ${dayjs(queueData[queueData.length - 1].timestamp).format('YYYY-MM-DD')}`
    : now.format('YYYY-MM-DD')

  const title = `${scope}运营分析报告`

  return {
    id: `report_${now.valueOf()}`,
    scope,
    scopeId,
    title,
    generatedAt: now.format('YYYY-MM-DD HH:mm:ss'),
    period,
    waitTimeAnalysis,
    complaintDistribution,
    deviceFailureRate,
    recommendations,
    metrics,
    warnings
  }
}
