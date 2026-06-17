import dayjs from 'dayjs';
import { branches } from './branches';

export type WarningType = 'wait_time' | 'satisfaction';
export type WarningLevel = 'high' | 'medium' | 'low';
export type WarningStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface WarningApproval {
  level: number;
  approver: string;
  comment: string;
  approvedAt: string;
}

export interface Warning {
  id: string;
  branchId: string;
  branchName: string;
  type: WarningType;
  level: WarningLevel;
  triggeredAt: string;
  description: string;
  currentLevel: number;
  status: WarningStatus;
  approvals: WarningApproval[];
}

const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴'];
const lastNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋'];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateName(): string {
  return getRandomItem(firstNames) + getRandomItem(lastNames);
}

const now = dayjs();

const warningDescriptions: Record<WarningType, string[]> = {
  wait_time: [
    '平均等候时间超过阈值，当前等候时间已达45分钟',
    '高峰期排队人数过多，客户等候时间异常',
    '窗口利用率偏低导致等候时间延长',
    '午间时段排队积压，等候时间超过30分钟',
  ],
  satisfaction: [
    '客户满意度评分持续下降，低于警戒线',
    '近一周投诉量明显上升，需关注服务质量',
    '差评率超过阈值，柜员服务态度需改善',
    '多次收到客户关于服务效率的投诉',
  ],
};

const selectedBranches = branches.slice(0, 20);

export const warnings: Warning[] = [
  {
    id: 'w001',
    branchId: selectedBranches[0].id,
    branchName: selectedBranches[0].name,
    type: 'wait_time',
    level: 'high',
    triggeredAt: now.subtract(2, 'hour').toISOString(),
    description: '平均等候时间超过阈值，当前等候时间已达45分钟',
    currentLevel: 3,
    status: 'pending',
    approvals: [],
  },
  {
    id: 'w002',
    branchId: selectedBranches[1].id,
    branchName: selectedBranches[1].name,
    type: 'satisfaction',
    level: 'high',
    triggeredAt: now.subtract(5, 'hour').toISOString(),
    description: '客户满意度评分持续下降，低于警戒线',
    currentLevel: 3,
    status: 'approved',
    approvals: [
      { level: 1, approver: generateName(), comment: '已核实，需立即处理', approvedAt: now.subtract(4, 'hour').toISOString() },
      { level: 2, approver: generateName(), comment: '同意，安排专项整改', approvedAt: now.subtract(3, 'hour').toISOString() },
      { level: 3, approver: generateName(), comment: '批准，启动应急预案', approvedAt: now.subtract(2, 'hour').toISOString() },
    ],
  },
  {
    id: 'w003',
    branchId: selectedBranches[2].id,
    branchName: selectedBranches[2].name,
    type: 'wait_time',
    level: 'medium',
    triggeredAt: now.subtract(1, 'day').toISOString(),
    description: '高峰期排队人数过多，客户等候时间异常',
    currentLevel: 2,
    status: 'approved',
    approvals: [
      { level: 1, approver: generateName(), comment: '情况属实', approvedAt: now.subtract(20, 'hour').toISOString() },
      { level: 2, approver: generateName(), comment: '同意增开窗口', approvedAt: now.subtract(18, 'hour').toISOString() },
    ],
  },
  {
    id: 'w004',
    branchId: selectedBranches[3].id,
    branchName: selectedBranches[3].name,
    type: 'satisfaction',
    level: 'low',
    triggeredAt: now.subtract(2, 'day').toISOString(),
    description: '近一周投诉量明显上升，需关注服务质量',
    currentLevel: 1,
    status: 'completed',
    approvals: [
      { level: 1, approver: generateName(), comment: '已处理', approvedAt: now.subtract(1, 'day').toISOString() },
    ],
  },
  {
    id: 'w005',
    branchId: selectedBranches[4].id,
    branchName: selectedBranches[4].name,
    type: 'wait_time',
    level: 'low',
    triggeredAt: now.subtract(3, 'day').toISOString(),
    description: '窗口利用率偏低导致等候时间延长',
    currentLevel: 1,
    status: 'completed',
    approvals: [
      { level: 1, approver: generateName(), comment: '已优化排班', approvedAt: now.subtract(2, 'day').toISOString() },
    ],
  },
  {
    id: 'w006',
    branchId: selectedBranches[5].id,
    branchName: selectedBranches[5].name,
    type: 'satisfaction',
    level: 'medium',
    triggeredAt: now.subtract(1, 'day').toISOString(),
    description: '差评率超过阈值，柜员服务态度需改善',
    currentLevel: 2,
    status: 'pending',
    approvals: [],
  },
  {
    id: 'w007',
    branchId: selectedBranches[6].id,
    branchName: selectedBranches[6].name,
    type: 'wait_time',
    level: 'high',
    triggeredAt: now.subtract(6, 'hour').toISOString(),
    description: '午间时段排队积压，等候时间超过30分钟',
    currentLevel: 3,
    status: 'rejected',
    approvals: [
      { level: 1, approver: generateName(), comment: '数据异常，暂不处理', approvedAt: now.subtract(5, 'hour').toISOString() },
    ],
  },
  {
    id: 'w008',
    branchId: selectedBranches[7].id,
    branchName: selectedBranches[7].name,
    type: 'satisfaction',
    level: 'high',
    triggeredAt: now.subtract(3, 'day').toISOString(),
    description: '多次收到客户关于服务效率的投诉',
    currentLevel: 3,
    status: 'approved',
    approvals: [
      { level: 1, approver: generateName(), comment: '确认问题存在', approvedAt: now.subtract(2, 'day').toISOString() },
      { level: 2, approver: generateName(), comment: '同意整改方案', approvedAt: now.subtract(2, 'day').toISOString() },
    ],
  },
  {
    id: 'w009',
    branchId: selectedBranches[8].id,
    branchName: selectedBranches[8].name,
    type: 'wait_time',
    level: 'medium',
    triggeredAt: now.subtract(4, 'day').toISOString(),
    description: '高峰期排队人数过多，客户等候时间异常',
    currentLevel: 2,
    status: 'completed',
    approvals: [
      { level: 1, approver: generateName(), comment: '已安排增援', approvedAt: now.subtract(3, 'day').toISOString() },
      { level: 2, approver: generateName(), comment: '整改完成', approvedAt: now.subtract(2, 'day').toISOString() },
    ],
  },
  {
    id: 'w010',
    branchId: selectedBranches[9].id,
    branchName: selectedBranches[9].name,
    type: 'satisfaction',
    level: 'low',
    triggeredAt: now.subtract(5, 'day').toISOString(),
    description: '客户满意度评分持续下降，低于警戒线',
    currentLevel: 1,
    status: 'rejected',
    approvals: [
      { level: 1, approver: generateName(), comment: '样本量不足，暂不触发', approvedAt: now.subtract(4, 'day').toISOString() },
    ],
  },
  {
    id: 'w011',
    branchId: selectedBranches[0].id,
    branchName: selectedBranches[0].name,
    type: 'wait_time',
    level: 'low',
    triggeredAt: now.subtract(7, 'day').toISOString(),
    description: '窗口利用率偏低导致等候时间延长',
    currentLevel: 1,
    status: 'pending',
    approvals: [],
  },
  {
    id: 'w012',
    branchId: selectedBranches[1].id,
    branchName: selectedBranches[1].name,
    type: 'satisfaction',
    level: 'medium',
    triggeredAt: now.subtract(3, 'day').toISOString(),
    description: '近一周投诉量明显上升，需关注服务质量',
    currentLevel: 2,
    status: 'pending',
    approvals: [],
  },
  {
    id: 'w013',
    branchId: selectedBranches[2].id,
    branchName: selectedBranches[2].name,
    type: 'wait_time',
    level: 'high',
    triggeredAt: now.subtract(1, 'hour').toISOString(),
    description: '平均等候时间超过阈值，当前等候时间已达45分钟',
    currentLevel: 3,
    status: 'pending',
    approvals: [],
  },
  {
    id: 'w014',
    branchId: selectedBranches[3].id,
    branchName: selectedBranches[3].name,
    type: 'satisfaction',
    level: 'medium',
    triggeredAt: now.subtract(2, 'day').toISOString(),
    description: '多次收到客户关于服务效率的投诉',
    currentLevel: 2,
    status: 'approved',
    approvals: [
      { level: 1, approver: generateName(), comment: '核实确认', approvedAt: now.subtract(1, 'day').toISOString() },
    ],
  },
  {
    id: 'w015',
    branchId: selectedBranches[4].id,
    branchName: selectedBranches[4].name,
    type: 'wait_time',
    level: 'low',
    triggeredAt: now.subtract(6, 'day').toISOString(),
    description: '午间时段排队积压，等候时间超过30分钟',
    currentLevel: 1,
    status: 'completed',
    approvals: [
      { level: 1, approver: generateName(), comment: '已调整午间排班', approvedAt: now.subtract(5, 'day').toISOString() },
    ],
  },
  {
    id: 'w016',
    branchId: selectedBranches[5].id,
    branchName: selectedBranches[5].name,
    type: 'satisfaction',
    level: 'high',
    triggeredAt: now.subtract(8, 'hour').toISOString(),
    description: '差评率超过阈值，柜员服务态度需改善',
    currentLevel: 3,
    status: 'pending',
    approvals: [],
  },
  {
    id: 'w017',
    branchId: selectedBranches[6].id,
    branchName: selectedBranches[6].name,
    type: 'wait_time',
    level: 'medium',
    triggeredAt: now.subtract(4, 'hour').toISOString(),
    description: '高峰期排队人数过多，客户等候时间异常',
    currentLevel: 2,
    status: 'approved',
    approvals: [
      { level: 1, approver: generateName(), comment: '确认高峰期问题', approvedAt: now.subtract(3, 'hour').toISOString() },
    ],
  },
];

export const getWarnings = (status?: WarningStatus, level?: WarningLevel): Warning[] => {
  let result = warnings;
  if (status) result = result.filter(w => w.status === status);
  if (level) result = result.filter(w => w.level === level);
  return result;
};

export const getWarningById = (id: string): Warning | undefined =>
  warnings.find(w => w.id === id);

export const getWarningsByBranchId = (branchId: string): Warning[] =>
  warnings.filter(w => w.branchId === branchId);
