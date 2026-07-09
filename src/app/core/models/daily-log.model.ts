export type SelfLearning = 'NONE' | 'COURSE' | 'CERT' | 'DOCS' | 'POC' | 'ARTICLE';
export type Location = 'OFFICE' | 'WFH';

export interface ActivityItem {
  key: string;
  label: string;
  section: string;
}

export interface CollaboratorRef {
  userId: number;
  name: string;
}

export interface RatingSummary {
  id: number;
  rating: number;
  comment: string | null;
  ratedAt: string;
  isAutomated: boolean;
}

export interface DailyLogResponse {
  id: number;
  userId: number;
  memberName: string;
  logDate: string;
  projectId: number | null;
  projectName: string | null;
  activities: ActivityItem[];
  tasksDescription: string;
  blockers: string | null;
  selfLearning: SelfLearning;
  selfLearningNote: string | null;
  location: Location;
  isUnscheduledWfh: boolean;
  submittedAt: string;
  memberId?: number;
  rating: RatingSummary | null;
  collaborators: CollaboratorRef[];
  comments: LogComment[];
}

export interface PendingRatingDto {
  memberId: number;
  memberName: string;
  logDate: string;
  logs: DailyLogResponse[];
}

export interface DailyRatingResponse {
  id: number;
  memberId: number;
  memberName: string;
  logDate: string;
  managerId: number;
  rating: number;
  comment: string | null;
  isAutomated: boolean;
  ratedAt: string;
}

export interface DailyLogRequest {
  logDate: string;
  projectId: number | null;
  activities: string[];
  tasksDescription: string;
  blockers: string;
  selfLearning: SelfLearning;
  selfLearningNote: string;
  location: Location;
  collaboratorIds: number[];
}

export type ProjectCategory = 'DEVELOPMENT' | 'REFACTOR' | 'SELF_STUDY';

export interface LogComment {
  id: number;
  logId: number;
  authorId: number;
  authorName: string;
  authorRole: 'MEMBER' | 'TEAM_LEAD' | 'MANAGER';
  body: string;
  createdAt: string;
}

export interface ProjectItem {
  id: number;
  name: string;
  category: ProjectCategory | null;
  status: 'INITIATION' | 'IN_PROGRESS' | 'FINISHED';
}
