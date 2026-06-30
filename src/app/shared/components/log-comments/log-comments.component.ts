/**
 * Thread of comments on a daily log. Usable by both member and manager views.
 * Comments can be passed in directly (already embedded in the log response) to avoid
 * an extra fetch; falls back to fetching by logId if not provided.
 * Once a log has been rated, only MANAGER/TEAM_LEAD can keep posting — the member is locked out.
 */
import { Component, Input, OnInit, OnChanges, SimpleChanges, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../../core/services/log.service';
import { AuthService } from '../../../core/auth/auth.service';
import { LogComment } from '../../../core/models/daily-log.model';

@Component({
  selector: 'app-log-comments',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="mt-3 border-t border-gray-100 pt-3 space-y-2">
      <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Comments {{ comments().length ? '(' + comments().length + ')' : '' }}
      </p>

      <!-- Comment thread -->
      @for (c of comments(); track c.id) {
        <div class="flex gap-2">
          <div class="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
            [class.bg-primary]="c.authorRole !== 'MEMBER'"
            [class.bg-gray-400]="c.authorRole === 'MEMBER'">
            {{ c.authorName.charAt(0) }}
          </div>
          <div class="flex-1">
            <div class="flex items-baseline gap-2">
              <span class="text-xs font-semibold text-gray-800">{{ c.authorName }}</span>
              <span class="text-xs text-gray-400">{{ roleLabel(c.authorRole) }}</span>
              <span class="text-xs text-gray-300">{{ formatTime(c.createdAt) }}</span>
            </div>
            <p class="text-sm text-gray-700 mt-0.5 whitespace-pre-wrap">{{ c.body }}</p>
          </div>
        </div>
      }

      @if (comments().length === 0 && !loading()) {
        <p class="text-xs text-gray-400 italic">No comments yet. Be the first to comment.</p>
      }

      <!-- New comment input -->
      <div *ngIf="canComment()" class="flex gap-2 mt-2">
        <input
          [(ngModel)]="newComment"
          placeholder="Write a comment…"
          (keydown.enter)="post()"
          class="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <button
          type="button"
          (click)="post()"
          [disabled]="!newComment.trim() || posting()"
          class="bg-primary hover:bg-primary-hover text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
        >{{ posting() ? '…' : 'Send' }}</button>
      </div>
      <p *ngIf="!canComment()" class="text-xs text-gray-400 italic mt-1">
        This log has been rated — only the manager can add further comments.
      </p>
    </div>
  `
})
export class LogCommentsComponent implements OnInit, OnChanges {
  @Input({ required: true }) logId!: number;
  @Input() initialComments: LogComment[] | null = null;
  @Input() isRated = false;

  private readonly logService = inject(LogService);
  private readonly auth = inject(AuthService);

  comments = signal<LogComment[]>([]);
  loading  = signal(true);
  posting  = signal(false);
  newComment = '';

  canComment(): boolean {
    const role = this.auth.role;
    return role === 'MANAGER' || role === 'TEAM_LEAD' || !this.isRated;
  }

  roleLabel(role: string): string {
    return role === 'MANAGER' ? 'Manager' : role === 'TEAM_LEAD' ? 'Team Lead' : 'Member';
  }

  ngOnInit(): void {
    if (this.initialComments) {
      this.comments.set(this.initialComments);
      this.loading.set(false);
      return;
    }
    this.fetch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialComments'] && this.initialComments) {
      this.comments.set(this.initialComments);
      this.loading.set(false);
    }
  }

  private fetch(): void {
    this.logService.getComments(this.logId).subscribe({
      next: c => { this.comments.set(c); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }

  post(): void {
    const body = this.newComment.trim();
    if (!body) return;
    this.posting.set(true);
    this.logService.addComment(this.logId, body).subscribe({
      next: c => {
        this.comments.update(list => [...list, c]);
        this.newComment = '';
        this.posting.set(false);
      },
      error: () => this.posting.set(false)
    });
  }

  formatTime(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-EG', { day: 'numeric', month: 'short' }) +
           ' ' + d.toLocaleTimeString('en-EG', { hour: '2-digit', minute: '2-digit' });
  }
}
