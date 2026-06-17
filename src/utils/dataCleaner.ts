export interface DataRecord {
  [key: string]: any
}

export const removeDuplicates = <T extends DataRecord>(data: T[], keyField: keyof T): T[] => {
  const seen = new Set()
  return data.filter(item => {
    const key = item[keyField]
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export const fillMissingValues = <T extends DataRecord>(
  data: T[],
  fields: { [K in keyof T]?: any }
): T[] => {
  return data.map(item => {
    const filled = { ...item }
    Object.keys(fields).forEach(key => {
      const k = key as keyof T
      if (filled[k] === null || filled[k] === undefined || filled[k] === '') {
        filled[k] = fields[k]
      }
    })
    return filled
  })
}

export const standardizeFormat = <T extends DataRecord>(data: T[]): T[] => {
  return data.map(item => {
    const standardized: DataRecord = {}
    Object.keys(item).forEach(key => {
      const value = item[key]
      if (typeof value === 'string') {
        standardized[key] = value.trim()
      } else if (typeof value === 'number') {
        standardized[key] = Number(value.toFixed(2))
      } else {
        standardized[key] = value
      }
    })
    return standardized as T
  })
}

export const detectOutliers = <T extends DataRecord>(
  data: T[],
  field: keyof T,
  threshold: number = 1.5
): T[] => {
  const values = data.map(item => Number(item[field])).filter(v => !isNaN(v))
  if (values.length === 0) return []

  const sorted = values.sort((a, b) => a - b)
  const q1 = sorted[Math.floor(sorted.length * 0.25)]
  const q3 = sorted[Math.floor(sorted.length * 0.75)]
  const iqr = q3 - q1
  const lowerBound = q1 - threshold * iqr
  const upperBound = q3 + threshold * iqr

  return data.filter(item => {
    const val = Number(item[field])
    return isNaN(val) || val < lowerBound || val > upperBound
  })
}

export const calculateDataQuality = <T extends DataRecord>(data: T[]): number => {
  if (data.length === 0) return 0

  let totalFields = 0
  let validFields = 0

  data.forEach(item => {
    Object.keys(item).forEach(key => {
      totalFields++
      const value = item[key]
      if (value !== null && value !== undefined && value !== '') {
        validFields++
      }
    })
  })

  return totalFields > 0 ? Number(((validFields / totalFields) * 100).toFixed(1)) : 0
}
