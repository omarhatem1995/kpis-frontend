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
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">Members</p>
          <p class="text-2xl font-semibold text-gray-900">{{ members().length }}</p>
        </div>
      </div>

      <!-- Team filter -->
      <div class="flex gap-2 mb-4 flex-wrap">
        <button *ngFor="let t of teamFilters" (click)="filter.set(t)"
          class="px-3 py-1 rounded-full text-xs font-medium border transition-all"
          [class]="filter() === t ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'">
          {{ t }}
        </button>
      </div>

      <!-- Member grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a *ngFor="let m of filteredMembers"
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
  filter = signal('All');
  teamFilters = ['All', 'Frontend', 'Backend', 'Testing', 'Flutter', 'Technical'];
  teams: TeamName[] = ['Frontend', 'Backend', 'Testing', 'Flutter', 'Technical'];

  get isManager(): boolean { return this.auth.role === 'MANAGER'; }
  get teamLeads(): MemberSummary[] { return this.members().filter(m => m.role === 'TEAM_LEAD' || m.role === 'MANAGER'); }

  showCreate = false;
  creating = false;
  createError = '';
  form = { name: '', email: '', password: '', team: '' as TeamName | '', module: '', role: 'MEMBER' as UserRole, teamLeadId: undefined as number | undefined };

  get filteredMembers(): MemberSummary[] {
    return this.filter() === 'All' ? this.members() : this.members().filter(m => m.team === this.filter());
  }

  get avgScore(): number {
    const scored = this.members().filter(m => m.kpiTotal != null);
    if (!scored.length) return 0;
    return scored.reduce((s, m) => s + (m.kpiTotal ?? 0), 0) / scored.length;
  }

  get atRiskCount(): number { return this.members().filter(m => (m.kpiTotal ?? 0) < 55 && m.kpiTotal != null).length; }
  get pendingCount(): number { return this.members().reduce((s, m) => s + m.unratedCount, 0); }

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
      next: m => {
        this.members.update(list => [...list, m]);
        this.creating = false;
        this.closeCreate();
        this.cdr.markForCheck();
      },
      error: err => {
        this.createError = err?.error?.error ?? 'Failed to create member.';
        this.creating = false;
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void { this.memberService.getMembers().subscribe(m => { this.members.set(m); this.loading.set(false); }); }
}
