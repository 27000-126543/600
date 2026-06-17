import dayjs from 'dayjs';
import { branches } from './branches';

export type ShiftType = 'morning' | 'afternoon' | 'full';

export interface ScheduleTeller {
  tellerId: string;
  tellerName: string;
  shift: ShiftType;
  windowNumber: number;
}

export interface Schedule {
  id: string;
  branchId: string;
  date: string;
  tellers: ScheduleTeller[];
}

const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡'];
const lastNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '明', '超'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateTellerName(): string {
  return getRandomItem(firstNames) + getRandomItem(lastNames);
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const now = dayjs();
const startOfWeek = now.startOf('week');

const scheduleBranches = branches.slice(0, 3);

export const schedules: Schedule[] = [];

let scheduleIndex = 0;

scheduleBranches.forEach(branch => {
  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = startOfWeek.add(dayOffset, 'day');
    const dateStr = date.format('YYYY-MM-DD');
    const isWeekend = date.day() === 0 || date.day() === 6;
    const tellerCount = isWeekend ? 3 + Math.floor(Math.random() * 3) : 5 + Math.floor(Math.random() * 4);
    const tellers: ScheduleTeller[] = [];

    for (let t = 0; t < tellerCount; t++) {
      const shiftsArr: ShiftType[] = ['morning', 'afternoon', 'full'];
      const shift = isWeekend
        ? (Math.random() > 0.5 ? 'full' as ShiftType : getRandomItem(['morning', 'afternoon'] as ShiftType[]))
        : shiftsArr[Math.floor(Math.random() * 3)];
      const windowNumber = t + 1;

      tellers.push({
        tellerId: `${branch.id}-teller-${t + 1}`,
        tellerName: generateTellerName(),
        shift,
        windowNumber,
      });
    }

    schedules.push({
      id: `s${String(scheduleIndex + 1).padStart(4, '0')}`,
      branchId: branch.id,
      date: dateStr,
      tellers,
    });

    scheduleIndex++;
  }
});

export const getScheduleByBranchId = (branchId: string): Schedule[] =>
  schedules.filter(s => s.branchId === branchId);

export const getScheduleByBranchAndWeek = (branchId: string, weekStart: string): Schedule[] => {
  const start = dayjs(weekStart);
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(start.add(i, 'day').format('YYYY-MM-DD'));
  }
  return schedules.filter(s => s.branchId === branchId && weekDates.includes(s.date));
};

export const updateScheduleByBranchAndWeek = (
  branchId: string,
  weekStart: string,
  newSchedules: Schedule[]
): void => {
  const start = dayjs(weekStart);
  const weekDates: string[] = [];
  for (let i = 0; i < 7; i++) {
    weekDates.push(start.add(i, 'day').format('YYYY-MM-DD'));
  }
  for (let i = schedules.length - 1; i >= 0; i--) {
    if (schedules[i].branchId === branchId && weekDates.includes(schedules[i].date)) {
      schedules.splice(i, 1);
    }
  }
  schedules.push(...newSchedules);
};

export const getPredictedFlow = (branchId: string, weekStart: string): number => {
  const seed = hashString(`${branchId}-${weekStart}`);
  const rand = seededRandom(seed);
  return Math.floor(80 + rand() * 120);
};
