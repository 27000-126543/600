export interface QueueData {
  id: string
  branchId: string
  waitTime: number
  timestamp: number
  [key: string]: any
}

export interface Transaction {
  id: string
  tellerId: string
  tellerName: string
  duration: number
  amount?: number
  timestamp: number
  [key: string]: any
}

export interface Review {
  id: string
  branchId: string
  rating: number
  comment?: string
  timestamp: number
  [key: string]: any
}

export interface TellerEfficiency {
  tellerId: string
  tellerName: string
  avgDuration: number
  transactionCount: number
  efficiencyScore: number
}

export interface BranchMetrics {
  avgWaitTime: number
  totalTransactions: number
  satisfaction: number
  tellerEfficiencies: TellerEfficiency[]
  overallEfficiency: number
}

export const calculateAvgWaitTime = (queueData: QueueData[]): number => {
  if (queueData.length === 0) return 0
  const total = queueData.reduce((sum, item) => sum + (item.waitTime || 0), 0)
  return Number((total / queueData.length).toFixed(2))
}

export const calculateTellerEfficiency = (transactions: Transaction[]): TellerEfficiency[] => {
  const tellerMap = new Map<string, { totalDuration: number; count: number; name: string }>()

  transactions.forEach(tx => {
    const existing = tellerMap.get(tx.tellerId) || { totalDuration: 0, count: 0, name: tx.tellerName }
    existing.totalDuration += tx.duration || 0
    existing.count += 1
    existing.name = tx.tellerName || existing.name
    tellerMap.set(tx.tellerId, existing)
  })

  const result: TellerEfficiency[] = []
  const allAvgDuration = Array.from(tellerMap.values()).map(v => v.totalDuration / v.count)
  const minAvgDuration = Math.min(...allAvgDuration) || 1

  tellerMap.forEach((data, tellerId) => {
    const avgDuration = data.count > 0 ? data.totalDuration / data.count : 0
    const efficiencyScore = data.count > 0
      ? Number(((minAvgDuration / avgDuration) * 100).toFixed(1))
      : 0
    result.push({
      tellerId,
      tellerName: data.name,
      avgDuration: Number(avgDuration.toFixed(2)),
      transactionCount: data.count,
      efficiencyScore
    })
  })

  return result
}

export const calculateSatisfaction = (reviews: Review[]): number => {
  if (reviews.length === 0) return 0
  const total = reviews.reduce((sum, review) => sum + (review.rating || 0), 0)
  const avg = total / reviews.length
  return Number((avg * 20).toFixed(1))
}

export const calculateBranchMetrics = (
  queueData: QueueData[],
  transactions: Transaction[],
  reviews: Review[]
): BranchMetrics => {
  const avgWaitTime = calculateAvgWaitTime(queueData)
  const totalTransactions = transactions.length
  const satisfaction = calculateSatisfaction(reviews)
  const tellerEfficiencies = calculateTellerEfficiency(transactions)

  const overallEfficiency = tellerEfficiencies.length > 0
    ? tellerEfficiencies.reduce((sum, t) => sum + t.efficiencyScore, 0) / tellerEfficiencies.length
    : 0

  return {
    avgWaitTime,
    totalTransactions,
    satisfaction,
    tellerEfficiencies,
    overallEfficiency: Number(overallEfficiency.toFixed(1))
  }
}
