export interface Branch {
  id: string;
  name: string;
  cityId: string;
  cityName: string;
  address: string;
  windowCount: number;
  tellerCount: number;
  coordinates: [number, number];
  status: 'normal' | 'warning' | 'critical';
}
