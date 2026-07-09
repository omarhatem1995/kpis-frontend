export interface ApiResponse<T> {
  data: T;
  message: string;
  status: boolean;
}

export interface ApiResponsePaging<T> {
  data: T;
  message: string;
  status: boolean;
  pageSize: number;
  totalItems: number;
  nextPage: number;
  lastPage: boolean;
}

export type UserRole = 'MEMBER' | 'TEAM_LEAD' | 'MANAGER';
export type TeamName = 'TECHNICAL';
export type ModuleName = 'FRONTEND' | 'BACKEND' | 'TESTING' | 'FLUTTER';
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
  module: ModuleName | null;
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
  email?: string;
  team?: TeamName;
  module?: ModuleName;
  role?: UserRole;
  isActive?: boolean;
  teamLeadId?: number;
}

export interface CreateMemberRequest {
  name: string;
  email: string;
  password: string;
  team?: TeamName;
  module?: ModuleName;
  role?: UserRole;
  teamLeadId?: number;
}
