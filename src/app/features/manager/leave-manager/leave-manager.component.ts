import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../core/services/member.service';
import { LeaveRequestResponse, LeaveStatus } from '../../../core/models/leave-request.model';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-leave-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <app-loading *ngIf="loading()" />
      <ng-container *ngIf="!loading()">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">Leave Requests</h2>

      <!-- Filter tabs -->
      <div class="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        <button *ngFor="let tab of tabs" (click)="activeTab.set(tab.value); load()"
          class="px-4 py-1.5 rounded-md text-sm font-medium transition-colors"
          [class]="activeTab() === tab.value ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
          {{ tab.label }}
        </button>
      </div>

      <div class="space-y-3">
        <div *ngFor="let req of requests()" class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div class="flex items-start justify-between gap-4 mb-3">
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ req.memberName }}</p>
              <p class="text-sm text-gray-600">
                {{ req.startDate | date:'d MMM yyyy' }} → {{ req.endDate | date:'d MMM yyyy' }}
                <span class="text-xs text-gray-400 ml-1">({{ dayCount(req) }} day{{ dayCount(req) !== 1 ? 's' : '' }})</span>
              </p>
              <p *ngIf="req.reason" class="text-xs text-gray-500 mt-1">{{ req.reason }}</p>
            </div>
            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full shrink-0" [ngClass]="pillClass(req.status)">
              {{ req.status }}
            </span>
          </div>

          <p *ngIf="req.managerNote" class="text-xs text-gray-500 italic mb-3">"{{ req.managerNote }}"</p>

          <!-- Pending actions -->
          <div *ngIf="req.status === 'PENDING'" class="flex items-start gap-3 pt-3 border-t border-gray-100">
            <div class="flex-1">
              <input [(ngModel)]="noteFor[req.id]" type="text" placeholder="Manager note (optional)…"
                class="w-full border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
            <button (click)="review(req, 'APPROVED')"
              class="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
              Approve
            </button>
            <button (click)="review(req, 'REJECTED')"
              class="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors">
              Reject
            </button>
          </div>
        </div>

        <p *ngIf="!requests().length" class="text-sm text-gray-400 text-center py-8">No leave requests found.</p>
      </div>
      </ng-container>
    </div>
  `
})
export class LeaveManagerComponent implements OnInit {
  private readonly memberService = inject(MemberService);

  requests = signal<LeaveRequestResponse[]>([]);
  loading = signal(true);
  activeTab = signal<string>('');
  noteFor: Record<number, string> = {};

  tabs = [
    { value: '', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' }
  ];

  dayCount(req: LeaveRequestResponse): number {
    const diff = new Date(req.endDate).getTime() - new Date(req.startDate).getTime();
    return Math.round(diff / 86400000) + 1;
  }

  pillClass(status: LeaveStatus): string {
    return { PENDING: 'bg-amber-100 text-amber-800', APPROVED: 'bg-green-100 text-green-800', REJECTED: 'bg-red-100 text-red-800' }[status];
  }

  review(req: LeaveRequestResponse, status: 'APPROVED' | 'REJECTED'): void {
    this.memberService.reviewLeaveRequest(req.id, { status, managerNote: this.noteFor[req.id] ?? '' }).subscribe(updated => {
      this.requests.update(rs => rs.map(r => r.id === updated.id ? updated : r));
    });
  }

  load(): void {
    this.loading.set(true);
    const status = this.activeTab() || undefined;
    this.memberService.getLeaveRequests(status).subscribe(r => { this.requests.set(r); this.loading.set(false); });
  }

  ngOnInit(): void { this.load(); }
}
