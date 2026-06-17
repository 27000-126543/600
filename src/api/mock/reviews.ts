import dayjs from 'dayjs';
import { branches } from './branches';

export interface Review {
  id: string;
  branchId: string;
  tellerId: string;
  timestamp: string;
  score: number;
  content: string;
  tags: string[];
}

const allTags = ['服务好', '效率高', '等待久', '态度差', '环境好', '专业', '耐心', '冷漠'];
const positiveContents = [
  '服务态度很好，办理速度快。',
  '柜员很专业，耐心解答了我的问题。',
  '环境整洁，排队时间不长，体验不错。',
  '工作人员热情周到，非常满意。',
  '业务办理效率高，值得表扬。',
];
const negativeContents = [
  '等待时间太长了，希望改善。',
  '柜员态度冷漠，不够耐心。',
  '办理速度太慢，等了很久。',
  '排队管理混乱，体验不佳。',
  '服务态度需要改进。',
];
const neutralContents = [
  '整体还行，有提升空间。',
  '一般般，没什么特别的。',
  '正常办理，中规中矩。',
];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomTags(count: number): string[] {
  const shuffled = [...allTags].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const now = dayjs();

export const reviews: Review[] = [];

let reviewIndex = 0;

branches.forEach(branch => {
  const reviewCount = 5 + Math.floor(Math.random() * 16);
  for (let i = 0; i < reviewCount; i++) {
    const dayOffset = Math.floor(Math.random() * 30);
    const hour = 9 + Math.floor(Math.random() * 8);
    const minute = Math.floor(Math.random() * 60);
    const tellerIdx = Math.floor(Math.random() * branch.tellerCount) + 1;
    const score = 1 + Math.floor(Math.random() * 5);
    const tagCount = 1 + Math.floor(Math.random() * 3);

    let content: string;
    if (score >= 4) {
      content = getRandomItem(positiveContents);
    } else if (score <= 2) {
      content = getRandomItem(negativeContents);
    } else {
      content = getRandomItem(neutralContents);
    }

    reviews.push({
      id: `r${String(reviewIndex + 1).padStart(6, '0')}`,
      branchId: branch.id,
      tellerId: `${branch.id}-teller-${tellerIdx}`,
      timestamp: now.subtract(dayOffset, 'day').hour(hour).minute(minute).toISOString(),
      score,
      content,
      tags: getRandomTags(tagCount),
    });

    reviewIndex++;
  }
});

export const getReviewsByBranchId = (branchId: string): Review[] =>
  reviews.filter(r => r.branchId === branchId);

export const getReviewsByCityId = (cityId: string): Review[] => {
  const branchIds = new Set(branches.filter(b => b.cityId === cityId).map(b => b.id));
  return reviews.filter(r => branchIds.has(r.branchId));
};
