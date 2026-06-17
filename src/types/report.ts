export interface ReportContent {
  waitTimeAnalysis: {
    avgWaitTime: number;
    yoyChange: number;
    momChange: number;
    peakHours: string[];
  };
  complaintDistribution: {
    category: string;
    count: number;
    percentage: number;
  }[];
  deviceFailureRate: {
    deviceType: string;
    failureCount: number;
    totalCount: number;
    rate: number;
  }[];
  recommendations: string[];
}

export interface Report {
  id: string;
  title: string;
  period: string;
  generatedAt: string;
  scope: 'national' | 'city' | 'branch';
  scopeId?: string;
  content: ReportContent;
}
