import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RatingService } from '../../../core/services/rating.service';
import { PendingRatingDto, CollaboratorRef } from '../../../core/models/daily-log.model';
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

        <div *ngIf="!pending().length" class="text-center py-12">
          <p class="text-2xl mb-2">✅</p>
          <p class="text-sm font-medium text-gray-700">All caught up — nothing to rate</p>
          <p class="text-xs text-gray-400 mt-1">Check back after team members submit their logs</p>
        </div>

        <div class="space-y-6">
          <div *ngFor="let item of pending()" class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">

            <!-- Member + date header -->
            <div class="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
              <app-avatar [name]="item.memberName" size="md" />
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ item.memberName }}</p>
                <p class="text-xs text-gray-500">{{ item.logDate | date:'EEEE, d MMMM yyyy' }}</p>
              </div>
            </div>

            <!-- Logs for this member+date -->
            <div class="space-y-4 mb-4">
              <div *ngFor="let log of item.logs" class="bg-gray-50 rounded-lg p-3">
                <div class="flex items-center justify-between mb-1">
                  <p class="text-xs text-gray-500">{{ log.projectName || 'No project' }}</p>
                  <div class="flex gap-1">
                    <span *ngIf="log.isUnscheduledWfh" class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Unscheduled WFH</span>
                    <span *ngIf="log.location === 'WFH' && !log.isUnscheduledWfh" class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">WFH</span>
                  </div>
                </div>

                <div class="flex flex-wrap gap-1 mb-2">
                  <span *ngFor="let a of log.activities" class="text-xs bg-white border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full">{{ a.label }}</span>
                </div>

                <p class="text-sm text-gray-700 mb-2">{{ log.tasksDescription }}</p>

                <div *ngIf="log.blockers" class="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2 mb-2">
                  <span class="text-amber-500 text-xs shrink-0">⚠</span>
                  <p class="text-xs text-amber-800">{{ log.blockers }}</p>
                </div>

                <div class="flex flex-wrap gap-2">
                  <span *ngIf="log.selfLearning !== 'NONE'" class="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">📚 {{ log.selfLearning }}</span>
                  <!-- When the rated member is a collaborator on someone else's log, show the owner -->
                  <span *ngIf="log.userId !== item.memberId" class="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">🧑‍💻 {{ log.memberName }}'s task</span>
                  <!-- Show other collaborators, excluding the person being rated -->
                  <span *ngFor="let c of otherCollabs(log.collaborators, item.memberId)" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">👥 {{ c.name }}</span>
                </div>

                <app-log-comments [logId]="log.id" [initialComments]="log.comments" [isRated]="false" />
              </div>
            </div>

            <!-- Daily rating widget (one per member+date) -->
            <div class="border-t border-gray-100 pt-4">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Rate {{ item.memberName }}'s day (1–10)</p>
              <app-star-rating
                [rating]="stateFor(item).rating"
                (ratingChange)="stateFor(item).rating = $event"
              />
              <textarea
                [(ngModel)]="stateFor(item).comment"
                rows="2"
                placeholder="Optional comment…"
                class="w-full mt-3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              ></textarea>
              <button
                (click)="saveRating(item)"
                [disabled]="stateFor(item).rating === 0 || stateFor(item).saving"
                class="mt-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >{{ stateFor(item).saving ? 'Saving…' : 'Save rating' }}</button>
            </div>

          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class PendingRatingsComponent implements OnInit {
  private readonly ratingService = inject(RatingService);

  pending = signal<PendingRatingDto[]>([]);
  loading = signal(true);
  private ratingStates = new Map<string, RatingState>();

  stateFor(item: PendingRatingDto): RatingState {
    const key = `${item.memberId}:${item.logDate}`;
    if (!this.ratingStates.has(key)) this.ratingStates.set(key, { rating: 0, comment: '', saving: false });
    return this.ratingStates.get(key)!;
  }

  saveRating(item: PendingRatingDto): void {
    const state = this.stateFor(item);
    state.saving = true;
    this.ratingService.submitRating(item.memberId, item.logDate, state.rating, state.comment).subscribe({
      next: () => this.pending.update(ls => ls.filter(p => !(p.memberId === item.memberId && p.logDate === item.logDate))),
      error: () => { state.saving = false; }
    });
  }

  otherCollabs(collabs: CollaboratorRef[] | null | undefined, memberId: number): CollaboratorRef[] {
    return (collabs ?? []).filter(c => c.userId !== memberId);
  }

  ngOnInit(): void {
    this.ratingService.getPendingRatings().subscribe({
      next: items => {
        this.pending.set(items);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }
}
