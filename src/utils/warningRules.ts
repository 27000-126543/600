import dayjs from 'dayjs'

export interface BranchQueueData {
  branchId: string
  branchName: string
  date: string
  avgWaitTime: number
  [key: string]: any
}

export interface BranchReview {
  branchId: string
  date: string
  rating: number
  [key: string]: any
}

export interface WarningResult {
  type: string
  level: 'warning' | 'error'
  message: string
  data?: any
}

export interface BranchData {
  branchId: string
  branchName: string
  queueData: BranchQueueData[]
  reviews: BranchReview[]
  [key: string]: any
}

export const checkWaitTimeWarning = (
  branchQueueData: BranchQueueData[],
  standard: number = 15
): WarningResult | null => {
  if (branchQueueData.length < 3) return null

  const sortedData = [...branchQueueData].sort((a, b) =>
    dayjs(a.date).valueOf() - dayjs(b.date).valueOf()
  )

  const recentData = sortedData.slice(-3)
  const exceedThreshold = standard * 1.3

  const allExceed = recentData.every(item => item.avgWaitTime > exceedThreshold)

  if (allExceed) {
    return {
      type: 'wait_time',
      level: 'error',
      message: `连续3天平均等候时长超过标准${standard}分钟的30%（${exceedThreshold.toFixed(0)}分钟）`,
      data: {
        standard,
        threshold: exceedThreshold,
        recentDays: recentData.map(d => ({ date: d.date, avgWaitTime: d.avgWaitTime }))
      }
    }
  }

  const anyExceed = recentData.some(item => item.avgWaitTime > exceedThreshold)
  if (anyExceed) {
    return {
      type: 'wait_time',
      level: 'warning',
      message: `平均等候时长超过标准${standard}分钟的30%（${exceedThreshold.toFixed(0)}分钟）`,
      data: {
        standard,
        threshold: exceedThreshold,
        recentDays: recentData.map(d => ({ date: d.date, avgWaitTime: d.avgWaitTime }))
      }
    }
  }

  return null
}

export const checkSatisfactionWarning = (
  branchReviews: BranchReview[],
  threshold: number = 80
): WarningResult | null => {
  if (branchReviews.length === 0) return null

  const recentReviews = branchReviews.slice(-10)
  const avgRating = recentReviews.reduce((sum, r) => sum + r.rating, 0) / recentReviews.length
  const satisfaction = avgRating * 20

  if (satisfaction < threshold) {
    return {
      type: 'satisfaction',
      level: satisfaction < threshold - 10 ? 'error' : 'warning',
      message: `满意度${satisfaction.toFixed(1)}%低于阈值${threshold}%`,
      data: {
        threshold,
        satisfaction,
        reviewCount: recentReviews.length
      }
    }
  }

  return null
}

export const checkAllWarnings = (branchData: BranchData): WarningResult[] => {
  const warnings: WarningResult[] = []

  const waitTimeWarning = checkWaitTimeWarning(branchData.queueData)
  if (waitTimeWarning) warnings.push(waitTimeWarning)

  const satisfactionWarning = checkSatisfactionWarning(branchData.reviews)
  if (satisfactionWarning) warnings.push(satisfactionWarning)

  return warnings
}
