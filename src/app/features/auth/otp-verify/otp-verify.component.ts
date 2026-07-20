import { Component, inject, signal, ViewChild, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { OtpInputComponent } from '../../../shared/components/otp-input/otp-input.component';

@Component({
  selector: 'app-otp-verify',
  standalone: true,
  imports: [CommonModule, OtpInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-surface flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
            <span class="text-white text-xl">✉</span>
          </div>
          <h1 class="text-xl font-semibold text-gray-900">Check your email</h1>
          <p class="text-sm text-gray-500 mt-1">
            We sent a 6-digit code to<br>
            <span class="font-medium text-gray-700">{{ email }}</span>
          </p>
        </div>

        <app-otp-input #otpInput (complete)="onComplete($event)" />

        <p *ngIf="error()" class="mt-4 text-xs text-danger text-center">{{ error() }}</p>
        <p *ngIf="loading()" class="mt-4 text-xs text-gray-400 text-center">Verifying…</p>

        <div class="mt-6 text-center">
          <button
            (click)="resend()"
            [disabled]="resendCooldown() > 0"
            class="text-sm text-primary hover:underline disabled:text-gray-400 disabled:no-underline"
          >
            {{ resendCooldown() > 0 ? 'Resend in ' + resendCooldown() + 's' : 'Resend code' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class OtpVerifyComponent implements OnInit {
  @ViewChild('otpInput') otpInput!: OtpInputComponent;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  loading = signal(false);
  error = signal('');
  resendCooldown = signal(0);

  ngOnInit(): void {
    const state = history.state as { email?: string };
    this.email = state.email ?? '';
    if (!this.email) this.router.navigate(['/login']);
  }

  onComplete(otp: string): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.verifyOtp(this.email, otp).subscribe({
      next: res => {
        const isMemberLike = res.role === 'MEMBER' || res.role === 'TEAM_LEAD';
        if (isMemberLike) {
          this.auth.loadWfhSchedule().subscribe({
            next: () => this.router.navigate([res.role === 'TEAM_LEAD' ? '/manager/overview' : '/member/dashboard']),
            error: () => this.router.navigate([res.role === 'TEAM_LEAD' ? '/manager/overview' : '/member/dashboard'])
          });
        } else {
          this.router.navigate(['/manager/overview']);
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Incorrect code. Please try again.');
        this.otpInput.reset();
      }
    });
  }

  resend(): void {
    this.auth.requestOtp(this.email).subscribe({
      next: () => {
        this.error.set('');
        this.otpInput.reset();
        this.startCooldown();
      }
    });
  }

  private startCooldown(): void {
    this.resendCooldown.set(60);
    const interval = setInterval(() => {
      this.resendCooldown.update(v => {
        if (v <= 1) { clearInterval(interval); return 0; }
        return v - 1;
      });
    }, 1000);
  }
}
