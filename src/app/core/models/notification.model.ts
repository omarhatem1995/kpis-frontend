export type NotificationType =
  | 'TASK_COMMENT'
  | 'TASK_MENTION'
  | 'TASK_COLLABORATION'
  | 'LEAVE_REQUEST'
  | 'WFH_REQUEST'
  | 'PASSWORD_CHANGE'
  | 'TASK_RATING_SUBMITTED'
  | 'RATING_WARNING'
  | 'MANAGER_NOTIFICATION'
  | 'TEAM_LEAD_NOTIFICATION';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  referenceId: number | null;
  seen: boolean;
  seenAt: string | null;
  clicked: boolean;
  clickedAt: string | null;
  createdAt: string;
}

export interface BroadcastRequest {
  targetUserId?: number;
  title: string;
  body: string;
}
