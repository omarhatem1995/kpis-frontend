import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse, ApiResponsePaging } from '../models/user.model';
import { AppNotification, BroadcastRequest } from '../models/notification.model';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  list(page = 0, size = 20): Observable<ApiResponsePaging<AppNotification[]>> {
    return this.http.get<ApiResponsePaging<AppNotification[]>>(
      `${this.base}/api/v1/member/notifications`, { params: { page, size } }
    );
  }

  unreadCount(): Observable<number> {
    return this.http.get<ApiResponse<number>>(`${this.base}/api/v1/member/notifications/unreadCount`)
      .pipe(map(r => r.data));
  }

  markSeen(id: number): Observable<AppNotification> {
    return this.http.patch<ApiResponse<AppNotification>>(
      `${this.base}/api/v1/member/notifications/${id}/seen`, {}
    ).pipe(map(r => r.data));
  }

  markClicked(id: number): Observable<AppNotification> {
    return this.http.patch<ApiResponse<AppNotification>>(
      `${this.base}/api/v1/member/notifications/${id}/clicked`, {}
    ).pipe(map(r => r.data));
  }

  markAllSeen(): Observable<void> {
    return this.http.patch<ApiResponse<void>>(
      `${this.base}/api/v1/member/notifications/markAllSeen`, {}
    ).pipe(map(() => void 0));
  }

  broadcast(req: BroadcastRequest): Observable<void> {
    return this.http.post<ApiResponse<void>>(
      `${this.base}/api/v1/manager/notifications/broadcast`, req
    ).pipe(map(() => void 0));
  }
}
