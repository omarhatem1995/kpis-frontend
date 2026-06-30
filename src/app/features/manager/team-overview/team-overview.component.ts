import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../core/services/member.service';
import { AuthService } from '../../../core/auth/auth.service';
import { MemberSummary, TeamName, UserRole } from '../../../core/models/user.model';
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

      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">Team Overview</h2>
        <button *ngIf="isManager" (click)="showCreate = true"
          class="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover">
          + Add member
        </button>
      </div>

      <!-- Stat cards -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">Total members</p>
          <p class="text-2xl font-semibold text-gray-900">{{ totalItems() }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">Avg team score</p>
          <p class="text-2xl font-semibold text-gray-900">{{ avgScore | number:'1.1-1' }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">At risk</p>
          <p class="text-2xl font-semibold text-red-600">{{ atRiskCount }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">Pending ratings</p>
          <p class="text-2xl font-semibold text-amber-600">{{ pendingCount }}</p>
        </div>
      </div>

      <!-- Search + Team filter -->
      <div class="flex flex-col sm:flex-row gap-3 mb-4">
        <input [(ngModel)]="searchInput" (ngModelChange)="onSearchChange()"
          type="text" placeholder="Search by name or email…"
          class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        <div class="flex gap-2 flex-wrap">
          <button *ngFor="let t of teamFilters" (click)="selectTeam(t)"
            class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            [class]="activeTeam === t ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'">
            {{ t }}
          </button>
        </div>
      </div>

      <!-- Member grid -->
      <div *ngIf="members().length > 0" class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <a *ngFor="let m of members()"
          [routerLink]="['/manager/member', m.userId]"
          class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow flex items-start gap-3">
          <app-avatar [name]="m.name" size="md" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 justify-between">
              <p class="text-sm font-semibold text-gray-900 truncate">{{ m.name }}</p>
              <app-score-pill [score]="m.kpiTotal" />
            </div>
            <p class="text-xs text-gray-500 mt-0.5">{{ m.team ?? 'No team' }} · {{ m.module ?? '—' }}</p>
            <div class="flex items-center gap-2 mt-2">
              <span *ngIf="m.unratedCount > 0"
                class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">
                {{ m.unratedCount }} to rate
              </span>
              <span class="text-xs text-gray-400">{{ m.logCountThisMonth }} logs this month</span>
            </div>
          </div>
        </a>
      </div>

      <!-- Empty state -->
      <div *ngIf="members().length === 0" class="text-center py-16 text-gray-400 text-sm">
        No members found.
      </div>

      <!-- Pagination -->
      <div *ngIf="totalItems() > pageSize" class="flex items-center justify-between mt-2">
        <p class="text-xs text-gray-500">
          Showing {{ currentPage * pageSize + 1 }}–{{ min(currentPage * pageSize + members().length, totalItems()) }}
          of {{ totalItems() }}
        </p>
        <div class="flex gap-2">
          <button (click)="goToPage(currentPage - 1)" [disabled]="currentPage === 0"
            class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
            ← Prev
          </button>
          <span class="px-3 py-1.5 text-sm text-gray-700 font-medium">Page {{ currentPage + 1 }}</span>
          <button (click)="goToPage(nextPage())" [disabled]="isLastPage()"
            class="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
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
            <input [(ngModel)]="form.password" type="password" placeholder="Initial password"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
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
            <input [(ngModel)]="form.module" type="text" placeholder="e.g. Backend, iOS, QA"
              class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
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
  `
})
export class TeamOverviewComponent implements OnInit {
  private readonly memberService = inject(MemberService);
  private readonly auth = inject(AuthService);
  private readonly cdr = inject(ChangeDetectorRef);

  members = signal<MemberSummary[]>([]);
  loading = signal(true);
  totalItems = signal(0);
  private _nextPage = signal(0);
  private _lastPage = signal(true);

  currentPage = 0;
  readonly pageSize = PAGE_SIZE;
  activeTeam = 'All';
  searchInput = '';
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  teamFilters = ['All', 'Frontend', 'Backend', 'Testing', 'Flutter', 'Technical'];
  teams: TeamName[] = ['Frontend', 'Backend', 'Testing', 'Flutter', 'Technical'];

  get isManager(): boolean { return this.auth.role === 'MANAGER'; }
  get teamLeads(): MemberSummary[] { return this.members().filter(m => m.role === 'TEAM_LEAD' || m.role === 'MANAGER'); }
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

  onSearchChange(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.currentPage = 0; this.load(); }, 350);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    const team = this.activeTeam !== 'All' ? this.activeTeam : undefined;
    const search = this.searchInput.trim() || undefined;
    this.memberService.getMembers({ team, search, page: this.currentPage, size: this.pageSize }).subscribe(res => {
      this.members.set(res.data);
      this.totalItems.set(res.totalItems);
      this._nextPage.set(res.nextPage);
      this._lastPage.set(res.lastPage);
      this.loading.set(false);
      this.cdr.markForCheck();
    });
  }

  // Create member modal
  showCreate = false;
  creating = false;
  createError = '';
  form = { name: '', email: '', password: '', team: '' as TeamName | '', module: '', role: 'MEMBER' as UserRole, teamLeadId: undefined as number | undefined };

  closeCreate(): void {
    this.showCreate = false;
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
      module: this.form.module.trim() || undefined,
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

  ngOnInit(): void { this.load(); }
}
