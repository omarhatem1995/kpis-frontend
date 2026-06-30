import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../core/services/member.service';
import { LeaveRequestResponse } from '../../../core/models/leave-request.model';

@Component({
  selector: 'app-leave-request',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-6">Leave Requests</h2>

      <!-- New request form -->
      <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-6">
        <h3 class="text-sm font-semibold text-gray-700 mb-4">Request leave</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Start date</label>
            <input type="date" [(ngModel)]="startDate" [min]="minDate"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">End date</label>
            <input type="date" [(ngModel)]="endDate" [min]="startDate || minDate"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div class="mb-4">
          <label class="block text-xs font-medium text-gray-600 mb-1">Reason <span class="text-gray-400 font-normal">(optional)</span></label>
          <textarea [(ngModel)]="reason" rows="2" placeholder="Brief reason for leave…"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none">
          </textarea>
        </div>
        <p *ngIf="formError()" class="text-xs text-danger mb-3">{{ formError() }}</p>
        <button (click)="submit()" [disabled]="submitting()"
          class="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {{ submitting() ? 'Submitting…' : 'Submit request' }}
        </button>
      </div>

      <!-- Past requests -->
      <h3 class="text-sm font-semibold text-gray-700 mb-3">My requests</h3>
      <div class="space-y-3">
        <div *ngFor="let req of requests()" class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-gray-900">
              {{ req.startDate | date:'d MMM yyyy' }} — {{ req.endDate | date:'d MMM yyyy' }}
            </p>
            <p *ngIf="req.reason" class="text-xs text-gray-500 mt-0.5">{{ req.reason }}</p>
            <p *ngIf="req.managerNote" class="text-xs text-gray-500 mt-1 italic">"{{ req.managerNote }}"</p>
          </div>
          <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0" [ngClass]="statusClass(req.status)">
            {{ req.status }}
          </span>
        </div>
        <p *ngIf="!requests().length && !loading()" class="text-sm text-gray-400 text-center py-6">No leave requests yet.</p>
      </div>
    </div>
  `
})
export class LeaveRequestComponent implements OnInit {
  private readonly memberService = inject(MemberService);

  requests = signal<LeaveRequestResponse[]>([]);
  loading = signal(true);
  submitting = signal(false);
  formError = signal('');

  startDate = '';
  endDate = '';
  reason = '';

  get minDate(): string {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  }

  statusClass(status: string): string {
    return { PENDING: 'bg-amber-100 text-amber-800', APPROVED: 'bg-green-100 text-green-800', REJECTED: 'bg-red-100 text-red-800' }[status] ?? '';
  }

  submit(): void {
    this.formError.set('');
    if (!this.startDate || !this.endDate) { this.formError.set('Please select both start and end dates.'); return; }
    if (this.startDate > this.endDate) { this.formError.set('End date must be after start date.'); return; }
    this.submitting.set(true);
    this.memberService.submitLeaveRequest({ startDate: this.startDate, endDate: this.endDate, reason: this.reason }).subscribe({
      next: req => {
        this.requests.update(r => [req, ...r]);
        this.startDate = '';
        this.endDate = '';
        this.reason = '';
        this.submitting.set(false);
      },
      error: err => {
        this.submitting.set(false);
        this.formError.set(err?.error?.message ?? 'Failed to submit request.');
      }
    });
  }

  ngOnInit(): void {
    this.memberService.getMyLeaveRequests().subscribe(r => {
      this.requests.set(r);
      this.loading.set(false);
    });
  }
}
