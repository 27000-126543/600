export interface ScheduleWindow {
  windowId: string
  windowNo: string
  isActive: boolean
  tellerId?: string
  startTime?: string
  endTime?: string
  [key: string]: any
}

export interface Schedule {
  date: string
  windows: ScheduleWindow[]
  [key: string]: any
}

export interface ManpowerGapResult {
  availableWindows: number
  requiredWindows: number
  gap: number
  gapPercentage: number
  needWarning: boolean
}

export const countActiveWindows = (schedule: Schedule): number => {
  if (!schedule.windows || schedule.windows.length === 0) return 0
  return schedule.windows.filter(w => w.isActive).length
}

export const calculateRequiredWindows = (
  predictedFlow: number,
  perWindow: number = 40
): number => {
  if (predictedFlow <= 0) return 0
  return Math.ceil(predictedFlow / perWindow)
}

export const calculateManpowerGap = (
  schedule: Schedule,
  predictedFlow: number
): ManpowerGapResult => {
  const availableWindows = countActiveWindows(schedule)
  const requiredWindows = calculateRequiredWindows(predictedFlow)
  const gap = requiredWindows - availableWindows
  const gapPercentage = requiredWindows > 0
    ? Number(((gap / requiredWindows) * 100).toFixed(1))
    : 0

  return {
    availableWindows,
    requiredWindows,
    gap,
    gapPercentage,
    needWarning: gapPercentage > 20
  }
}
