import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  downloadMemberExcel(userId: number, quarter: string): Observable<Blob> {
    return this.http.get(`${this.base}/export/member/${userId}`, {
      params: new HttpParams().set('quarter', quarter),
      responseType: 'blob'
    });
  }

  downloadTeamZip(quarter: string): Observable<Blob> {
    return this.http.get(`${this.base}/export/team`, {
      params: new HttpParams().set('quarter', quarter),
      responseType: 'blob'
    });
  }

  triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }
}
