import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-surface flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-sm border border-gray-200 w-full max-w-sm p-8">
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary mb-4">
            <span class="text-white text-xl font-bold">C</span>
          </div>
          <h1 class="text-xl font-semibold text-gray-900">CIC Performance Portal</h1>
          <p class="text-sm text-gray-500 mt-1">Sign in with your work email</p>
        </div>

        <form (ngSubmit)="submit()" #f="ngForm">
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-1">Work email</label>
            <input
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              placeholder="you@cic.ae"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              [class.border-danger]="domainError()"
            />
            <p *ngIf="domainError()" class="text-xs text-danger mt-1">
              Only &#64;cic.ae email addresses can access this portal
            </p>
          </div>

          <button
            type="submit"
            [disabled]="loading() || !email"
            class="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading() ? 'Sending…' : 'Send login code' }}
          </button>
        </form>

        <p *ngIf="error()" class="mt-3 text-xs text-danger text-center">{{ error() }}</p>
      </div>
    </div>
  `
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = '';
  loading = signal(false);
  error = signal('');

  domainError(): boolean {
    return !!this.email && !this.email.toLowerCase().endsWith('@cic.ae');
  }

  submit(): void {
    if (this.domainError() || !this.email) return;
    this.loading.set(true);
    this.error.set('');
    this.auth.requestOtp(this.email).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigate(['/verify-otp'], { state: { email: this.email } });
      },
      error: err => {
        this.loading.set(false);
        this.error.set(err?.error?.error ?? 'Something went wrong. Please try again.');
      }
    });
  }
}
