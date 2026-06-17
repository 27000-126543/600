import dayjs from 'dayjs';
import { cities } from './cities';
import { branches } from './branches';

export type ReportScope = 'national' | 'city' | 'branch';

export interface WaitTimeAnalysis {
  avgWaitTime: number;
  yoyChange: number;
  momChange: number;
  peakHours: number[];
}

export interface ComplaintItem {
  type: string;
  count: number;
  percentage: number;
}

export interface DeviceFailureItem {
  device: string;
  failureRate: number;
  trend: 'up' | 'down' | 'stable';
}

export interface ReportContent {
  waitTimeAnalysis: WaitTimeAnalysis;
  complaintDistribution: ComplaintItem[];
  deviceFailureRate: DeviceFailureItem[];
  recommendations: string[];
}

export interface Report {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
  scope: ReportScope;
  scopeId: string;
  content: ReportContent;
}

const now = dayjs();

function generateWaitTimeAnalysis(): WaitTimeAnalysis {
  return {
    avgWaitTime: Math.round((10 + Math.random() * 20) * 10) / 10,
    yoyChange: Math.round((Math.random() * 20 - 10) * 10) / 10,
    momChange: Math.round((Math.random() * 15 - 5) * 10) / 10,
    peakHours: [10, 11, 14, 15].sort(() => Math.random() - 0.5).slice(0, 2 + Math.floor(Math.random() * 3)),
  };
}

function generateComplaints(): ComplaintItem[] {
  const types = ['等候时间过长', '服务态度差', '业务办理慢', '窗口开放不足', '环境问题', '设备故障'];
  const total = 100 + Math.floor(Math.random() * 200);
  return types.map(type => {
    const count = Math.floor(Math.random() * total / types.length * 2) + 5;
    return { type, count, percentage: 0 };
  }).map(item => ({
    ...item,
    percentage: Math.round(item.count / total * 1000) / 10,
  }));
}

function generateDeviceFailures(): DeviceFailureItem[] {
  const devices = ['ATM', '智能柜员机', '叫号机', '自助终端', '网银终端'];
  const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable'];
  return devices.map(device => ({
    device,
    failureRate: Math.round(Math.random() * 8 * 100) / 100,
    trend: trends[Math.floor(Math.random() * 3)],
  }));
}

function generateRecommendations(): string[] {
  const all = [
    '建议高峰时段增开2个服务窗口',
    '建议加强柜员业务培训，提升办理效率',
    '建议优化叫号系统，合理分配客户流量',
    '建议更新老旧设备，降低设备故障率',
    '建议推行预约服务，分散客流高峰',
    '建议增设自助服务区域，分流简单业务',
    '建议加强午间排班，确保服务连续性',
    '建议完善客户评价反馈机制',
  ];
  const shuffled = [...all].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3 + Math.floor(Math.random() * 3));
}

function generateContent(): ReportContent {
  return {
    waitTimeAnalysis: generateWaitTimeAnalysis(),
    complaintDistribution: generateComplaints(),
    deviceFailureRate: generateDeviceFailures(),
    recommendations: generateRecommendations(),
  };
}

const nationalReports: Report[] = [
  {
    id: 'rpt001',
    title: '全国网点运营诊断月报',
    period: now.subtract(1, 'month').format('YYYY年MM月'),
    generatedAt: now.subtract(5, 'day').toISOString(),
    scope: 'national',
    scopeId: 'national',
    content: generateContent(),
  },
  {
    id: 'rpt002',
    title: '全国网点运营诊断月报',
    period: now.subtract(2, 'month').format('YYYY年MM月'),
    generatedAt: now.subtract(35, 'day').toISOString(),
    scope: 'national',
    scopeId: 'national',
    content: generateContent(),
  },
  {
    id: 'rpt003',
    title: '全国网点运营诊断月报',
    period: now.subtract(3, 'month').format('YYYY年MM月'),
    generatedAt: now.subtract(65, 'day').toISOString(),
    scope: 'national',
    scopeId: 'national',
    content: generateContent(),
  },
];

const cityReports: Report[] = cities.slice(0, 5).map((city, idx) => ({
  id: `rpt${String(idx + 4).padStart(3, '0')}`,
  title: `${city.name}网点运营诊断月报`,
  period: now.subtract(1, 'month').format('YYYY年MM月'),
  generatedAt: now.subtract(3 + idx, 'day').toISOString(),
  scope: 'city' as ReportScope,
  scopeId: city.id,
  content: generateContent(),
}));

const branchReports: Report[] = branches.slice(0, 4).map((branch, idx) => ({
  id: `rpt${String(idx + 9).padStart(3, '0')}`,
  title: `${branch.name}运营诊断报告`,
  period: now.subtract(1, 'month').format('YYYY年MM月'),
  generatedAt: now.subtract(1 + idx, 'day').toISOString(),
  scope: 'branch' as ReportScope,
  scopeId: branch.id,
  content: generateContent(),
}));

export const reports: Report[] = [...nationalReports, ...cityReports, ...branchReports];

export const getReports = (scope?: ReportScope): Report[] => {
  if (scope) return reports.filter(r => r.scope === scope);
  return reports;
};

export const getReportById = (id: string): Report | undefined =>
  reports.find(r => r.id === id);
