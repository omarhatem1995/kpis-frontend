import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { DailyRatingResponse, PendingRatingDto } from '../models/daily-log.model';
import { ApiResponse } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class RatingService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiBaseUrl;

  getPendingRatings(): Observable<PendingRatingDto[]> {
    return this.http.get<ApiResponse<PendingRatingDto[]>>(`${this.base}/manager/ratings/pending`).pipe(map(r => r.data));
  }

  submitRating(memberId: number, logDate: string, rating: number, comment: string): Observable<DailyRatingResponse> {
    return this.http.post<ApiResponse<DailyRatingResponse>>(`${this.base}/manager/ratings`, { memberId, logDate, rating, comment }).pipe(map(r => r.data));
  }

  updateRating(ratingId: number, rating: number, comment: string): Observable<DailyRatingResponse> {
    return this.http.patch<ApiResponse<DailyRatingResponse>>(`${this.base}/manager/ratings/${ratingId}`, { rating, comment }).pipe(map(r => r.data));
  }
}
