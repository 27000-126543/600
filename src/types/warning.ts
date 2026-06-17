export interface ApprovalRecord {
  id: string;
  warningId: string;
  level: number;
  userId: string;
  userName: string;
  role: string;
  action: 'approve' | 'reject';
  comment: string;
  timestamp: string;
}

export interface Warning {
  id: string;
  branchId: string;
  branchName: string;
  type: 'wait_time' | 'satisfaction';
  level: 'high' | 'medium' | 'low';
  triggeredAt: string;
  description: string;
  currentLevel: 1 | 2 | 3;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approvals: ApprovalRecord[];
}
