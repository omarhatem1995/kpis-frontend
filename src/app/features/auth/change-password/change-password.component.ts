import { Component, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="max-w-md mx-auto">
      <h1 class="text-xl font-semibold text-gray-900 mb-6">Change Password</h1>

      <div class="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
          <input
            type="password"
            [(ngModel)]="currentPassword"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Enter current password"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">New Password</label>
          <input
            type="password"
            [(ngModel)]="newPassword"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="At least 6 characters"
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
          <input
            type="password"
            [(ngModel)]="confirmPassword"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            placeholder="Repeat new password"
          />
        </div>

        @if (error()) {
          <p class="text-sm text-red-600">{{ error() }}</p>
        }
        @if (success()) {
          <p class="text-sm text-green-600">Password changed successfully.</p>
        }

        <button
          (click)="submit()"
          [disabled]="loading()"
          class="w-full bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {{ loading() ? 'Saving...' : 'Change Password' }}
        </button>
      </div>
    </div>
  `
})
export class ChangePasswordComponent {
  private readonly auth = inject(AuthService);

  currentPassword = '';
  newPassword = '';
  confirmPassword = '';

  loading = signal(false);
  error = signal('');
  success = signal(false);

  submit(): void {
    this.error.set('');
    this.success.set(false);

    if (!this.currentPassword || !this.newPassword || !this.confirmPassword) {
      this.error.set('All fields are required.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.error.set('New password must be at least 6 characters.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.error.set('New passwords do not match.');
      return;
    }

    this.loading.set(true);
    this.auth.changePassword(this.currentPassword, this.newPassword).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message ?? 'Failed to change password.');
      }
    });
  }
}
