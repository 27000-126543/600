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
      const shifts: ShiftType[] = ['morning', 'afternoon', 'full'];
      const shift = isWeekend
        ? (Math.random() > 0.5 ? 'full' as ShiftType : getRandomItem(['morning', 'afternoon'] as ShiftType[]))
        : shifts[Math.floor(Math.random() * 3)];
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
