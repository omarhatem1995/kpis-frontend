import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DailyLogResponse, RatingSummary } from '../models/daily-log.model';
import { ApiResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getPendingRatings(): Observable<DailyLogResponse[]> {
    return this.http.get<ApiResponse<DailyLogResponse[]>>(`${this.base}/manager/ratings/pending`).pipe(map(r => r.data));
  }

  submitRating(logId: number, rating: number, comment: string): Observable<RatingSummary> {
    return this.http.post<ApiResponse<RatingSummary>>(`${this.base}/manager/ratings`, { logId, rating, comment }).pipe(map(r => r.data));
  }

  updateRating(ratingId: number, rating: number, comment: string): Observable<RatingSummary> {
    return this.http.patch<ApiResponse<RatingSummary>>(`${this.base}/manager/ratings/${ratingId}`, { rating, comment }).pipe(map(r => r.data));
  }
}
