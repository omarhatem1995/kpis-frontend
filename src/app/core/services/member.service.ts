import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { MemberSummary, UpdateMemberRequest, WfhScheduleResponse, DayOfWeek } from '../models/user.model';
import { DailyLogResponse } from '../models/daily-log.model';
import { KpiReport } from '../models/kpi-report.model';
import { LeaveRequestResponse, LeaveRequestCreate, LeaveReviewRequest } from '../models/leave-request.model';
import { WeekendConfigResponse, WfhMonitorEntry } from '../models/weekend-config.model';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getMembers(): Observable<MemberSummary[]> {
    return this.http.get<MemberSummary[]>(`${this.base}/manager/members`);
  }

  getTeammates(): Observable<MemberSummary[]> {
    return this.http.get<MemberSummary[]>(`${this.base}/member/teammates`);
  }

  getMemberLogs(userId: number, month: string): Observable<DailyLogResponse[]> {
    return this.http.get<DailyLogResponse[]>(`${this.base}/manager/members/${userId}/logs`, {
      params: new HttpParams().set('month', month)
    });
  }

  getMemberKpi(userId: number, quarter: string): Observable<KpiReport> {
    return this.http.get<KpiReport>(`${this.base}/manager/members/${userId}/kpi`, {
      params: new HttpParams().set('quarter', quarter)
    });
  }

  updateMember(userId: number, req: UpdateMemberRequest): Observable<MemberSummary> {
    return this.http.patch<MemberSummary>(`${this.base}/manager/members/${userId}`, req);
  }

  setMemberPassword(userId: number, password: string): Observable<void> {
    return this.http.put<void>(`${this.base}/manager/members/${userId}/password`, { password });
  }

  getMemberWfhSchedule(userId: number): Observable<WfhScheduleResponse> {
    return this.http.get<WfhScheduleResponse>(`${this.base}/manager/members/${userId}/wfhSchedule`);
  }

  updateMemberWfhSchedule(userId: number, days: DayOfWeek[]): Observable<WfhScheduleResponse> {
    return this.http.put<WfhScheduleResponse>(`${this.base}/manager/members/${userId}/wfhSchedule`, { days });
  }

  getWfhMonitor(month: string): Observable<WfhMonitorEntry[]> {
    return this.http.get<WfhMonitorEntry[]>(`${this.base}/manager/wfhMonitor`, {
      params: new HttpParams().set('month', month)
    });
  }

  getWeekendConfig(): Observable<WeekendConfigResponse> {
    return this.http.get<WeekendConfigResponse>(`${this.base}/manager/weekendConfig`);
  }

  updateGlobalWeekends(days: DayOfWeek[]): Observable<{ days: DayOfWeek[] }> {
    return this.http.put<{ days: DayOfWeek[] }>(`${this.base}/manager/weekendConfig/global`, { days });
  }

  updateUserWeekendOverride(userId: number, extraDays: DayOfWeek[]): Observable<{ userId: number; extraDays: DayOfWeek[] }> {
    return this.http.put<{ userId: number; extraDays: DayOfWeek[] }>(`${this.base}/manager/weekendConfig/user/${userId}`, { extraDays });
  }

  getLeaveRequests(status?: string): Observable<LeaveRequestResponse[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<LeaveRequestResponse[]>(`${this.base}/manager/leaveRequests`, { params });
  }

  reviewLeaveRequest(id: number, req: LeaveReviewRequest): Observable<LeaveRequestResponse> {
    return this.http.patch<LeaveRequestResponse>(`${this.base}/manager/leaveRequests/${id}`, req);
  }

  getMyLeaveRequests(): Observable<LeaveRequestResponse[]> {
    return this.http.get<LeaveRequestResponse[]>(`${this.base}/member/leaveRequests`);
  }

  submitLeaveRequest(req: LeaveRequestCreate): Observable<LeaveRequestResponse> {
    return this.http.post<LeaveRequestResponse>(`${this.base}/member/leaveRequests`, req);
  }
}
