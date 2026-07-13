import { Component, inject, signal, computed, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MemberService } from '../../../core/services/member.service';
import { RatingService } from '../../../core/services/rating.service';
import { LogService } from '../../../core/services/log.service';
import { AuthService } from '../../../core/auth/auth.service';
import { MemberSummary, DayOfWeek, TeamName, ModuleName, UserRole } from '../../../core/models/user.model';
import { DailyLogResponse, LogComment, RatingSummary } from '../../../core/models/daily-log.model';
import { KpiReport, WeeklyReview, WeeklyReviewItem } from '../../../core/models/kpi-report.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ScorePillComponent } from '../../../shared/components/score-pill/score-pill.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { KpiProgressBarComponent } from '../../../shared/components/kpi-progress-bar/kpi-progress-bar.component';

const ALL_DAYS: DayOfWeek[] = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

interface CommentSegment {
  type: 'text' | 'mention';
  content: string;
  userId?: number;
}

@Component({
  selector: 'app-member-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, ScorePillComponent, StarRatingComponent, KpiProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div *ngIf="member()">
      <!-- Header -->
      <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-5">
        <div class="flex items-start gap-4">
          <app-avatar [name]="member()!.name" size="lg" />
          <div class="flex-1">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-lg font-semibold text-gray-900">{{ member()!.name }}</p>
                <p class="text-sm text-gray-500">{{ member()!.team ?? 'No team' }} · {{ member()!.module ?? '—' }}</p>
                <p class="text-xs text-gray-400">{{ member()!.email }}</p>
              </div>
              <div class="flex gap-2">
                <button (click)="editProfile = !editProfile"
                  class="text-sm border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                  {{ editProfile ? 'Cancel' : 'Edit profile' }}
                </button>
                <button *ngIf="isManager" (click)="showDeleteConfirm = true"
                  class="text-sm border border-red-300 text-red-600 px-3 py-1.5 rounded-lg hover:bg-red-50">
                  Delete
                </button>
              </div>
            </div>

            <!-- Unassigned banner -->
            <div *ngIf="!member()!.team"
              class="mt-3 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <span class="text-amber-500">⚠</span>
              <p class="text-xs text-amber-800">This member hasn't been assigned a team or module yet. Edit their profile.</p>
            </div>
          </div>
        </div>

        <!-- Edit profile form -->
        <div *ngIf="editProfile" class="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Name</label>
            <input [(ngModel)]="editName" type="text" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Email</label>
            <input [(ngModel)]="editEmail" type="email" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Team</label>
            <select [(ngModel)]="editTeam" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— select —</option>
              <option *ngFor="let t of teams" [value]="t">{{ t }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Module</label>
            <select [(ngModel)]="editModule" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— select —</option>
              <option *ngFor="let m of modules" [value]="m">{{ m }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Role</label>
            <select [(ngModel)]="editRole" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="MEMBER">Member</option>
              <option value="TEAM_LEAD">Team Lead</option>
              <option value="MANAGER">Manager</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Team Lead</label>
            <select [(ngModel)]="editTeamLeadId" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" [disabled]="teamLeadsLoading">
              <option [ngValue]="null">{{ teamLeadsLoading ? 'Loading…' : '— none —' }}</option>
              <option *ngFor="let lead of teamLeads" [ngValue]="lead.userId">{{ lead.name }}</option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <button (click)="saveProfile()" class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover">Save changes</button>
          </div>
        </div>

        <!-- Set Password (MANAGER only) -->
        <div *ngIf="editProfile && isManager" class="mt-4 pt-4 border-t border-gray-100">
          <p class="text-xs font-medium text-gray-600 mb-2">Set / Change Password</p>
          <div class="flex gap-2">
            <div class="relative flex-1">
              <input [(ngModel)]="newPassword" [type]="showPassword ? 'text' : 'password'" placeholder="New password (min 6 chars)"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <button type="button" (click)="showPassword = !showPassword"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs">
                {{ showPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
            <button (click)="savePassword()"
              [disabled]="newPassword.length < 6"
              class="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
              Set password
            </button>
          </div>
          <label class="flex items-center gap-2 mt-2 cursor-pointer">
            <input type="checkbox" [(ngModel)]="notifyWithPassword" class="accent-primary" />
            <span class="text-xs text-gray-600">Send password to member via in-app notification</span>
          </label>
          <p *ngIf="passwordSaved()" class="text-xs text-green-600 mt-1">Password updated.</p>
        </div>
      </div>

      <!-- WFH Schedule -->
      <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-5">
        <div class="flex items-center justify-between mb-3">
          <p class="text-sm font-semibold text-gray-700">WFH Schedule</p>
          <button (click)="editWfh = !editWfh" class="text-sm border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50">
            {{ editWfh ? 'Cancel' : 'Edit' }}
          </button>
        </div>
        <div *ngIf="!editWfh" class="flex flex-wrap gap-2">
          <span *ngFor="let d of wfhDays()" class="text-xs bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-full font-medium">{{ d }}</span>
          <span *ngIf="!wfhDays().length" class="text-xs text-gray-400">No WFH days configured</span>
        </div>
        <div *ngIf="editWfh">
          <div class="flex flex-wrap gap-3 mb-3">
            <label *ngFor="let d of allDays" class="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" [checked]="wfhDaysEdit.includes(d)" (change)="toggleDay(d)" class="accent-primary" />
              {{ d }}
            </label>
          </div>
          <button (click)="saveWfh()" class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover">Save schedule</button>
        </div>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">KPI Score</p>
          <app-score-pill [score]="member()!.kpiTotal" />
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">Avg rating</p>
          <p class="text-2xl font-semibold text-gray-900">{{ member()!.avgRating != null ? (member()!.avgRating! | number:'1.1-1') : '—' }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">Logs this month</p>
          <p class="text-2xl font-semibold text-gray-900">{{ member()!.logCountThisMonth }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">Unrated</p>
          <p class="text-2xl font-semibold text-amber-600">{{ member()!.unratedCount }}</p>
        </div>
      </div>

      <!-- Logs section header + month nav -->
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-semibold text-gray-700">All Logs</h3>
        <div class="flex items-center gap-2">
          <button (click)="shiftMonth(-1)" [disabled]="!canGoBack()"
            class="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs disabled:opacity-30">◀</button>
          <span class="text-sm font-medium text-gray-700 w-28 text-center">{{ selectedMonthLabel }}</span>
          <button (click)="shiftMonth(1)" [disabled]="isCurrentMonth"
            class="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 text-xs disabled:opacity-30">▶</button>
        </div>
      </div>

      <!-- Logs loading skeleton -->
      <div *ngIf="logsLoading()" class="space-y-3 mb-6">
        <div *ngFor="let _ of [1,2,3]" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
          <div class="h-10 bg-gray-100"></div>
          <div class="p-4 space-y-2">
            <div class="h-3 bg-gray-100 rounded w-1/4"></div>
            <div class="h-4 bg-gray-100 rounded w-3/4"></div>
            <div class="h-4 bg-gray-100 rounded w-1/2"></div>
          </div>
        </div>
      </div>

      <!-- No logs -->
      <div *ngIf="!logsLoading() && logsByDate().length === 0"
        class="bg-white rounded-xl border border-gray-200 p-8 text-center text-sm text-gray-400 mb-6">
        No logs for this month
      </div>

      <!-- Logs grouped by date -->
      <div *ngIf="!logsLoading()" class="space-y-4 mb-6">
        <div *ngFor="let group of logsByDate(); trackBy: trackByDate" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

          <!-- Date header -->
          <div class="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-gray-100">
            <p class="text-sm font-semibold text-gray-900">{{ group.date | date:'EEE, d MMM yyyy' }}</p>
            <span *ngIf="group.logs[0].isUnscheduledWfh" class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Unscheduled WFH</span>
          </div>

          <!-- Individual tasks for this day -->
          <div class="divide-y divide-gray-50">
            <div *ngFor="let log of group.logs" class="px-4 py-3">
              <div class="flex items-center gap-2 mb-0.5 flex-wrap">
                <p class="text-xs text-gray-400">{{ log.projectName || 'No project' }}</p>
                <span *ngIf="log.userId !== +id"
                  class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                  📋 {{ log.memberName }}'s task
                </span>
              </div>
              <p class="text-sm text-gray-700">{{ log.tasksDescription }}</p>
              <div *ngIf="log.collaborators?.length" class="flex flex-wrap gap-1 mt-1.5">
                <span *ngFor="let c of log.collaborators" class="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">👥 {{ c.name }}</span>
              </div>

              <!-- Comments thread -->
              <div class="mt-3 border-t border-gray-100 pt-2 space-y-2">
                <div *ngFor="let c of log.comments" class="flex gap-2">
                  <div class="flex-1 bg-gray-50 rounded-lg px-3 py-2">
                    <div class="flex items-center gap-1.5 mb-0.5">
                      <span class="text-xs font-semibold text-gray-800">{{ c.authorName }}</span>
                      <span class="text-[10px] text-gray-400 uppercase tracking-wide">{{ c.authorRole === 'MANAGER' ? 'Manager' : c.authorRole === 'TEAM_LEAD' ? 'Lead' : '' }}</span>
                      <span class="text-[10px] text-gray-400 ml-auto">{{ c.createdAt | date:'d MMM, HH:mm' }}</span>
                    </div>
                    <p class="text-xs text-gray-700 whitespace-pre-line leading-relaxed">
                      <ng-container *ngFor="let seg of parseCommentBody(c.body)">
                        <span *ngIf="seg.type === 'text'">{{ seg.content }}</span>
                        <button *ngIf="seg.type === 'mention'"
                          (click)="seg.userId ? router.navigate(['/manager/member', seg.userId]) : null"
                          class="inline-flex items-center gap-0.5 bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.5 rounded-md text-[11px] hover:bg-blue-200 transition-colors mx-0.5 align-middle">
                          @{{ seg.content }}
                        </button>
                      </ng-container>
                    </p>
                  </div>
                </div>
                <!-- Add comment with mention -->
                <div class="relative mt-1">
                  <!-- Mention suggestions dropdown -->
                  <div *ngIf="mentionLogId === log.id && mentionSuggestions.length > 0"
                    class="absolute bottom-full left-0 mb-1 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-30 overflow-hidden">
                    <div *ngFor="let m of mentionSuggestions"
                      (mousedown)="selectMention(log, m)"
                      class="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-primary-light">
                      <div class="w-6 h-6 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {{ m.name[0] }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-xs font-medium text-gray-900 truncate">{{ m.name }}</p>
                        <p class="text-[10px] text-gray-400 truncate">{{ m.email }}</p>
                      </div>
                    </div>
                  </div>
                  <div class="flex gap-2">
                    <input [(ngModel)]="commentInputs[log.id]"
                      (input)="onCommentInput(log.id, $event)"
                      (keyup.enter)="addComment(log)"
                      (blur)="mentionLogId = null"
                      type="text" placeholder="Add a comment… type @ to mention"
                      class="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
                    <button (click)="addComment(log)" [disabled]="!(commentInputs[log.id] || '').trim() || commentSubmitting.has(log.id)"
                      class="text-xs bg-primary text-white px-3 py-1.5 rounded-lg disabled:opacity-40">Send</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Single daily rating for the whole day -->
          <div class="px-4 py-3 border-t border-gray-100">
            <!-- Existing rating display -->
            <div *ngIf="group.rating && editingRatingDate() !== group.date">
              <div class="flex items-center gap-2 flex-wrap">
                <app-star-rating [rating]="group.rating.rating" [readonly]="true" />
                <span *ngIf="group.rating.ratedByName" class="text-xs text-gray-400">by {{ group.rating.ratedByName }}</span>
                <button (click)="openEditRatingByDate(group)" class="text-xs text-gray-400 hover:text-primary ml-auto">Edit rating</button>
              </div>
              <p *ngIf="group.rating.comment" class="text-xs text-gray-500 mt-1 italic">"{{ group.rating.comment }}"</p>
            </div>
            <!-- Edit rating form -->
            <div *ngIf="group.rating && editingRatingDate() === group.date" class="space-y-2">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Edit day rating</p>
              <app-star-rating [rating]="editRatingValue" (ratingChange)="editRatingValue = $event" />
              <textarea [(ngModel)]="editRatingComment" rows="2" placeholder="Comment (optional)…"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"></textarea>
              <div class="flex gap-2">
                <button (click)="saveEditRatingByDate(group)" [disabled]="editRatingValue === 0"
                  class="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">Save</button>
                <button (click)="editingRatingDate.set(null)"
                  class="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
            <!-- New rating -->
            <div *ngIf="!group.rating" class="flex items-center gap-3">
              <app-star-rating [rating]="inlineRatingByDate(group.date)" (ratingChange)="setInlineRatingByDate(group.date, $event)" />
              <button (click)="quickRateDate(group)" [disabled]="inlineRatingByDate(group.date) === 0"
                class="text-xs bg-primary text-white px-3 py-1 rounded-lg disabled:opacity-50">Rate day</button>
            </div>
          </div>

        </div>
      </div>

      <!-- KPI Accordion -->
      <div *ngIf="kpi()">
        <h3 class="text-sm font-semibold text-gray-700 mb-3">KPI Breakdown</h3>
        <div class="space-y-3">
          <div *ngFor="let section of kpi()!.sections" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button type="button" class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
              (click)="toggleKpiSection(section.key)">
              <p class="text-sm font-semibold text-gray-900">{{ section.title }}</p>
              <p class="text-xs text-gray-500">{{ section.totalScore | number:'1.1-1' }} / {{ section.totalWeight }}</p>
            </button>
            <div *ngIf="openKpiSections.has(section.key)" class="px-4 pb-3 border-t border-gray-100">
              <app-kpi-progress-bar *ngFor="let item of section.items"
                [itemKey]="item.key" [label]="item.label" [earned]="item.score" [max]="item.weight" [tooltip]="item.tooltip" />
            </div>
          </div>
        </div>
      </div>

      <!-- Weekly Review -->
      <div class="mt-5">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-semibold text-gray-700">Weekly Review</h3>
          <div class="flex items-center gap-2">
            <button (click)="shiftWeek(-1)" class="text-gray-500 hover:text-gray-700 px-1.5 py-0.5 border border-gray-200 rounded text-xs">‹</button>
            <span class="text-xs text-gray-500 min-w-[90px] text-center">{{ weekStartLabel }}</span>
            <button (click)="shiftWeek(1)" class="text-gray-500 hover:text-gray-700 px-1.5 py-0.5 border border-gray-200 rounded text-xs">›</button>
            <button (click)="toggleReviewMode()" class="text-xs px-3 py-1.5 rounded-lg font-medium transition-colors"
              [class.bg-primary]="!reviewMode" [class.text-white]="!reviewMode"
              [class.border]="reviewMode" [class.border-gray-300]="reviewMode" [class.text-gray-700]="reviewMode">
              {{ reviewMode ? 'Close' : 'Review' }}
            </button>
          </div>
        </div>

        <div *ngIf="reviewMode">
          <div *ngIf="!weeklyReview()" class="text-xs text-gray-400 py-4 text-center">Loading…</div>
          <div *ngIf="weeklyReview()">
            <!-- Progress -->
            <div class="flex items-center gap-2 mb-4 bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm">
              <span class="text-sm">✅</span>
              <span class="text-sm font-medium text-gray-700">{{ weeklyReview()!.checkedCount }} / {{ weeklyReview()!.totalCount }} items reviewed</span>
              <div class="flex-1 h-1.5 bg-gray-100 rounded-full ml-2">
                <div class="h-1.5 bg-primary rounded-full transition-all"
                  [style.width.%]="weeklyReview()!.totalCount ? (weeklyReview()!.checkedCount / weeklyReview()!.totalCount) * 100 : 0"></div>
              </div>
            </div>

            <!-- Items grouped by KPI section -->
            <div class="space-y-3">
              <div *ngFor="let sec of reviewSections()" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div class="px-4 py-2.5 bg-gray-50 border-b border-gray-100">
                  <p class="text-xs font-semibold text-gray-600 uppercase tracking-wider">{{ sec.title }}</p>
                </div>
                <div class="divide-y divide-gray-50">
                  <div *ngFor="let item of sec.items" class="px-4 py-3">
                    <div class="flex items-start gap-3">
                      <input type="checkbox" [checked]="item.checked"
                        (change)="toggleItemChecked(item)"
                        class="mt-0.5 accent-primary cursor-pointer shrink-0" />
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center justify-between gap-2">
                          <p class="text-sm text-gray-800">
                            <span class="text-xs text-gray-400 font-medium mr-1">{{ item.key }}</span>{{ item.label }}
                          </p>
                          <span class="text-xs font-medium shrink-0"
                            [class.text-primary]="item.suggestedScore >= item.maxScore * 0.8"
                            [class.text-amber-600]="item.suggestedScore < item.maxScore * 0.8 && item.suggestedScore >= item.maxScore * 0.5"
                            [class.text-danger]="item.suggestedScore < item.maxScore * 0.5">
                            {{ item.suggestedScore | number:'1.1-1' }} / {{ item.maxScore }}
                          </span>
                        </div>
                        <input *ngIf="item.checked" type="text" [(ngModel)]="itemNotes[item.key]"
                          placeholder="Add a note (optional)…"
                          class="mt-1.5 w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button (click)="saveReview()" [disabled]="reviewSaving"
              class="mt-4 bg-primary hover:bg-primary-hover text-white px-5 py-2 text-sm rounded-lg font-medium disabled:opacity-50 transition-colors">
              {{ reviewSaving ? 'Saving…' : 'Save review' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete confirmation modal -->
    <div *ngIf="showDeleteConfirm" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-base font-semibold text-gray-900 mb-2">Delete member?</h3>
        <p class="text-sm text-gray-500 mb-5">
          <strong>{{ member()!.name }}</strong> will be permanently deleted if they have no logs, or deactivated and hidden if they do.
        </p>
        <div class="flex gap-3 justify-end">
          <button (click)="showDeleteConfirm = false" class="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
          <button (click)="deleteMember()" [disabled]="deleting"
            class="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {{ deleting ? 'Deleting…' : 'Yes, delete' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class MemberDetailComponent implements OnInit {
  @Input() id!: string;

  private readonly memberService = inject(MemberService);
  private readonly ratingService = inject(RatingService);
  private readonly logService = inject(LogService);
  readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  get isManager(): boolean { return this.auth.role === 'MANAGER'; }

  member = signal<MemberSummary | null>(null);
  logs = signal<DailyLogResponse[]>([]);
  kpi = signal<KpiReport | null>(null);
  wfhDays = signal<DayOfWeek[]>([]);

  showDeleteConfirm = false;
  deleting = false;
  editProfile = false;
  editWfh = false;
  editName = '';
  editEmail = '';
  editTeam: TeamName | '' = '';
  editModule: ModuleName | '' = '';
  editRole: UserRole = 'MEMBER';
  editTeamLeadId: number | null = null;
  teamLeads: MemberSummary[] = [];
  teamLeadsLoading = true;
  wfhDaysEdit: DayOfWeek[] = [];
  allDays = ALL_DAYS;
  teams: TeamName[] = ['TECHNICAL'];
  modules: ModuleName[] = ['FRONTEND', 'BACKEND', 'TESTING', 'FLUTTER'];
  openKpiSections = new Set<string>();
  weeklyReview = signal<WeeklyReview | null>(null);
  reviewMode = false;
  reviewSaving = false;
  weekStart = this.currentWeekStart();
  itemNotes: Record<string, string> = {};
  private inlineRatings = new Map<string, number>();
  editingRatingDate = signal<string | null>(null);
  editRatingValue = 0;
  editRatingComment = '';
  newPassword = '';
  showPassword = false;
  notifyWithPassword = false;
  passwordSaved = signal(false);

  // Month navigation
  logsLoading = signal(false);
  canGoBack = signal(true);
  selectedMonth = signal<string>(this.currentMonthStr());

  get selectedMonthLabel(): string {
    const [y, m] = this.selectedMonth().split('-');
    return new Date(+y, +m - 1, 1).toLocaleDateString('en-EG', { month: 'long', year: 'numeric' });
  }

  get isCurrentMonth(): boolean { return this.selectedMonth() === this.currentMonthStr(); }

  private currentMonthStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  }

  shiftMonth(dir: 1 | -1): void {
    if (dir === -1 && !this.canGoBack()) return;
    const [y, m] = this.selectedMonth().split('-').map(Number);
    const d = new Date(y, m - 1 + dir, 1);
    this.selectedMonth.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    if (dir === 1) this.canGoBack.set(true);
    this.loadLogs(+this.id, this.selectedMonth());
  }

  private loadLogs(uid: number, month: string): void {
    this.logsLoading.set(true);
    this.memberService.getMemberLogs(uid, month).subscribe(logs => {
      this.logs.set([...logs].sort((a, b) => b.logDate.localeCompare(a.logDate)));
      this.logsLoading.set(false);
      this.canGoBack.set(logs.length > 0);
    });
  }

  // Comments: keyed by logId
  commentInputs: Record<number, string> = {};
  commentSubmitting = new Set<number>();

  // Mention autocomplete
  allMembers: MemberSummary[] = [];
  mentionLogId: number | null = null;
  mentionQuery = '';
  get mentionSuggestions(): MemberSummary[] {
    if (!this.mentionQuery) return [];
    const q = this.mentionQuery.toLowerCase();
    return this.allMembers.filter(m =>
      m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q)
    ).slice(0, 6);
  }

  onCommentInput(logId: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val = input.value;
    const pos = input.selectionStart ?? val.length;
    const before = val.slice(0, pos);
    const match = /@([\w.\-]*)$/.exec(before);
    if (match) {
      this.mentionLogId = logId;
      this.mentionQuery = match[1];
    } else {
      this.mentionLogId = null;
      this.mentionQuery = '';
    }
  }

  selectMention(log: DailyLogResponse, member: MemberSummary): void {
    const val = this.commentInputs[log.id] ?? '';
    // Replace trailing @query with @email
    const replaced = val.replace(/@[\w.\-]*$/, `@${member.email} `);
    this.commentInputs[log.id] = replaced;
    this.mentionLogId = null;
    this.mentionQuery = '';
  }

  parseCommentBody(body: string): CommentSegment[] {
    const segments: CommentSegment[] = [];
    const regex = /@([\w._%+\-]+@cic\.ae)/gi;
    let last = 0;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(body)) !== null) {
      if (match.index > last) {
        segments.push({ type: 'text', content: body.slice(last, match.index) });
      }
      const member = this.allMembers.find(m => m.email.toLowerCase() === match![1].toLowerCase());
      segments.push({ type: 'mention', content: member ? member.name : match[1], userId: member?.userId });
      last = regex.lastIndex;
    }
    if (last < body.length) segments.push({ type: 'text', content: body.slice(last) });
    return segments;
  }

  addComment(log: DailyLogResponse): void {
    const body = (this.commentInputs[log.id] ?? '').trim();
    if (!body) return;
    this.commentSubmitting.add(log.id);
    this.mentionLogId = null;
    this.logService.addComment(log.id, body).subscribe(comment => {
      this.logs.update(ls => ls.map(l => l.id === log.id
        ? { ...l, comments: [...(l.comments ?? []), comment] }
        : l));
      this.commentInputs[log.id] = '';
      this.commentSubmitting.delete(log.id);
    });
  }

  inlineRatingByDate(date: string): number { return this.inlineRatings.get(date) ?? 0; }
  setInlineRatingByDate(date: string, r: number): void { this.inlineRatings.set(date, r); }

  readonly logsByDate = computed(() => {
    const memberId = +this.id;
    const map = new Map<string, DailyLogResponse[]>();
    for (const log of this.logs()) {
      const existing = map.get(log.logDate) ?? [];
      existing.push(log);
      map.set(log.logDate, existing);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([date, logs]) => {
        // Prefer the viewed member's own log rating; fall back to any log with a rating
        const ownRating = logs.find(l => l.userId === memberId && l.rating)?.rating ?? null;
        const anyRating = logs.find(l => l.rating)?.rating ?? null;
        return { date, logs, rating: ownRating ?? anyRating };
      });
  });

  trackByDate(_: number, group: { date: string }): string { return group.date; }

  toggleDay(d: DayOfWeek): void {
    this.wfhDaysEdit = this.wfhDaysEdit.includes(d)
      ? this.wfhDaysEdit.filter(x => x !== d)
      : [...this.wfhDaysEdit, d];
  }

  toggleKpiSection(key: string): void {
    this.openKpiSections.has(key) ? this.openKpiSections.delete(key) : this.openKpiSections.add(key);
  }

  private currentWeekStart(): string {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay()); // back to Sunday
    return d.toISOString().split('T')[0];
  }

  get weekStartLabel(): string {
    return new Date(this.weekStart + 'T00:00:00').toLocaleDateString('en-EG', { day: 'numeric', month: 'short' });
  }

  shiftWeek(dir: 1 | -1): void {
    const d = new Date(this.weekStart + 'T00:00:00');
    d.setDate(d.getDate() + dir * 7);
    this.weekStart = d.toISOString().split('T')[0];
    if (this.reviewMode) this.loadReview();
  }

  toggleReviewMode(): void {
    this.reviewMode = !this.reviewMode;
    if (this.reviewMode && !this.weeklyReview()) this.loadReview();
  }

  private loadReview(): void {
    this.weeklyReview.set(null);
    this.memberService.getWeeklyReview(+this.id, this.weekStart).subscribe(r => {
      this.weeklyReview.set(r);
      this.itemNotes = Object.fromEntries(r.items.map(i => [i.key, i.note ?? '']));
    });
  }

  reviewSections(): Array<{ key: string; title: string; items: WeeklyReviewItem[] }> {
    const review = this.weeklyReview();
    if (!review || !this.kpi()) return [];
    const itemMap = new Map(review.items.map(i => [i.key, i]));
    return (this.kpi()!.sections ?? []).map(sec => ({
      key: sec.key,
      title: sec.title,
      items: (sec.items ?? [])
        .map(ki => itemMap.get(ki.key))
        .filter((i): i is WeeklyReviewItem => i != null)
    }));
  }

  toggleItemChecked(item: WeeklyReviewItem): void {
    const review = this.weeklyReview();
    if (!review) return;
    const updated = review.items.map(i => i.key === item.key ? { ...i, checked: !i.checked } : i);
    const checkedCount = updated.filter(i => i.checked).length;
    this.weeklyReview.set({ ...review, items: updated, checkedCount });
  }

  saveReview(): void {
    const review = this.weeklyReview();
    if (!review) return;
    this.reviewSaving = true;
    const items = review.items.map(i => ({ key: i.key, checked: i.checked, note: this.itemNotes[i.key] || null }));
    this.memberService.saveWeeklyReview(+this.id, this.weekStart, items).subscribe({
      next: r => { this.weeklyReview.set(r); this.reviewSaving = false; },
      error: () => { this.reviewSaving = false; }
    });
  }

  savePassword(): void {
    this.memberService.setMemberPassword(+this.id, this.newPassword, this.notifyWithPassword).subscribe(() => {
      this.newPassword = '';
      this.showPassword = false;
      this.notifyWithPassword = false;
      this.passwordSaved.set(true);
      setTimeout(() => this.passwordSaved.set(false), 3000);
    });
  }

  deleteMember(): void {
    this.deleting = true;
    this.memberService.deleteMember(+this.id).subscribe({
      next: () => this.router.navigate(['/manager/overview']),
      error: () => { this.deleting = false; this.showDeleteConfirm = false; }
    });
  }

  saveProfile(): void {
    const uid = +this.id;
    this.memberService.updateMember(uid, {
      name: this.editName || undefined,
      email: this.editEmail || undefined,
      team: (this.editTeam as TeamName) || undefined,
      module: this.editModule || undefined,
      role: this.editRole,
      teamLeadId: this.editTeamLeadId ?? undefined
    }).subscribe(m => { this.member.set(m); this.editProfile = false; });
  }

  saveWfh(): void {
    this.memberService.updateMemberWfhSchedule(+this.id, this.wfhDaysEdit).subscribe(res => {
      this.wfhDays.set(res.days);
      this.editWfh = false;
    });
  }

  quickRateDate(group: { date: string; logs: DailyLogResponse[] }): void {
    const rating = this.inlineRatingByDate(group.date);
    const memberId = +this.id;
    this.ratingService.submitRating(memberId, group.date, rating, '').subscribe(() => {
      const ratingObj = { id: 0, rating, comment: null, ratedAt: new Date().toISOString(), isAutomated: false, ratedByName: null };
      this.logs.update(ls => ls.map(l => l.logDate === group.date ? { ...l, rating: ratingObj } : l));
      this.memberService.getMember(memberId).subscribe(m => this.member.set(m));
    });
  }

  openEditRatingByDate(group: { date: string; logs: DailyLogResponse[]; rating: DailyLogResponse['rating'] }): void {
    if (!group.rating) return;
    this.editingRatingDate.set(group.date);
    this.editRatingValue = group.rating.rating;
    this.editRatingComment = group.rating.comment ?? '';
  }

  saveEditRatingByDate(group: { date: string; logs: DailyLogResponse[]; rating: DailyLogResponse['rating'] }): void {
    if (!group.rating || this.editRatingValue === 0) return;
    this.ratingService.updateRating(group.rating.id, this.editRatingValue, this.editRatingComment).subscribe(r => {
      const updated: RatingSummary = { id: r.id, rating: r.rating, comment: r.comment, ratedAt: r.ratedAt, isAutomated: r.isAutomated, ratedByName: null };
      this.logs.update(ls => ls.map(l => l.logDate === group.date ? { ...l, rating: updated } : l));
      this.editingRatingDate.set(null);
      this.memberService.getMember(+this.id).subscribe(m => this.member.set(m));
    });
  }

  ngOnInit(): void {
    const uid = +this.id;
    const month = this.selectedMonth();

    forkJoin({
      member: this.memberService.getMember(uid),
      leads: this.memberService.getLeads()
    }).subscribe(({ member: m, leads }) => {
      this.teamLeads = leads;
      this.teamLeadsLoading = false;
      this.member.set(m);
      this.editName = m.name;
      this.editEmail = m.email;
      this.editTeam = m.team ?? '';
      this.editModule = m.module ?? '';
      this.editRole = m.role;
      this.editTeamLeadId = m.teamLeadId;
    });
    this.memberService.getMembers({ size: 200 }).subscribe(r => { this.allMembers = r.data; });
    this.loadLogs(uid, month);
    this.memberService.getMemberKpi(uid, month).subscribe(k => {
      this.kpi.set(k);
      this.openKpiSections = new Set(k.sections.map(s => s.key));
    });
    this.memberService.getMemberWfhSchedule(uid).subscribe(r => {
      this.wfhDays.set(r.days);
      this.wfhDaysEdit = [...r.days];
    });
  }
}
