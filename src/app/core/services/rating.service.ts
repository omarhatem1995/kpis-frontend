import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DailyLogResponse, RatingSummary } from '../models/daily-log.model';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getPendingRatings(): Observable<DailyLogResponse[]> {
    return this.http.get<DailyLogResponse[]>(`${this.base}/manager/ratings/pending`);
  }

  submitRating(logId: number, rating: number, comment: string): Observable<RatingSummary> {
    return this.http.post<RatingSummary>(`${this.base}/manager/ratings`, { logId, rating, comment });
  }

  updateRating(ratingId: number, rating: number, comment: string): Observable<RatingSummary> {
    return this.http.patch<RatingSummary>(`${this.base}/manager/ratings/${ratingId}`, { rating, comment });
  }
}
