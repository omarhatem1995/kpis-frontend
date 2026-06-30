import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, MemberSummary, UpdateMemberRequest, CreateMemberRequest, WfhScheduleResponse, DayOfWeek } from '../models/user.model';
import { DailyLogResponse } from '../models/daily-log.model';
import { KpiReport } from '../models/kpi-report.model';
import { LeaveRequestResponse, LeaveRequestCreate, LeaveReviewRequest } from '../models/leave-request.model';
import { WeekendConfigResponse, WfhMonitorEntry } from '../models/weekend-config.model';

@Injectable({ providedIn: 'root' })
export class MemberService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getMembers(): Observable<MemberSummary[]> {
    return this.http.get<ApiResponse<MemberSummary[]>>(`${this.base}/manager/members`).pipe(map(r => r.data));
  }

  getTeammates(): Observable<MemberSummary[]> {
    return this.http.get<ApiResponse<MemberSummary[]>>(`${this.base}/member/teammates`).pipe(map(r => r.data));
  }

  createMember(req: CreateMemberRequest): Observable<MemberSummary> {
    return this.http.post<ApiResponse<MemberSummary>>(`${this.base}/manager/members`, req).pipe(map(r => r.data));
  }

  getMemberLogs(userId: number, month: string): Observable<DailyLogResponse[]> {
    return this.http.get<ApiResponse<DailyLogResponse[]>>(`${this.base}/manager/members/${userId}/logs`, {
      params: new HttpParams().set('month', month)
    }).pipe(map(r => r.data));
  }

  getMemberKpi(userId: number, quarter: string): Observable<KpiReport> {
    return this.http.get<ApiResponse<KpiReport>>(`${this.base}/manager/members/${userId}/kpi`, {
      params: new HttpParams().set('quarter', quarter)
    }).pipe(map(r => r.data));
  }

  updateMember(userId: number, req: UpdateMemberRequest): Observable<MemberSummary> {
    return this.http.patch<ApiResponse<MemberSummary>>(`${this.base}/manager/members/${userId}`, req).pipe(map(r => r.data));
  }

  setMemberPassword(userId: number, password: string): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${this.base}/manager/members/${userId}/password`, { password }).pipe(map(r => r.data));
  }

  getMemberWfhSchedule(userId: number): Observable<WfhScheduleResponse> {
    return this.http.get<ApiResponse<WfhScheduleResponse>>(`${this.base}/manager/members/${userId}/wfhSchedule`).pipe(map(r => r.data));
  }

  updateMemberWfhSchedule(userId: number, days: DayOfWeek[]): Observable<WfhScheduleResponse> {
    return this.http.put<ApiResponse<WfhScheduleResponse>>(`${this.base}/manager/members/${userId}/wfhSchedule`, { days }).pipe(map(r => r.data));
  }

  getWfhMonitor(month: string): Observable<WfhMonitorEntry[]> {
    return this.http.get<ApiResponse<WfhMonitorEntry[]>>(`${this.base}/manager/wfhMonitor`, {
      params: new HttpParams().set('month', month)
    }).pipe(map(r => r.data));
  }

  getWeekendConfig(): Observable<WeekendConfigResponse> {
    return this.http.get<ApiResponse<WeekendConfigResponse>>(`${this.base}/manager/weekendConfig`).pipe(map(r => r.data));
  }

  updateGlobalWeekends(days: DayOfWeek[]): Observable<{ days: DayOfWeek[] }> {
    return this.http.put<ApiResponse<{ days: DayOfWeek[] }>>(`${this.base}/manager/weekendConfig/global`, { days }).pipe(map(r => r.data));
  }

  updateUserWeekendOverride(userId: number, extraDays: DayOfWeek[]): Observable<{ userId: number; extraDays: DayOfWeek[] }> {
    return this.http.put<ApiResponse<{ userId: number; extraDays: DayOfWeek[] }>>(`${this.base}/manager/weekendConfig/user/${userId}`, { extraDays }).pipe(map(r => r.data));
  }

  getLeaveRequests(status?: string): Observable<LeaveRequestResponse[]> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get<ApiResponse<LeaveRequestResponse[]>>(`${this.base}/manager/leaveRequests`, { params }).pipe(map(r => r.data));
  }

  reviewLeaveRequest(id: number, req: LeaveReviewRequest): Observable<LeaveRequestResponse> {
    return this.http.patch<ApiResponse<LeaveRequestResponse>>(`${this.base}/manager/leaveRequests/${id}`, req).pipe(map(r => r.data));
  }

  getMyLeaveRequests(): Observable<LeaveRequestResponse[]> {
    return this.http.get<ApiResponse<LeaveRequestResponse[]>>(`${this.base}/member/leaveRequests`).pipe(map(r => r.data));
  }

  submitLeaveRequest(req: LeaveRequestCreate): Observable<LeaveRequestResponse> {
    return this.http.post<ApiResponse<LeaveRequestResponse>>(`${this.base}/member/leaveRequests`, req).pipe(map(r => r.data));
  }
}
