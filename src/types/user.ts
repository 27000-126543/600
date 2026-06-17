export type UserRole = 'headquarters' | 'branch' | 'subbranch';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  cityId?: string;
  branchId?: string;
  permissions: string[];
}
