import dayjs from 'dayjs'

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

export const formatDate = (timestamp: number | string | Date, format?: string): string => {
  const fmt = format || 'YYYY-MM-DD HH:mm:ss'
  return dayjs(timestamp).format(fmt)
}

export const formatNumber = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return '0'
  return num.toLocaleString('zh-CN')
}

export const formatPercent = (num: number): string => {
  if (num === null || num === undefined || isNaN(num)) return '0%'
  return `${(num * 100).toFixed(1)}%`
}

export const getStatusText = (status: string | number): string => {
  const statusMap: Record<string, string> = {
    '0': '待处理',
    '1': '处理中',
    '2': '已完成',
    '3': '已取消',
    'pending': '待处理',
    'processing': '处理中',
    'completed': '已完成',
    'cancelled': '已取消',
    'normal': '正常',
    'warning': '预警',
    'error': '异常'
  }
  return statusMap[String(status)] || String(status)
}
