import dayjs from 'dayjs';
import { branches } from './branches';

export type BusinessType = '个人存取款' | '对公业务' | '理财业务' | '贷款业务' | '外汇业务';

export interface Transaction {
  id: string;
  branchId: string;
  tellerId: string;
  tellerName: string;
  timestamp: string;
  businessType: BusinessType;
  duration: number;
  amount: number;
}

const businessTypes: BusinessType[] = ['个人存取款', '对公业务', '理财业务', '贷款业务', '外汇业务'];
const businessWeights = [0.4, 0.2, 0.15, 0.15, 0.1];

const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗'];
const lastNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWeightedBusinessType(): BusinessType {
  const rand = Math.random();
  let sum = 0;
  for (let i = 0; i < businessTypes.length; i++) {
    sum += businessWeights[i];
    if (rand < sum) return businessTypes[i];
  }
  return businessTypes[0];
}

function generateTellerName(): string {
  return getRandomItem(firstNames) + getRandomItem(lastNames);
}

const now = dayjs();
const startDate = now.subtract(30, 'day');

export const transactions: Transaction[] = [];

let txnIndex = 0;

branches.forEach(branch => {
  for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
    const currentDate = startDate.add(dayOffset, 'day');
    const isWeekend = currentDate.day() === 0 || currentDate.day() === 6;
    const txnCount = isWeekend
      ? 2 + Math.floor(Math.random() * 2)
      : 2 + Math.floor(Math.random() * 4);

    for (let i = 0; i < txnCount; i++) {
      const hour = 9 + Math.floor(Math.random() * 8);
      const minute = Math.floor(Math.random() * 60);
      const tellerIdx = Math.floor(Math.random() * branch.tellerCount) + 1;

      transactions.push({
        id: `t${String(txnIndex + 1).padStart(6, '0')}`,
        branchId: branch.id,
        tellerId: `${branch.id}-teller-${tellerIdx}`,
        tellerName: generateTellerName(),
        timestamp: currentDate.hour(hour).minute(minute).toISOString(),
        businessType: getWeightedBusinessType(),
        duration: 3 + Math.floor(Math.random() * 13),
        amount: Math.round((100 + Math.random() * 9900) * 100) / 100,
      });

      txnIndex++;
    }
  }
});

export const getTransactionsByBranchId = (branchId: string): Transaction[] =>
  transactions.filter(t => t.branchId === branchId);

export const getTransactionsByCityId = (cityId: string): Transaction[] => {
  const branchIds = new Set(branches.filter(b => b.cityId === cityId).map(b => b.id));
  return transactions.filter(t => branchIds.has(t.branchId));
};
