import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../core/services/member.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AdminService } from '../../../core/services/admin.service';
import { NotificationService } from '../../../core/services/notification.service';
import { MemberSummary, TeamName, ModuleName, UserRole } from '../../../core/models/user.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ScorePillComponent } from '../../../shared/components/score-pill/score-pill.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-team-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, AvatarComponent, ScorePillComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <app-loading *ngIf="loading()" />
      <ng-container *ngIf="!loading()">

      <!-- Header -->
      <div class="flex items-center justify-between mb-5">
        <h1 class="text-xl font-bold text-gray-900">Team Overview</h1>
        <div class="flex items-center gap-2">
          <button (click)="showBroadcast = true"
            class="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            Send Notification
          </button>
          <button *ngIf="isManager" (click)="showResetConfirm = true"
            class="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            Reset All Logs
          </button>
          <button *ngIf="isManager" (click)="showCreate = true"
            class="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Member
          </button>
        </div>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="bg-white rounded-2xl p-4 shadow-card">
          <div class="w-9 h-9 bg-primary-light rounded-xl flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ totalItems() }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Members</p>
        </div>
        <div class="bg-white rounded-2xl p-4 shadow-card">
          <div class="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <p class="text-2xl font-bold text-gray-900">{{ avgScore | number:'1.1-1' }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Avg Score</p>
        </div>
        <div class="bg-white rounded-2xl p-4 shadow-card">
          <div class="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
          </div>
          <p class="text-2xl font-bold text-red-500">{{ atRiskCount }}</p>
          <p class="text-xs text-gray-400 mt-0.5">At Risk</p>
        </div>
        <div class="bg-white rounded-2xl p-4 shadow-card">
          <div class="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
            <svg class="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </div>
          <p class="text-2xl font-bold text-amber-500">{{ pendingCount }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Pending Ratings</p>
        </div>
      </div>

      <!-- Search + filters -->
      <div class="bg-white rounded-2xl p-4 shadow-card mb-5">
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            <input [(ngModel)]="searchInput" (ngModelChange)="onSearchChange()"
              type="text" placeholder="Search by name or email…"
              class="w-full border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50" />
          </div>
          <select [(ngModel)]="activeModule" (ngModelChange)="selectModule($event)"
            class="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-gray-50">
            <option value="All">All modules</option>
            <option *ngFor="let m of moduleFilters" [value]="m">{{ m }}</option>
          </select>
        </div>
        <div class="flex gap-2 flex-wrap mt-3">
          <button *ngFor="let t of teamFilters" (click)="selectTeam(t)"
            class="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
            [class]="activeTeam === t ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-500 border-gray-200 hover:border-primary hover:text-primary'">
            {{ t }}
          </button>
        </div>
      </div>

      <!-- Member grid -->
      <div class="relative">
        <div *ngIf="tableLoading()" class="absolute inset-0 bg-surface/70 flex items-center justify-center z-10 rounded-2xl">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
        <div *ngIf="members().length === 0 && !tableLoading()"
          class="bg-white rounded-2xl shadow-card py-16 text-center text-gray-400 text-sm">
          No members found.
        </div>
        <div *ngIf="members().length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <a *ngFor="let m of members()"
            [routerLink]="['/manager/member', m.userId]"
            class="bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-shadow p-4 flex items-center gap-3 relative overflow-hidden"
            [class.border-l-4]="m.unratedCount > 0"
            [class.border-amber-400]="m.unratedCount > 0">
            <!-- Unrated pulse dot on avatar -->
            <div class="relative shrink-0">
              <app-avatar [name]="m.name" size="md" />
              <span *ngIf="m.unratedCount > 0"
                class="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center text-white text-[9px] font-bold ring-2 ring-white">
                {{ m.unratedCount > 9 ? '9+' : m.unratedCount }}
              </span>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-gray-900 truncate">{{ m.name }}</p>
                <app-score-pill [score]="m.kpiTotal" />
              </div>
              <p class="text-xs text-gray-400 mt-0.5">{{ m.module ?? '—' }}</p>
              <div class="flex items-center gap-2 mt-1.5">
                <span *ngIf="m.unratedCount > 0"
                  class="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold border border-amber-200">
                  ⏳ {{ m.unratedCount }} unrated {{ m.unratedCount === 1 ? 'day' : 'days' }}
                </span>
                <span class="text-xs text-gray-300">{{ m.logCountThisMonth }} logs</span>
              </div>
            </div>
            <svg class="w-4 h-4 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </a>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="totalItems() > pageSize" class="flex items-center justify-between mt-1">
        <p class="text-xs text-gray-400">
          {{ currentPage * pageSize + 1 }}–{{ min(currentPage * pageSize + members().length, totalItems()) }}
          of {{ totalItems() }}
        </p>
        <div class="flex gap-2">
          <button (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 0"
            class="px-4 py-1.5 text-sm font-medium border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-colors">
            ← Prev
          </button>
          <span class="px-3 py-1.5 text-sm text-gray-600 font-semibold">{{ currentPage + 1 }}</span>
          <button (click)="goToPage(nextPage())" [disabled]="isLastPage()"
            class="px-4 py-1.5 text-sm font-medium border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-colors">
            Next →
          </button>
        </div>
      </div>

      </ng-container>
    </div>

    <!-- Create member modal -->
    <div *ngIf="showCreate" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div class="flex items-center justify-between mb-5">
          <h3 class="text-base font-semibold text-gray-900">Add new member</h3>
          <button (click)="closeCreate()" class="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Full name *</label>
            <input [(ngModel)]="form.name" type="text" placeholder="e.g. Ahmed Youssef"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Email * (&#64;cic.ae)</label>
            <input [(ngModel)]="form.email" type="email" placeholder="ahmed.youssef@cic.ae"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Password * (min 6 chars)</label>
            <div class="relative">
              <input [(ngModel)]="form.password" [type]="showFormPassword ? 'text' : 'password'" placeholder="Initial password"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              <button type="button" (click)="showFormPassword = !showFormPassword"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600">
                {{ showFormPassword ? 'Hide' : 'Show' }}
              </button>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Team</label>
              <select [(ngModel)]="form.team"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="">— select —</option>
                <option *ngFor="let t of teams" [value]="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-600 mb-1">Role</label>
              <select [(ngModel)]="form.role"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                <option value="MEMBER">Member</option>
                <option value="TEAM_LEAD">Team Lead</option>
              </select>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Module</label>
            <select [(ngModel)]="form.module"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option value="">— select —</option>
              <option *ngFor="let m of moduleFilters" [value]="m">{{ m }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Team Lead</label>
            <select [(ngModel)]="form.teamLeadId"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option [ngValue]="undefined">— none —</option>
              <option *ngFor="let lead of teamLeads" [ngValue]="lead.userId">{{ lead.name }}</option>
            </select>
          </div>
        </div>

        <p *ngIf="createError" class="text-xs text-red-600 mt-3">{{ createError }}</p>

        <div class="flex gap-3 mt-5">
          <button (click)="submitCreate()"
            [disabled]="creating || !form.name || !form.email || form.password.length < 6"
            class="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50">
            {{ creating ? 'Creating…' : 'Create member' }}
          </button>
          <button (click)="closeCreate()"
            class="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Broadcast notification modal -->
    <div *ngIf="showBroadcast" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
        <h3 class="text-lg font-bold text-gray-900 mb-4">Send Notification</h3>
        <div class="space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Recipient</label>
            <select [(ngModel)]="broadcastTargetId"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option [ngValue]="null">Everyone</option>
              <option *ngFor="let m of members()" [ngValue]="m.userId">{{ m.name }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Title</label>
            <input [(ngModel)]="broadcastTitle" maxlength="200" placeholder="Notification title"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-600 mb-1">Message</label>
            <textarea [(ngModel)]="broadcastBody" maxlength="500" rows="3" placeholder="Write your message…"
              class="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"></textarea>
          </div>
          <p *ngIf="broadcastError" class="text-xs text-red-600">{{ broadcastError }}</p>
        </div>
        <div class="flex gap-3 mt-5">
          <button (click)="submitBroadcast()" [disabled]="broadcasting || !broadcastTitle.trim() || !broadcastBody.trim()"
            class="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {{ broadcasting ? 'Sending…' : 'Send' }}
          </button>
          <button (click)="closeBroadcast()"
            class="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50">
            Cancel
          </button>
        </div>
      </div>
    </div>

    <!-- Reset All Logs confirmation modal -->
    <div *ngIf="showResetConfirm" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
        <div class="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
          </svg>
        </div>
        <h3 class="text-lg font-bold text-gray-900 text-center mb-2">Reset All Logs?</h3>
        <p class="text-sm text-gray-500 text-center mb-6">
          This will permanently delete ALL logs, ratings, comments, and activities for every team member. This action cannot be undone.
        </p>
        <div class="flex gap-3">
          <button (click)="showResetConfirm = false" [disabled]="resetting"
            class="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50">
            Cancel
          </button>
          <button (click)="confirmReset()" [disabled]="resetting"
            class="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50">
            {{ resetting ? 'Resetting…' : 'Yes, reset everything' }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class TeamOverviewComponent implements OnInit {
  private readonly memberService = inject(MemberService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly adminService = inject(AdminService);
  private readonly notificationService = inject(NotificationService);

  members = signal<MemberSummary[]>([]);
  loading = signal(true);
  tableLoading = signal(false);
  totalItems = signal(0);
  private _nextPage = signal(0);
  private _lastPage = signal(true);

  currentPage = 0;
  readonly pageSize = PAGE_SIZE;
  activeTeam = 'All';
  activeModule = 'All';
  searchInput = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  teamFilters = ['All', 'TECHNICAL'];
  teams: TeamName[] = ['TECHNICAL'];
  moduleFilters: ModuleName[] = ['FRONTEND', 'BACKEND', 'TESTING', 'FLUTTER'];

  allLeads: MemberSummary[] = [];

  get isManager(): boolean { return this.auth.role === 'MANAGER'; }
  get teamLeads(): MemberSummary[] { return this.allLeads; }
  nextPage(): number { return this._nextPage(); }
  isLastPage(): boolean { return this._lastPage(); }

  get avgScore(): number {
    const scored = this.members().filter(m => m.kpiTotal != null);
    if (!scored.length) return 0;
    return scored.reduce((s, m) => s + (m.kpiTotal ?? 0), 0) / scored.length;
  }
  get atRiskCount(): number { return this.members().filter(m => (m.kpiTotal ?? 0) < 55 && m.kpiTotal != null).length; }
  get pendingCount(): number { return this.members().reduce((s, m) => s + m.unratedCount, 0); }
  min(a: number, b: number): number { return Math.min(a, b); }

  selectTeam(team: string): void {
    this.activeTeam = team;
    this.currentPage = 0;
    this.load();
  }

  selectModule(module: string): void {
    this.activeModule = module;
    this.currentPage = 0;
    this.load();
  }

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage = 0; this.load(); }, 350);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.load();
  }

  private load(initial = false): void {
    if (initial) {
      this.loading.set(true);
    } else {
      this.tableLoading.set(true);
    }
    const team = this.activeTeam !== 'All' ? this.activeTeam : undefined;
    const module = this.activeModule !== 'All' ? this.activeModule : undefined;
    const search = this.searchInput.trim() || undefined;
    this.memberService.getMembers({ team, module, search, page: this.currentPage, size: this.pageSize }).subscribe(res => {
      this.members.set(res.data);
      this.totalItems.set(res.totalItems);
      this._nextPage.set(res.nextPage);
      this._lastPage.set(res.lastPage);
      this.loading.set(false);
      this.tableLoading.set(false);
      this.cdr.markForCheck();
    });
  }

  // Create member modal
  showCreate = false;
  showFormPassword = false;
  creating = false;
  createError = '';
  form = { name: '', email: '', password: '', team: '' as TeamName | '', module: '' as ModuleName | '', role: 'MEMBER' as UserRole, teamLeadId: undefined as number | undefined };

  closeCreate(): void {
    this.showCreate = false;
    this.showFormPassword = false;
    this.createError = '';
    this.form = { name: '', email: '', password: '', team: '', module: '', role: 'MEMBER', teamLeadId: undefined };
  }

  submitCreate(): void {
    this.creating = true;
    this.createError = '';
    const req = {
      name: this.form.name.trim(),
      email: this.form.email.trim(),
      password: this.form.password,
      team: (this.form.team || undefined) as TeamName | undefined,
      module: (this.form.module || undefined) as ModuleName | undefined,
      role: this.form.role,
      teamLeadId: this.form.teamLeadId
    };
    this.memberService.createMember(req).subscribe({
      next: () => {
        this.creating = false;
        this.closeCreate();
        this.currentPage = 0;
        this.load();
      },
      error: err => {
        this.createError = err?.error?.message ?? 'Failed to create member.';
        this.creating = false;
        this.cdr.markForCheck();
      }
    });
  }

  // Broadcast notification modal
  showBroadcast = false;
  broadcastTargetId: number | null = null;
  broadcastTitle = '';
  broadcastBody = '';
  broadcastError = '';
  broadcasting = false;

  closeBroadcast(): void {
    this.showBroadcast = false;
    this.broadcastTitle = '';
    this.broadcastBody = '';
    this.broadcastError = '';
    this.broadcastTargetId = null;
  }

  submitBroadcast(): void {
    if (!this.broadcastTitle.trim() || !this.broadcastBody.trim()) return;
    this.broadcasting = true;
    this.broadcastError = '';
    this.notificationService.broadcast({
      targetUserId: this.broadcastTargetId ?? undefined,
      title: this.broadcastTitle.trim(),
      body: this.broadcastBody.trim()
    }).subscribe({
      next: () => { this.broadcasting = false; this.closeBroadcast(); this.cdr.markForCheck(); },
      error: () => { this.broadcastError = 'Failed to send notification.'; this.broadcasting = false; this.cdr.markForCheck(); }
    });
  }

  // Reset all logs modal
  showResetConfirm = false;
  resetting = false;

  confirmReset(): void {
    this.resetting = true;
    this.adminService.resetAllLogs().subscribe({
      next: () => {
        this.resetting = false;
        this.showResetConfirm = false;
        this.load();
        this.cdr.markForCheck();
      },
      error: () => {
        this.resetting = false;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.load(true);
    this.memberService.getLeads().subscribe(leads => {
      this.allLeads = leads;
      this.cdr.markForCheck();
    });
  }
}
