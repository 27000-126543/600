export interface Review {
  id: string;
  branchId: string;
  tellerId?: string;
  timestamp: string;
  score: 1 | 2 | 3 | 4 | 5;
  content: string;
  tags: string[];
}
