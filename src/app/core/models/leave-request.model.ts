export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface LeaveRequestResponse {
  id: number;
  userId: number;
  memberName: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  managerNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface LeaveRequestCreate {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveReviewRequest {
  status: 'APPROVED' | 'REJECTED';
  managerNote: string;
}
