import {
  cities,
  branches,
  queueRecords,
  transactions,
  reviews,
  warnings,
  schedules,
  reports,
  getCityById,
  getBranchById,
  getBranchesByCityId,
  getQueueRecordsByBranchId,
  getQueueRecordsByCityId,
  getQueueRecordsByDateRange,
  getQueueStats,
  getTransactionsByBranchId,
  getTransactionsByCityId,
  getReviewsByBranchId,
  getReviewsByCityId,
  getWarnings as getMockWarnings,
  getWarningById,
  getWarningsByBranchId,
  getScheduleByBranchId,
  getScheduleByBranchAndWeek,
  updateScheduleByBranchAndWeek,
  getPredictedFlow,
  getReports as getMockReports,
  getReportById,
} from './mock';

import type {
  City,
  Branch,
  QueueRecord,
  Transaction,
  Review,
  Warning,
  WarningStatus,
  WarningLevel,
  WarningApproval,
  Schedule,
  ScheduleTeller,
  ShiftType,
  Report,
  ReportScope,
} from './mock';

function delay<T>(data: T, ms?: number): Promise<T> {
  const timeout = ms ?? 200 + Math.floor(Math.random() * 300);
  return new Promise(resolve => setTimeout(() => resolve(data), timeout));
}

interface User {
  id: string;
  username: string;
  name: string;
  role: 'head' | 'city' | 'branch';
  scopeId: string;
  scopeName: string;
}

const users: Record<string, User> = {
  admin: { id: 'u001', username: 'admin', name: '系统管理员', role: 'head', scopeId: 'national', scopeName: '全国' },
  branch: { id: 'u002', username: 'branch', name: '城市经理', role: 'city', scopeId: 'c001', scopeName: '北京' },
  sub: { id: 'u003', username: 'sub', name: '网点主管', role: 'branch', scopeId: 'b0001', scopeName: '北京中心支行' },
};

const passwords: Record<string, string> = {
  admin: '123456',
  branch: '123456',
  sub: '123456',
};

let currentUser: User | null = null;

export const login = (username: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> => {
  const user = users[username];
  if (!user) return delay({ success: false, message: '用户不存在' });
  if (passwords[username] !== password) return delay({ success: false, message: '密码错误' });
  currentUser = user;
  return delay({ success: true, user });
};

export const getCurrentUser = (): Promise<User | null> => {
  return delay(currentUser);
};

export const getBranches = (cityId?: string): Promise<Branch[]> => {
  if (cityId) return delay(getBranchesByCityId(cityId));
  return delay(branches);
};

export const getBranchDetail = (id: string): Promise<Branch | undefined> => {
  return delay(getBranchById(id));
};

export const getQueueData = (branchId?: string, cityId?: string, dateRange?: { start: string; end: string }): Promise<QueueRecord[]> => {
  let result = queueRecords;
  if (branchId) result = getQueueRecordsByBranchId(branchId);
  else if (cityId) result = getQueueRecordsByCityId(cityId);
  if (dateRange) result = result.filter(r => r.date >= dateRange.start && r.date <= dateRange.end);
  return delay(result);
};

export const getTransactions = (branchId?: string, cityId?: string): Promise<Transaction[]> => {
  if (branchId) return delay(getTransactionsByBranchId(branchId));
  if (cityId) return delay(getTransactionsByCityId(cityId));
  return delay(transactions);
};

export const getReviews = (branchId?: string, cityId?: string): Promise<Review[]> => {
  if (branchId) return delay(getReviewsByBranchId(branchId));
  if (cityId) return delay(getReviewsByCityId(cityId));
  return delay(reviews);
};

export const getWarnings = (status?: WarningStatus, level?: WarningLevel): Promise<Warning[]> => {
  return delay(getMockWarnings(status, level));
};

export const approveWarning = (
  id: string,
  level: number,
  action: 'approve' | 'reject',
  comment: string,
  userName: string
): Promise<Warning> => {
  const warning = getWarningById(id);
  if (!warning) return delay(null as any);
  warning.approvals.push({
    level,
    approver: userName || currentUser?.name || '未知',
    comment,
    approvedAt: new Date().toISOString(),
  });
  if (action === 'reject') {
    warning.status = 'rejected';
    warning.currentLevel = level;
  } else if (level === 1) {
    warning.currentLevel = 2;
  } else if (level === 2) {
    warning.currentLevel = 3;
  } else if (level === 3) {
    warning.status = 'approved';
    warning.currentLevel = 4;
  }
  return delay(warning);
};

export const uploadSchedule = async (
  branchId: string,
  file: File,
  weekStart?: string
): Promise<{ success: boolean; message: string }> => {
  const actualWeekStart = weekStart || new Date().toISOString().split('T')[0];
  try {
    const XLSX = await import('xlsx');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer);
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<any>(firstSheet, { defval: '' });

    if (rows.length === 0) {
      return delay({ success: false, message: 'Excel 文件为空' });
    }

    const tellerMap = new Map<string, { name: string; shifts: (ShiftType | null)[]; windows: (number | null)[] }>();

    rows.forEach((row, rowIdx) => {
      const name = String(row['柜员'] || row['姓名'] || row['name'] || row['teller'] || '').trim();
      if (!name) return;

      if (!tellerMap.has(name)) {
        tellerMap.set(name, { name, shifts: Array(7).fill(null), windows: Array(7).fill(null) });
      }
      const teller = tellerMap.get(name)!;

      const dayKeys = [
        ['周一', '星期一', 'mon', 'monday', 0],
        ['周二', '星期二', 'tue', 'tuesday', 1],
        ['周三', '星期三', 'wed', 'wednesday', 2],
        ['周四', '星期四', 'thu', 'thursday', 3],
        ['周五', '星期五', 'fri', 'friday', 4],
        ['周六', '星期六', 'sat', 'saturday', 5],
        ['周日', '星期日', '星期天', 'sun', 'sunday', 6],
      ] as const;

      dayKeys.forEach(([k1, k2, k3, k4, dayIdxRaw]) => {
        const dayIdx = Number(dayIdxRaw);
        const cellVal =
          row[k1] !== undefined ? row[k1] :
          row[k2] !== undefined ? row[k2] :
          row[k3] !== undefined ? row[k3] :
          row[k4] !== undefined ? row[k4] : undefined;

        if (cellVal !== undefined && cellVal !== '') {
          const strVal = String(cellVal).trim();
          let shift: ShiftType = 'full';
          if (strVal.includes('早') || strVal.toLowerCase().includes('morning')) shift = 'morning';
          else if (strVal.includes('午') || strVal.includes('下') || strVal.toLowerCase().includes('afternoon')) shift = 'afternoon';
          else if (strVal.includes('全') || strVal.toLowerCase().includes('full')) shift = 'full';
          else if (strVal === '休' || strVal.toLowerCase() === 'off' || strVal === '') return;

          teller.shifts[dayIdx] = shift;

          const winKey1 = `窗口${dayIdx + 1}`;
          const winKey2 = `${k1}窗口`;
          const winVal =
            row[winKey1] !== undefined ? row[winKey1] :
            row[winKey2] !== undefined ? row[winKey2] : null;
          if (winVal !== null && winVal !== '' && !isNaN(Number(winVal))) {
            teller.windows[dayIdx] = Number(winVal);
          }
        }
      });
    });

    const weekStartDate = new Date(actualWeekStart);
    const newSchedules: Schedule[] = [];
    const tellerArr = Array.from(tellerMap.values());

    for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
      const d = new Date(weekStartDate);
      d.setDate(weekStartDate.getDate() + dayIdx);
      const dateStr = d.toISOString().split('T')[0];

      const dayTellers: ScheduleTeller[] = [];
      let winCounter = 1;

      tellerArr.forEach((t, tellerIdx) => {
        const shift = t.shifts[dayIdx];
        if (!shift) return;
        const windowNum = t.windows[dayIdx] || winCounter++;
        dayTellers.push({
          tellerId: `${branchId}-t-${tellerIdx + 1}`,
          tellerName: t.name,
          shift,
          windowNumber: windowNum,
        });
      });

      newSchedules.push({
        id: `s-${branchId}-${dateStr}`,
        branchId,
        date: dateStr,
        tellers: dayTellers,
      });
    }

    updateScheduleByBranchAndWeek(branchId, actualWeekStart, newSchedules);
    return delay({ success: true, message: `排班表上传成功，共 ${tellerArr.length} 位柜员` });
  } catch (e) {
    console.error('Parse excel error', e);
    return delay({ success: false, message: 'Excel 解析失败，请检查文件格式' });
  }
};

export const getSchedule = (branchId: string, weekStart?: string): Promise<Schedule[]> => {
  if (weekStart) {
    return delay(getScheduleByBranchAndWeek(branchId, weekStart));
  }
  return delay(getScheduleByBranchId(branchId));
};

export interface ScheduleGapResult {
  availableWindows: number;
  requiredWindows: number;
  gap: number;
  gapPercentage: number;
  needWarning: boolean;
  predictedFlow: number;
  perWindowCapacity: number;
  dailyBreakdown: { date: string; available: number; required: number }[];
}

export const checkScheduleGap = (branchId: string, weekStart?: string): Promise<ScheduleGapResult> => {
  const actualWeekStart = weekStart || new Date().toISOString().split('T')[0];
  const weekSchedules = getScheduleByBranchAndWeek(branchId, actualWeekStart);
  const predictedFlow = getPredictedFlow(branchId, actualWeekStart);
  const perWindow = 40;
  const requiredPerDay = Math.ceil(predictedFlow / perWindow);

  let totalAvailable = 0;
  const dailyBreakdown: { date: string; available: number; required: number }[] = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(actualWeekStart);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const daySchedule = weekSchedules.find(s => s.date === dateStr);
    const available = daySchedule ? daySchedule.tellers.length : 0;
    totalAvailable += available;
    dailyBreakdown.push({ date: dateStr, available, required: requiredPerDay });
  }

  const avgAvailable = weekSchedules.length > 0 ? totalAvailable / weekSchedules.length : 0;
  const avgRequired = requiredPerDay;
  const gap = Math.max(0, avgRequired - avgAvailable);
  const gapPercent = avgRequired > 0 ? (gap / avgRequired) * 100 : 0;

  return delay({
    availableWindows: Math.round(avgAvailable),
    requiredWindows: avgRequired,
    gap: Math.round(gap * 10) / 10,
    gapPercentage: Math.round(gapPercent * 10) / 10,
    needWarning: gapPercent > 20,
    predictedFlow,
    perWindowCapacity: perWindow,
    dailyBreakdown,
  });
};

export const getReports = (scope?: ReportScope): Promise<Report[]> => {
  return delay(getMockReports(scope));
};

export const getReportDetail = (id: string): Promise<Report | undefined> => {
  return delay(getReportById(id));
};

export const getMonitorStream = (): Promise<{ online: boolean; latency: number; lastUpdate: string }> => {
  return delay({
    online: true,
    latency: Math.floor(50 + Math.random() * 100),
    lastUpdate: new Date().toISOString(),
  });
};

export const getCityMetrics = (cityId: string): Promise<{
  cityId: string;
  cityName: string;
  totalBranches: number;
  avgWaitTime: number;
  satisfactionScore: number;
  dailyTransactions: number;
  warningCount: number;
}> => {
  const city = getCityById(cityId);
  const cityBranches = getBranchesByCityId(cityId);
  const cityQueueRecords = getQueueRecordsByCityId(cityId);
  const cityReviews = getReviewsByCityId(cityId);
  const stats = getQueueStats(cityQueueRecords);

  return delay({
    cityId,
    cityName: city?.name ?? '',
    totalBranches: cityBranches.length,
    avgWaitTime: stats?.avgWaitTime ?? 0,
    satisfactionScore: cityReviews.length > 0
      ? Math.round(cityReviews.reduce((sum, r) => sum + r.score, 0) / cityReviews.length * 10) / 10
      : 0,
    dailyTransactions: Math.floor(50 + Math.random() * 200),
    warningCount: getWarningsByBranchId(cityBranches[0]?.id ?? '').length,
  });
};

export const getNationalMetrics = (): Promise<{
  totalCities: number;
  totalBranches: number;
  avgWaitTime: number;
  satisfactionScore: number;
  dailyTransactions: number;
  warningCount: number;
}> => {
  const stats = getQueueStats();

  return delay({
    totalCities: cities.length,
    totalBranches: branches.length,
    avgWaitTime: stats?.avgWaitTime ?? 0,
    satisfactionScore: Math.round((3.5 + Math.random()) * 10) / 10,
    dailyTransactions: Math.floor(5000 + Math.random() * 3000),
    warningCount: warnings.length,
  });
};

export type {
  User,
  City,
  Branch,
  QueueRecord,
  Transaction,
  Review,
  Warning,
  WarningStatus,
  WarningLevel,
  WarningApproval,
  Schedule,
  ScheduleTeller,
  Report,
  ReportScope,
};
