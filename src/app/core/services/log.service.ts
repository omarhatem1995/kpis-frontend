import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DailyLogRequest, DailyLogResponse, ActivityItem, ProjectItem, LogComment } from '../models/daily-log.model';
import { KpiReport } from '../models/kpi-report.model';
import { ApiResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getActivities(): Observable<ActivityItem[]> {
    return this.http.get<ApiResponse<ActivityItem[]>>(`${this.base}/activities`).pipe(map(r => r.data));
  }

  getProjects(): Observable<ProjectItem[]> {
    return this.http.get<ApiResponse<ProjectItem[]>>(`${this.base}/projects`).pipe(map(r => r.data));
  }

  submitLog(req: DailyLogRequest): Observable<DailyLogResponse> {
    return this.http.post<ApiResponse<DailyLogResponse>>(`${this.base}/logs`, req).pipe(map(r => r.data));
  }

  getMyLogs(month: string): Observable<DailyLogResponse[]> {
    return this.http.get<ApiResponse<DailyLogResponse[]>>(`${this.base}/logs/my`, {
      params: new HttpParams().set('month', month)
    }).pipe(map(r => r.data));
  }

  getTodayLogs(): Observable<DailyLogResponse[]> {
    return this.http.get<ApiResponse<DailyLogResponse[]>>(`${this.base}/logs/my/today`).pipe(map(r => r.data));
  }

  updateLog(logId: number, req: DailyLogRequest): Observable<DailyLogResponse> {
    return this.http.put<ApiResponse<DailyLogResponse>>(`${this.base}/logs/${logId}`, req).pipe(map(r => r.data));
  }

  getMyKpi(quarter: string): Observable<KpiReport> {
    return this.http.get<ApiResponse<KpiReport>>(`${this.base}/logs/my/kpi`, {
      params: new HttpParams().set('quarter', quarter)
    }).pipe(map(r => r.data));
  }

  getComments(logId: number): Observable<LogComment[]> {
    return this.http.get<ApiResponse<LogComment[]>>(`${this.base}/logs/${logId}/comments`).pipe(map(r => r.data));
  }

  addComment(logId: number, body: string): Observable<LogComment> {
    return this.http.post<ApiResponse<LogComment>>(`${this.base}/logs/${logId}/comments`, { body }).pipe(map(r => r.data));
  }

  updateComment(logId: number, commentId: number, body: string): Observable<LogComment> {
    return this.http.patch<ApiResponse<LogComment>>(`${this.base}/logs/${logId}/comments/${commentId}`, { body }).pipe(map(r => r.data));
  }
}
