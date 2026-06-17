export interface QueueData {
  id: string;
  branchId: string;
  timestamp: string;
  waitCount: number;
  avgWaitTime: number;
  maxWaitTime: number;
  businessType: string;
}
