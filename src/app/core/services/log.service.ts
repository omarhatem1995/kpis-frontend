import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DailyLogRequest, DailyLogResponse, ActivityItem, ProjectItem, LogComment } from '../models/daily-log.model';
import { KpiReport } from '../models/kpi-report.model';

@Injectable({ providedIn: 'root' })
export class LogService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getActivities(): Observable<ActivityItem[]> {
    return this.http.get<ActivityItem[]>(`${this.base}/activities`);
  }

  getProjects(): Observable<ProjectItem[]> {
    return this.http.get<ProjectItem[]>(`${this.base}/projects`);
  }

  submitLog(req: DailyLogRequest): Observable<DailyLogResponse> {
    return this.http.post<DailyLogResponse>(`${this.base}/logs`, req);
  }

  getMyLogs(month: string): Observable<DailyLogResponse[]> {
    return this.http.get<DailyLogResponse[]>(`${this.base}/logs/my`, { params: new HttpParams().set('month', month) });
  }

  getTodayLogs(): Observable<DailyLogResponse[]> {
    return this.http.get<DailyLogResponse[]>(`${this.base}/logs/my/today`);
  }

  updateLog(logId: number, req: DailyLogRequest): Observable<DailyLogResponse> {
    return this.http.put<DailyLogResponse>(`${this.base}/logs/${logId}`, req);
  }

  getMyKpi(quarter: string): Observable<KpiReport> {
    return this.http.get<KpiReport>(`${this.base}/logs/my/kpi`, { params: new HttpParams().set('quarter', quarter) });
  }

  getComments(logId: number): Observable<LogComment[]> {
    return this.http.get<LogComment[]>(`${this.base}/logs/${logId}/comments`);
  }

  addComment(logId: number, body: string): Observable<LogComment> {
    return this.http.post<LogComment>(`${this.base}/logs/${logId}/comments`, { body });
  }
}
