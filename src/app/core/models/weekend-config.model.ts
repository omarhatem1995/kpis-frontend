import { DayOfWeek } from './user.model';

export interface UserWeekendOverride {
  userId: number;
  memberName: string;
  extraDays: DayOfWeek[];
}

export interface WeekendConfigResponse {
  globalDays: DayOfWeek[];
  userOverrides: UserWeekendOverride[];
}

export interface WfhMonitorEntry {
  userId: number;
  memberName: string;
  date: string;
  dayOfWeek: DayOfWeek;
  type: 'APPROVED' | 'UNSCHEDULED';
}
