import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse, AuthResponse, DayOfWeek, UserRole, WfhScheduleResponse } from '../models/user.model';
import { FcmService } from '../services/fcm.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly fcm = inject(FcmService);

  private readonly TOKEN_KEY = 'cic_token';
  private readonly USER_KEY = 'cic_user';

  private readonly _role$ = new BehaviorSubject<UserRole | null>(this.storedRole);
  readonly role$ = this._role$.asObservable();

  private wfhDays: DayOfWeek[] = [];

  get token(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  get role(): UserRole | null {
    return this._role$.value;
  }

  get userId(): number | null {
    const u = localStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u).userId : null;
  }

  get userName(): string | null {
    const u = localStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u).name : null;
  }

  get wfhSchedule(): DayOfWeek[] {
    return this.wfhDays;
  }

  private get storedRole(): UserRole | null {
    const u = localStorage.getItem(this.USER_KEY);
    return u ? JSON.parse(u).role : null;
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiBaseUrl}/auth/login`, { email, password }).pipe(
      map(r => r.data),
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify({ userId: res.userId, name: res.name, role: res.role }));
        this._role$.next(res.role);
        this.fcm.requestPermissionAndRegister();
      })
    );
  }

  requestOtp(email: string): Observable<string> {
    return this.http.post<ApiResponse<null>>(`${environment.apiBaseUrl}/auth/requestOtp`, { email }).pipe(map(r => r.message));
  }

  verifyOtp(email: string, otp: string): Observable<AuthResponse> {
    return this.http.post<ApiResponse<AuthResponse>>(`${environment.apiBaseUrl}/auth/verifyOtp`, { email, otp }).pipe(
      map(r => r.data),
      tap(res => {
        localStorage.setItem(this.TOKEN_KEY, res.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify({ userId: res.userId, name: res.name, role: res.role }));
        this._role$.next(res.role);
        this.fcm.requestPermissionAndRegister();
      })
    );
  }

  changePassword(currentPassword: string, newPassword: string): Observable<void> {
    return this.http.put<ApiResponse<void>>(`${environment.apiBaseUrl}/auth/changePassword`, { currentPassword, newPassword }).pipe(
      map(() => void 0)
    );
  }

  loadWfhSchedule(): Observable<WfhScheduleResponse> {
    return this.http.get<ApiResponse<WfhScheduleResponse>>(`${environment.apiBaseUrl}/member/wfhSchedule`).pipe(
      map(r => r.data),
      tap(res => { this.wfhDays = res.days; })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.wfhDays = [];
    this._role$.next(null);
    this.router.navigate(['/login']);
  }
}
