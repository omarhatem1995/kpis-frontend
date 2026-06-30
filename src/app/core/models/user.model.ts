export interface ApiResponse<T> {
  data: T;
  message: string;
  status: boolean;
}

export type UserRole = 'MEMBER' | 'TEAM_LEAD' | 'MANAGER';
export type TeamName = 'Frontend' | 'Backend' | 'Testing' | 'Flutter' | 'Technical';
export type DayOfWeek = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export interface AuthResponse {
  token: string;
  role: UserRole;
  userId: number;
  name: string;
}

export interface MemberSummary {
  userId: number;
  name: string;
  email: string;
  role: UserRole;
  team: TeamName | null;
  module: string | null;
  isActive: boolean;
  teamLeadId: number | null;
  logCountThisMonth: number;
  avgRating: number | null;
  kpiTotal: number | null;
  unratedCount: number;
}

export interface WfhScheduleResponse {
  days: DayOfWeek[];
}

export interface UpdateMemberRequest {
  name?: string;
  team?: TeamName;
  module?: string;
  role?: UserRole;
  isActive?: boolean;
  teamLeadId?: number;
}

export interface CreateMemberRequest {
  name: string;
  email: string;
  password: string;
  team?: TeamName;
  module?: string;
  role?: UserRole;
  teamLeadId?: number;
}
