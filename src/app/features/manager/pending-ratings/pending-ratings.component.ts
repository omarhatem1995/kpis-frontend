import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingService } from '../../../core/services/rating.service';
import { DailyLogResponse } from '../../../core/models/daily-log.model';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { LogCommentsComponent } from '../../../shared/components/log-comments/log-comments.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

interface RatingState { rating: number; comment: string; saving: boolean; }

@Component({
  selector: 'app-pending-ratings',
  standalone: true,
  imports: [CommonModule, FormsModule, StarRatingComponent, AvatarComponent, LogCommentsComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <app-loading *ngIf="loading()" />
      <ng-container *ngIf="!loading()">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">Pending Ratings</h2>

      <div *ngIf="!logs().length" class="text-center py-12">
        <p class="text-2xl mb-2">✅</p>
        <p class="text-sm font-medium text-gray-700">All caught up — nothing to rate</p>
        <p class="text-xs text-gray-400 mt-1">Check back after team members submit their logs</p>
      </div>

      <div class="space-y-4">
        <div *ngFor="let log of logs()" class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <!-- Header -->
          <div class="flex items-start gap-3 mb-3">
            <app-avatar [name]="log.memberName ?? ''" size="md" />
            <div class="flex-1">
              <div class="flex items-center gap-2 justify-between">
                <p class="text-sm font-semibold text-gray-900">{{ log.memberName }}</p>
                <div class="flex items-center gap-2">
                  <span *ngIf="log.isUnscheduledWfh" class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Unscheduled WFH</span>
                  <span *ngIf="log.location === 'WFH' && !log.isUnscheduledWfh" class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">WFH</span>
                </div>
              </div>
              <p class="text-xs text-gray-500">{{ log.logDate | date:'EEEE, d MMMM yyyy' }} · {{ log.projectName }}</p>
            </div>
          </div>

          <!-- Activities -->
          <div class="flex flex-wrap gap-1 mb-3">
            <span *ngFor="let a of log.activities" class="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{{ a.label }}</span>
          </div>

          <!-- Tasks -->
          <p class="text-sm text-gray-700 mb-2">{{ log.tasksDescription }}</p>

          <!-- Blockers -->
          <div *ngIf="log.blockers" class="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
            <span class="text-amber-500 text-sm shrink-0">⚠</span>
            <p class="text-xs text-amber-800">{{ log.blockers }}</p>
          </div>

          <!-- Self-learning & collaborators -->
          <div class="flex flex-wrap gap-2 mb-4">
            <span *ngIf="log.selfLearning !== 'NONE'" class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">📚 {{ log.selfLearning }}</span>
          </div>

          <!-- Comments thread -->
          <app-log-comments [logId]="log.id" [initialComments]="log.comments" [isRated]="false" />

          <!-- Rating widget -->
          <div class="border-t border-gray-100 pt-4 mt-3">
            <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rate this log</p>
            <app-star-rating
              [rating]="stateFor(log.id).rating"
              (ratingChange)="stateFor(log.id).rating = $event"
            />
            <textarea
              [(ngModel)]="stateFor(log.id).comment"
              rows="2"
              placeholder="Optional comment…"
              class="w-full mt-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            ></textarea>
            <button
              (click)="saveRating(log)"
              [disabled]="stateFor(log.id).rating === 0 || stateFor(log.id).saving"
              class="mt-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            >{{ stateFor(log.id).saving ? 'Saving…' : 'Save rating' }}</button>
          </div>
        </div>
      </div>
      </ng-container>
    </div>
  `
})
export class PendingRatingsComponent implements OnInit {
  private readonly ratingService = inject(RatingService);

  logs = signal<DailyLogResponse[]>([]);
  loading = signal(true);
  private ratingStates = new Map<number, RatingState>();

  stateFor(id: number): RatingState {
    if (!this.ratingStates.has(id)) this.ratingStates.set(id, { rating: 0, comment: '', saving: false });
    return this.ratingStates.get(id)!;
  }

  saveRating(log: DailyLogResponse): void {
    const state = this.stateFor(log.id);
    state.saving = true;
    this.ratingService.submitRating(log.id, state.rating, state.comment).subscribe({
      next: () => this.logs.update(ls => ls.filter(l => l.id !== log.id)),
      error: () => { state.saving = false; }
    });
  }

  ngOnInit(): void {
    this.ratingService.getPendingRatings().subscribe(logs => {
      this.logs.set(logs);
      this.loading.set(false);
    });
  }
}
