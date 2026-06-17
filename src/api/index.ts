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
  } else if (warning.currentLevel <= 1) {
    warning.currentLevel = 2;
  } else if (warning.currentLevel <= 2) {
    warning.currentLevel = 3;
  } else if (warning.currentLevel <= 3) {
    warning.status = 'approved';
    warning.currentLevel = 4;
  }
  return delay(warning);
};

export const uploadSchedule = (branchId: string, file: File, weekStart?: string): Promise<{ success: boolean; message: string }> => {
  return delay({ success: true, message: '排班表上传成功' });
};

export const getSchedule = (branchId: string, weekStart?: string): Promise<Schedule[]> => {
  const data = getScheduleByBranchId(branchId);
  return delay(data);
};

export interface ScheduleGapResult {
  availableWindows: number;
  requiredWindows: number;
  gap: number;
  gapPercentage: number;
  needWarning: boolean;
  predictedFlow: number;
  perWindowCapacity: number;
}

export const checkScheduleGap = (branchId: string, weekStart?: string): Promise<ScheduleGapResult> => {
  const branch = getBranchById(branchId);
  const windows = branch?.windowCount || 5;
  const predictedFlow = Math.floor(80 + Math.random() * 120);
  const perWindow = 40;
  const required = Math.ceil(predictedFlow / perWindow);
  const gap = required - windows;
  const gapPercent = (gap / required) * 100;
  
  return delay({
    availableWindows: windows,
    requiredWindows: required,
    gap: Math.max(0, gap),
    gapPercentage: Math.max(0, gapPercent),
    needWarning: gapPercent > 20,
    predictedFlow,
    perWindowCapacity: perWindow,
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
