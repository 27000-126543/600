import dayjs from 'dayjs';

export interface City {
  id: string;
  name: string;
  province: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  createdAt: string;
  updatedAt: string;
}

const cityData: Omit<City, 'createdAt' | 'updatedAt'>[] = [
  { id: 'c001', name: '北京', province: '北京市', coordinates: { lat: 39.9042, lng: 116.4074 } },
  { id: 'c002', name: '上海', province: '上海市', coordinates: { lat: 31.2304, lng: 121.4737 } },
  { id: 'c003', name: '广州', province: '广东省', coordinates: { lat: 23.1291, lng: 113.2644 } },
  { id: 'c004', name: '深圳', province: '广东省', coordinates: { lat: 22.5431, lng: 114.0579 } },
  { id: 'c005', name: '成都', province: '四川省', coordinates: { lat: 30.5728, lng: 104.0668 } },
  { id: 'c006', name: '杭州', province: '浙江省', coordinates: { lat: 30.2741, lng: 120.1551 } },
  { id: 'c007', name: '武汉', province: '湖北省', coordinates: { lat: 30.5928, lng: 114.3055 } },
  { id: 'c008', name: '南京', province: '江苏省', coordinates: { lat: 32.0603, lng: 118.7969 } },
  { id: 'c009', name: '西安', province: '陕西省', coordinates: { lat: 34.3416, lng: 108.9398 } },
  { id: 'c010', name: '重庆', province: '重庆市', coordinates: { lat: 29.4316, lng: 106.9123 } },
  { id: 'c011', name: '天津', province: '天津市', coordinates: { lat: 39.0842, lng: 117.2009 } },
  { id: 'c012', name: '苏州', province: '江苏省', coordinates: { lat: 31.2989, lng: 120.5853 } },
  { id: 'c013', name: '郑州', province: '河南省', coordinates: { lat: 34.7466, lng: 113.6253 } },
  { id: 'c014', name: '长沙', province: '湖南省', coordinates: { lat: 28.2282, lng: 112.9388 } },
  { id: 'c015', name: '东莞', province: '广东省', coordinates: { lat: 23.0207, lng: 113.7518 } },
  { id: 'c016', name: '青岛', province: '山东省', coordinates: { lat: 36.0671, lng: 120.3826 } },
  { id: 'c017', name: '合肥', province: '安徽省', coordinates: { lat: 31.8206, lng: 117.2272 } },
  { id: 'c018', name: '沈阳', province: '辽宁省', coordinates: { lat: 41.8057, lng: 123.4315 } },
  { id: 'c019', name: '大连', province: '辽宁省', coordinates: { lat: 38.9140, lng: 121.6147 } },
  { id: 'c020', name: '厦门', province: '福建省', coordinates: { lat: 24.4798, lng: 118.0894 } },
  { id: 'c021', name: '福州', province: '福建省', coordinates: { lat: 26.0745, lng: 119.2965 } },
  { id: 'c022', name: '济南', province: '山东省', coordinates: { lat: 36.6512, lng: 117.1201 } },
  { id: 'c023', name: '哈尔滨', province: '黑龙江省', coordinates: { lat: 45.8038, lng: 126.5350 } },
  { id: 'c024', name: '长春', province: '吉林省', coordinates: { lat: 43.8171, lng: 125.3235 } },
  { id: 'c025', name: '太原', province: '山西省', coordinates: { lat: 37.8706, lng: 112.5489 } },
  { id: 'c026', name: '南昌', province: '江西省', coordinates: { lat: 28.6820, lng: 115.8579 } },
  { id: 'c027', name: '南宁', province: '广西壮族自治区', coordinates: { lat: 22.8170, lng: 108.3665 } },
  { id: 'c028', name: '昆明', province: '云南省', coordinates: { lat: 24.8801, lng: 102.8329 } },
  { id: 'c029', name: '贵阳', province: '贵州省', coordinates: { lat: 26.6470, lng: 106.6302 } },
  { id: 'c030', name: '兰州', province: '甘肃省', coordinates: { lat: 36.0611, lng: 103.8343 } },
  { id: 'c031', name: '乌鲁木齐', province: '新疆维吾尔自治区', coordinates: { lat: 43.8256, lng: 87.6168 } },
  { id: 'c032', name: '呼和浩特', province: '内蒙古自治区', coordinates: { lat: 40.8426, lng: 111.7498 } },
  { id: 'c033', name: '无锡', province: '江苏省', coordinates: { lat: 31.4912, lng: 120.3119 } },
  { id: 'c034', name: '宁波', province: '浙江省', coordinates: { lat: 29.8683, lng: 121.5440 } },
  { id: 'c035', name: '佛山', province: '广东省', coordinates: { lat: 23.0215, lng: 113.1219 } },
];

const now = dayjs();
export const cities: City[] = cityData.map(city => ({
  ...city,
  createdAt: now.subtract(Math.floor(Math.random() * 365), 'day').toISOString(),
  updatedAt: now.subtract(Math.floor(Math.random() * 30), 'day').toISOString(),
}));

export const getCities = (): City[] => cities;

export const getCityById = (id: string): City | undefined => 
  cities.find(city => city.id === id);

export const getCitiesByProvince = (province: string): City[] =>
  cities.filter(city => city.province === province);
