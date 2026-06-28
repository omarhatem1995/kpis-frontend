import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LogService } from '../../../core/services/log.service';
import { DailyLogResponse } from '../../../core/models/daily-log.model';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { LogCommentsComponent } from '../../../shared/components/log-comments/log-comments.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-log-history',
  standalone: true,
  imports: [CommonModule, FormsModule, StarRatingComponent, AvatarComponent, LogCommentsComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <app-loading *ngIf="loading()" />
      <ng-container *ngIf="!loading()">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">Log History</h2>
        <input type="month" [(ngModel)]="selectedMonth" (ngModelChange)="loadLogs()"
          class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <div *ngIf="success()" class="mb-4 flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
        <span class="text-green-500">✓</span>
        <p class="text-sm text-green-700 font-medium">Log submitted successfully!</p>
      </div>

      <div class="space-y-4">
        <div *ngFor="let log of logs()" class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div class="flex items-start justify-between mb-3">
            <div>
              <p class="text-sm font-semibold text-gray-900">{{ log.logDate | date:'EEEE, d MMMM yyyy' }}</p>
              <p class="text-xs text-gray-500">{{ log.projectName ?? 'No project' }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span *ngIf="log.isUnscheduledWfh" class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">Unscheduled WFH</span>
              <span *ngIf="log.location === 'WFH' && !log.isUnscheduledWfh" class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">WFH</span>
            </div>
          </div>

          <!-- Activities -->
          <div class="flex flex-wrap gap-1.5 mb-3">
            <span *ngFor="let a of log.activities"
              class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{{ a.label }}</span>
          </div>

          <!-- Tasks description -->
          <p class="text-sm text-gray-700 line-clamp-2 mb-2">{{ log.tasksDescription }}</p>

          <!-- Self-learning badge -->
          <span *ngIf="log.selfLearning !== 'NONE'"
            class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
            📚 {{ log.selfLearning }}{{ log.selfLearningNote ? ': ' + log.selfLearningNote : '' }}
          </span>

          <!-- Rating -->
          <div class="mt-3 pt-3 border-t border-gray-100">
            <div *ngIf="log.rating; else awaiting">
              <div class="flex items-center gap-2">
                <app-star-rating [rating]="log.rating.rating" [readonly]="true" />
                <span *ngIf="log.rating.isAutomated" class="text-xs text-gray-400 italic">(Automated)</span>
              </div>
              <p *ngIf="log.rating.comment" class="text-xs text-gray-500 mt-1 italic">"{{ log.rating.comment }}"</p>
            </div>
            <ng-template #awaiting>
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Awaiting rating</span>
                <button (click)="editLog(log)"
                  class="text-xs text-primary hover:underline font-medium">Edit</button>
              </div>
            </ng-template>
          </div>

          <!-- Comments thread -->
          <app-log-comments [logId]="log.id" />
        </div>

        <p *ngIf="!logs().length" class="text-sm text-gray-400 text-center py-8">
          No logs for {{ selectedMonth }}.
        </p>
      </div>
      </ng-container>
    </div>
  `
})
export class LogHistoryComponent implements OnInit {
  private readonly logService = inject(LogService);
  private readonly router = inject(Router);

  logs = signal<DailyLogResponse[]>([]);
  loading = signal(true);
  success = signal(false);

  selectedMonth: string;

  constructor() {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  ngOnInit(): void {
    const state = history.state as { success?: boolean };
    if (state.success) this.success.set(true);
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    this.logService.getMyLogs(this.selectedMonth).subscribe(logs => {
      this.logs.set([...logs].sort((a, b) => b.logDate.localeCompare(a.logDate)));
      this.loading.set(false);
    });
  }

  editLog(log: DailyLogResponse): void {
    this.router.navigate(['/member/log'], {
      queryParams: { editId: log.id },
      state: { log }
    });
  }
}
