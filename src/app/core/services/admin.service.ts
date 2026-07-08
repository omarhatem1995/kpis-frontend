import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  resetAllLogs(): Observable<void> {
    return this.http.delete<ApiResponse<void>>(`${this.base}/api/v1/manager/admin/resetAllLogs`)
      .pipe(map(() => void 0));
  }
}
