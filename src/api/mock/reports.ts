import dayjs from 'dayjs';
import { cities } from './cities';
import { branches } from './branches';

export type ReportScope = 'national' | 'city' | 'branch';

export interface WaitTimeAnalysis {
  avgWaitTime: number;
  wowChange: number;
  yoyChange: number;
  peakHours: number[];
  dailyTrend: { date: string; waitTime: number }[];
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
  failureCount: number;
}

export interface ReportContent {
  weekStart: string;
  weekEnd: string;
  waitTimeAnalysis: WaitTimeAnalysis;
  complaintDistribution: ComplaintItem[];
  deviceFailureRate: DeviceFailureItem[];
  recommendations: string[];
  summary: string;
}

export interface Report {
  id: string;
  title: string;
  period: string;
  weekStart: string;
  weekEnd: string;
  generatedAt: string;
  scope: ReportScope;
  scopeId: string;
  scopeName: string;
  content: ReportContent;
}

function hashStr(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

const now = new Date();

function generateWaitTimeAnalysis(seed: number, weekStart: string): WaitTimeAnalysis {
  const rand = seeded(seed);
  const dailyTrend: { date: string; waitTime: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const d = dayjs(weekStart).add(i, 'day');
    dailyTrend.push({
      date: d.format('MM-DD'),
      waitTime: Math.round((8 + rand() * 25) * 10) / 10,
    });
  }
  return {
    avgWaitTime: Math.round(dailyTrend.reduce((s, d) => s + d.waitTime, 0) / 7 * 10) / 10,
    wowChange: Math.round((rand() * 25 - 10) * 10) / 10,
    yoyChange: Math.round((rand() * 20 - 8) * 10) / 10,
    peakHours: [10, 11, 14, 15, 16].sort(() => rand() - 0.5).slice(0, 2 + Math.floor(rand() * 3)),
    dailyTrend,
  };
}

function generateComplaints(seed: number): ComplaintItem[] {
  const rand = seeded(seed + 100);
  const types = ['等候时间过长', '服务态度差', '业务办理慢', '窗口开放不足', '环境问题', '设备故障'];
  const total = 20 + Math.floor(rand() * 60);
  const items = types.map(type => {
    const count = Math.floor(rand() * total / types.length * 2) + 2;
    return { type, count, percentage: 0 };
  });
  const sum = items.reduce((s, i) => s + i.count, 0);
  return items.map(item => ({
    ...item,
    percentage: Math.round(item.count / sum * 1000) / 10,
  }));
}

function generateDeviceFailures(seed: number): DeviceFailureItem[] {
  const rand = seeded(seed + 200);
  const devices = ['ATM', '智能柜员机', '叫号机', '自助终端', '网银终端'];
  const trends: Array<'up' | 'down' | 'stable'> = ['up', 'down', 'stable'];
  return devices.map(device => {
    const count = Math.floor(rand() * 12);
    return {
      device,
      failureCount: count,
      failureRate: Math.round((count / (50 + rand() * 200)) * 10000) / 100,
      trend: trends[Math.floor(rand() * 3)],
    };
  });
}

function generateRecommendations(seed: number, waitTime: WaitTimeAnalysis, complaints: ComplaintItem[]): string[] {
  const rand = seeded(seed + 300);
  const pool: string[] = [];
  if (waitTime.avgWaitTime > 18) pool.push('建议高峰时段增开2-3个服务窗口，缓解排队压力');
  if (waitTime.avgWaitTime > 12) pool.push('建议优化叫号系统，按业务类型智能分配窗口');
  if (waitTime.wowChange > 5) pool.push('等候时长环比上升明显，建议排查业务流程瓶颈');
  const topComplaint = complaints.sort((a, b) => b.count - a.count)[0]?.type;
  if (topComplaint?.includes('等候')) pool.push('建议推行预约服务，分散客流高峰时段');
  if (topComplaint?.includes('态度')) pool.push('建议开展柜员服务礼仪专项培训');
  if (topComplaint?.includes('设备')) pool.push('建议加强设备日常巡检，备足备用机');
  if (topComplaint?.includes('窗口')) pool.push('建议动态调整排班，午间确保不少于2个窗口');
  pool.push('建议增设自助服务区域，分流存取款等简单业务');
  pool.push('建议完善客户评价反馈闭环，当日投诉当日响应');
  pool.push('建议定期开展业务技能考核，提升人均办理效率');
  const shuffled = [...pool].sort(() => rand() - 0.5);
  return shuffled.slice(0, 3 + Math.floor(rand() * 2));
}

function generateSummary(scopeName: string, weekStart: string, weekEnd: string, content: ReportContent): string {
  const wt = content.waitTimeAnalysis;
  const topComplaint = content.complaintDistribution.sort((a, b) => b.count - a.count)[0];
  return `${scopeName}${weekStart.slice(5)}至${weekEnd.slice(5)}运营情况：平均等候时长${wt.avgWaitTime}分钟，${wt.wowChange >= 0 ? '环比上升' : '环比下降'}${Math.abs(wt.wowChange)}%；本周投诉以「${topComplaint?.type || '其他'}」为主，占比${topComplaint?.percentage || 0}%；设备整体运行平稳，建议按推荐方案持续优化。`;
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

function formatDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function formatDateCN(d: Date): string {
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

function generateWeeklyReport(
  id: string,
  scope: ReportScope,
  scopeId: string,
  scopeName: string,
  weekOffset: number
): Report {
  const monday = getMonday(now);
  const weekStartDate = new Date(monday);
  weekStartDate.setDate(monday.getDate() - weekOffset * 7);
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setDate(weekStartDate.getDate() + 6);

  const weekStartStr = formatDateStr(weekStartDate);
  const weekEndStr = formatDateStr(weekEndDate);
  const period = `${formatDateCN(weekStartDate)} - ${weekEndDate.getMonth() + 1}月${weekEndDate.getDate()}日`;
  const weekNum = getISOWeek(weekStartDate);

  const seed = hashStr(`${id}-${scopeId}-${weekStartStr}`);
  const waitTimeAnalysis = generateWaitTimeAnalysis(seed, weekStartStr);
  const complaintDistribution = generateComplaints(seed);
  const deviceFailureRate = generateDeviceFailures(seed);
  const recommendations = generateRecommendations(seed, waitTimeAnalysis, complaintDistribution);

  const content: ReportContent = {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    waitTimeAnalysis,
    complaintDistribution,
    deviceFailureRate,
    recommendations,
    summary: '',
  };
  content.summary = generateSummary(scopeName, weekStartStr, weekEndStr, content);

  const genDate = new Date(weekEndDate);
  genDate.setDate(genDate.getDate() + 1);
  genDate.setHours(9, 0, 0, 0);

  return {
    id,
    title: `${scopeName}第${weekNum}周运营诊断周报`,
    period,
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    generatedAt: genDate.toISOString(),
    scope,
    scopeId,
    scopeName,
    content,
  };
}

const allReports: Report[] = [];

let reportIdx = 1;

for (let w = 0; w < 8; w++) {
  allReports.push(
    generateWeeklyReport(
      `rpt${String(reportIdx++).padStart(4, '0')}`,
      'national',
      'national',
      '全国',
      w
    )
  );
}

cities.slice(0, 4).forEach((city) => {
  for (let w = 0; w < 4; w++) {
    allReports.push(
      generateWeeklyReport(
        `rpt${String(reportIdx++).padStart(4, '0')}`,
        'city',
        city.id,
        city.name,
        w
      )
    );
  }
});

branches.slice(0, 3).forEach((branch) => {
  for (let w = 0; w < 3; w++) {
    allReports.push(
      generateWeeklyReport(
        `rpt${String(reportIdx++).padStart(4, '0')}`,
        'branch',
        branch.id,
        branch.name,
        w
      )
    );
  }
});

allReports.sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());

export const reports: Report[] = allReports;

export const getReports = (scope?: ReportScope): Report[] => {
  if (scope) return reports.filter(r => r.scope === scope);
  return reports;
};

export const getReportById = (id: string): Report | undefined =>
  reports.find(r => r.id === id);
