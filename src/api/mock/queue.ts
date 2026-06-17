import dayjs from 'dayjs';
import { branches } from './branches';

export interface QueueRecord {
  id: string;
  branchId: string;
  branchName: string;
  cityId: string;
  cityName: string;
  date: string;
  hour: number;
  totalCustomers: number;
  waitingCustomers: number;
  servedCustomers: number;
  avgWaitTime: number;
  maxWaitTime: number;
  minWaitTime: number;
  windowUtilization: number;
  createdAt: string;
}

function gaussianRandom(mean: number, std: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, mean + z * std);
}

const now = dayjs();
const startDate = now.subtract(90, 'day');
const totalDays = 90;
const targetRecords = 15000;

export const queueRecords: QueueRecord[] = [];

let recordId = 0;
const recordsPerDayPerBranch = 3;

for (let dayOffset = 0; dayOffset < totalDays; dayOffset++) {
  const currentDate = startDate.add(dayOffset, 'day');
  const dateStr = currentDate.format('YYYY-MM-DD');
  const isWeekend = currentDate.day() === 0 || currentDate.day() === 6;
  const seasonFactor = 1 + Math.sin((dayOffset / 90) * Math.PI) * 0.2;

  let shouldBreak = false;
  for (let b = 0; b < branches.length; b++) {
    const branch = branches[b];
    for (let record = 0; record < recordsPerDayPerBranch; record++) {
      const hour = 9 + Math.floor(Math.random() * 9);

      const hourFactor = hour >= 11 && hour <= 14 ? 1.5 : hour >= 15 && hour <= 17 ? 1.2 : 1;
      const weekendFactor = isWeekend ? 0.7 : 1;
      const branchFactor = branch.windowCount / 5;
      const trafficMultiplier = hourFactor * weekendFactor * seasonFactor / branchFactor;

      const avgWaitTime = Math.min(30, Math.max(5, gaussianRandom(15, 5) * trafficMultiplier));
      const totalCustomers = Math.floor((20 + Math.random() * 30) * trafficMultiplier);
      const servedCustomers = Math.floor(totalCustomers * (0.6 + Math.random() * 0.35));
      const waitingCustomers = totalCustomers - servedCustomers;

      queueRecords.push({
        id: `q${String(recordId + 1).padStart(6, '0')}`,
        branchId: branch.id,
        branchName: branch.name,
        cityId: branch.cityId,
        cityName: branch.cityName,
        date: dateStr,
        hour,
        totalCustomers,
        waitingCustomers,
        servedCustomers,
        avgWaitTime: Math.round(avgWaitTime),
        maxWaitTime: Math.round(avgWaitTime * (1.5 + Math.random() * 0.8)),
        minWaitTime: Math.max(1, Math.round(avgWaitTime * (0.3 + Math.random() * 0.4))),
        windowUtilization: Math.min(1, Math.max(0.3, (0.5 + Math.random() * 0.4) * trafficMultiplier)),
        createdAt: currentDate.hour(hour).minute(Math.floor(Math.random() * 60)).toISOString(),
      });

      recordId++;
      if (queueRecords.length >= targetRecords) {
        shouldBreak = true;
        break;
      }
    }
    if (shouldBreak) break;
  }
  if (shouldBreak) break;
}

export const getQueueRecords = (): QueueRecord[] => queueRecords;

export const getQueueRecordsByBranchId = (branchId: string): QueueRecord[] =>
  queueRecords.filter(r => r.branchId === branchId);

export const getQueueRecordsByDateRange = (startDate: string, endDate: string): QueueRecord[] =>
  queueRecords.filter(r => r.date >= startDate && r.date <= endDate);

export const getQueueRecordsByCityId = (cityId: string): QueueRecord[] =>
  queueRecords.filter(r => r.cityId === cityId);

export const getQueueStats = (records?: QueueRecord[]) => {
  const data = records || queueRecords;
  if (data.length === 0) return null;
  
  const totalCustomers = data.reduce((sum, r) => sum + r.totalCustomers, 0);
  const totalServed = data.reduce((sum, r) => sum + r.servedCustomers, 0);
  const avgWaitTime = data.reduce((sum, r) => sum + r.avgWaitTime, 0) / data.length;
  const avgUtilization = data.reduce((sum, r) => sum + r.windowUtilization, 0) / data.length;

  return {
    totalRecords: data.length,
    totalCustomers,
    totalServed,
    avgWaitTime: Math.round(avgWaitTime * 10) / 10,
    avgUtilization: Math.round(avgUtilization * 100) / 100,
    serviceRate: Math.round((totalServed / totalCustomers) * 100) / 100,
  };
};
