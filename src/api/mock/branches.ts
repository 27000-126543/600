import dayjs from 'dayjs';
import { cities } from './cities';

export type BranchStatus = 'normal' | 'warning' | 'critical';

export interface Branch {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
  address: string;
  phone: string;
  manager: string;
  windowCount: number;
  tellerCount: number;
  status: BranchStatus;
  businessHours: {
    weekday: string;
    weekend: string;
  };
  coordinates: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
}

const streetNames = ['中山路', '人民路', '解放路', '建设路', '文化路', '科技路', '和平路', '长江路', '黄河路', '珠江路', '松花江路', '淮河路', '海河东路', '太湖路', '西湖路'];
const districtNames = ['朝阳区', '海淀区', '东城区', '西城区', '丰台区', '浦东新区', '黄浦区', '徐汇区', '静安区', '天河区', '越秀区', '海珠区', '南山区', '福田区', '罗湖区'];
const firstNames = ['张', '李', '王', '刘', '陈', '杨', '黄', '赵', '周', '吴', '徐', '孙', '马', '朱', '胡', '郭', '何', '高', '林', '罗'];
const lastNames = ['伟', '芳', '娜', '敏', '静', '丽', '强', '磊', '军', '洋', '勇', '艳', '杰', '娟', '涛', '明', '超', '秀英', '霞', '平'];

const statuses: BranchStatus[] = ['normal', 'warning', 'critical'];
const statusWeights = [0.6, 0.3, 0.1];

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getWeightedStatus(): BranchStatus {
  const rand = Math.random();
  let sum = 0;
  for (let i = 0; i < statuses.length; i++) {
    sum += statusWeights[i];
    if (rand < sum) return statuses[i];
  }
  return statuses[0];
}

function generatePhone(): string {
  return `0${100 + Math.floor(Math.random() * 899)}-${10000000 + Math.floor(Math.random() * 89999999)}`;
}

function generateName(): string {
  return getRandomItem(firstNames) + getRandomItem(lastNames);
}

function generateBranchName(cityName: string, index: number): string {
  const suffixes = ['中心支行', '营业部', '第一支行', '第二支行', '科技园支行', '金融街支行', '开发区支行', '新区支行', '商务区支行', '广场支行'];
  return `${cityName}${getRandomItem(suffixes)}${index > 0 ? `（${index + 1}）` : ''}`;
}

const now = dayjs();
export const branches: Branch[] = [];

let branchIndex = 0;
cities.forEach((city, cityIndex) => {
  const branchCount = cityIndex < 5 ? 10 + Math.floor(Math.random() * 8) : 4 + Math.floor(Math.random() * 8);
  
  for (let i = 0; i < branchCount; i++) {
    if (branches.length >= 220) break;
    
    const branchId = `b${String(branchIndex + 1).padStart(4, '0')}`;
    const streetNumber = Math.floor(Math.random() * 999) + 1;
    const district = getRandomItem(districtNames);
    const street = getRandomItem(streetNames);
    
    branches.push({
      id: branchId,
      name: generateBranchName(city.name, i),
      cityId: city.id,
      cityName: city.name,
      address: `${city.name}${district}${street}${streetNumber}号`,
      phone: generatePhone(),
      manager: generateName(),
      windowCount: 3 + Math.floor(Math.random() * 8),
      tellerCount: 5 + Math.floor(Math.random() * 16),
      status: getWeightedStatus(),
      businessHours: {
        weekday: '09:00-17:30',
        weekend: '09:30-16:00',
      },
      coordinates: {
        lat: city.coordinates.lat + (Math.random() - 0.5) * 0.2,
        lng: city.coordinates.lng + (Math.random() - 0.5) * 0.2,
      },
      createdAt: now.subtract(Math.floor(Math.random() * 730), 'day').toISOString(),
      updatedAt: now.subtract(Math.floor(Math.random() * 60), 'day').toISOString(),
    });
    
    branchIndex++;
  }
  
  if (branches.length >= 220) return;
});

export const getBranches = (): Branch[] => branches;

export const getBranchById = (id: string): Branch | undefined =>
  branches.find(branch => branch.id === id);

export const getBranchesByCityId = (cityId: string): Branch[] =>
  branches.filter(branch => branch.cityId === cityId);

export const getBranchesByStatus = (status: BranchStatus): Branch[] =>
  branches.filter(branch => branch.status === status);
