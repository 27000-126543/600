export interface TellerSchedule {
  tellerId: string;
  tellerName: string;
  shift: 'morning' | 'afternoon' | 'full';
  windowNumber: number;
}

export interface Schedule {
  id: string;
  branchId: string;
  date: string;
  tellers: TellerSchedule[];
}
