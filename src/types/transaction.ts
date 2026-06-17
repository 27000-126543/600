export interface Transaction {
  id: string;
  branchId: string;
  tellerId: string;
  tellerName: string;
  timestamp: string;
  businessType: string;
  duration: number;
  amount?: number;
}
