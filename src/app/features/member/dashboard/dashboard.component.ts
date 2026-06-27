import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { LogService } from '../../../core/services/log.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ScorePillComponent } from '../../../shared/components/score-pill/score-pill.component';
import { DailyLogResponse } from '../../../core/models/daily-log.model';
import { KpiReport } from '../../../core/models/kpi-report.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, ScorePillComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-1">Good {{ greeting }}, {{ firstName }}</h2>
      <p class="text-sm text-gray-500 mb-6">{{ today }}</p>

      <!-- Late reminder banner -->
      <div *ngIf="showReminder && !todayLogs().length"
        class="mb-5 flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
        <span class="text-red-500 text-lg">🔔</span>
        <p class="text-sm font-medium text-red-700">It's past 8 PM — don't forget to submit today's log</p>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">KPI Score</p>
          <app-score-pill [score]="kpi()?.totalScore ?? null" />
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">Days logged</p>
          <p class="text-2xl font-semibold text-gray-900">{{ monthLogs().length }}</p>
          <p class="text-xs text-gray-400">this month</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm col-span-2 sm:col-span-1">
          <p class="text-xs text-gray-500 mb-1">Status</p>
          <span class="text-sm font-semibold" [ngClass]="statusClass">{{ statusLabel }}</span>
        </div>
      </div>

      <!-- Today's tasks section -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-6">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-semibold text-gray-900">
            Today's tasks
            <span *ngIf="todayLogs().length" class="ml-1 text-xs text-gray-400 font-normal">({{ todayLogs().length }})</span>
          </p>
          <a routerLink="/member/log"
            class="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
            + Add task
          </a>
        </div>

        <!-- No tasks yet -->
        <p *ngIf="!todayLogs().length" class="text-xs text-gray-400 italic">No tasks submitted yet today.</p>

        <!-- Task cards -->
        <div class="space-y-2">
          <div *ngFor="let log of todayLogs()"
            class="flex items-start justify-between gap-3 bg-gray-50 rounded-lg p-3 border border-gray-100">
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-700 truncate">{{ log.projectName ?? 'No project' }}</p>
              <p class="text-xs text-gray-500 line-clamp-2 mt-0.5">{{ log.tasksDescription }}</p>
              <div class="flex gap-1 mt-1 flex-wrap">
                <span *ngFor="let a of log.activities" class="text-xs bg-white border border-gray-200 text-gray-600 px-1.5 py-0.5 rounded">{{ a.label }}</span>
              </div>
            </div>
            <div class="flex flex-col items-end gap-1 shrink-0">
              @if (log.rating) {
                <span class="text-amber-400 text-xs">{{ starStr(log.rating.rating) }}</span>
                <span class="text-xs text-gray-400 italic">Rated</span>
              } @else {
                <button (click)="editTask(log)"
                  class="text-xs text-primary hover:underline font-medium">Edit</button>
                <span class="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">Pending</span>
              }
            </div>
          </div>
        </div>
      </div>

      <!-- Recent logs -->
      <h3 class="text-sm font-semibold text-gray-700 mb-3">Recent logs</h3>
      <div class="space-y-2">
        <div *ngFor="let log of recentLogs" class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div class="flex items-center justify-between mb-1">
            <span class="text-sm font-medium text-gray-900">{{ log.logDate | date:'EEE, d MMM' }}</span>
            <span *ngIf="log.rating" class="text-amber-400 text-sm">{{ starStr(log.rating.rating) }}</span>
            <span *ngIf="!log.rating" class="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Awaiting rating</span>
          </div>
          <p class="text-xs text-gray-500 truncate">{{ log.projectName ?? 'No project' }}</p>
          <p class="text-xs text-gray-600 mt-1 line-clamp-2">{{ log.tasksDescription }}</p>
        </div>
        <p *ngIf="!recentLogs.length && !loading()" class="text-sm text-gray-400 text-center py-4">No logs yet this month.</p>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private readonly logService = inject(LogService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  monthLogs  = signal<DailyLogResponse[]>([]);
  todayLogs  = signal<DailyLogResponse[]>([]);
  kpi        = signal<KpiReport | null>(null);
  loading    = signal(true);

  get firstName() { return (this.auth.userName ?? '').split(' ')[0]; }
  get today() { return new Date().toLocaleDateString('en-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }); }
  get greeting() { const h = new Date().getHours(); return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening'; }
  get showReminder() { return new Date().getHours() >= 20; }
  get recentLogs() { return [...this.monthLogs()].sort((a, b) => b.logDate.localeCompare(a.logDate)).slice(0, 5); }

  get statusLabel(): string {
    const score = this.kpi()?.totalScore;
    if (!score) return 'Pending';
    if (score >= 75) return 'On track';
    if (score >= 55) return 'Watch out';
    return 'At risk';
  }

  get statusClass(): string {
    const score = this.kpi()?.totalScore;
    if (!score) return 'text-gray-400';
    if (score >= 75) return 'text-green-600';
    if (score >= 55) return 'text-amber-600';
    return 'text-red-600';
  }

  starStr(rating: number): string { return '★'.repeat(rating) + '☆'.repeat(5 - rating); }

  editTask(log: DailyLogResponse): void {
    this.router.navigate(['/member/log'], {
      queryParams: { editId: log.id },
      state: { log }
    });
  }

  ngOnInit(): void {
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const quarter = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;

    this.logService.getMyLogs(month).subscribe(logs => { this.monthLogs.set(logs); this.loading.set(false); });
    this.logService.getTodayLogs().subscribe(logs => this.todayLogs.set(logs));
    this.logService.getMyKpi(quarter).subscribe(kpi => this.kpi.set(kpi));
  }
}
