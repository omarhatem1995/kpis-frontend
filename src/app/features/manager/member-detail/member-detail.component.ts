import { Component, inject, signal, OnInit, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../core/services/member.service';
import { RatingService } from '../../../core/services/rating.service';
import { AuthService } from '../../../core/auth/auth.service';
import { MemberSummary, DayOfWeek, TeamName, ModuleName, UserRole } from '../../../core/models/user.model';
import { DailyLogResponse } from '../../../core/models/daily-log.model';
import { KpiReport } from '../../../core/models/kpi-report.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ScorePillComponent } from '../../../shared/components/score-pill/score-pill.component';
import { StarRatingComponent } from '../../../shared/components/star-rating/star-rating.component';
import { KpiProgressBarComponent } from '../../../shared/components/kpi-progress-bar/kpi-progress-bar.component';

const ALL_DAYS: DayOfWeek[] = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

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
              <button (click)="editProfile = !editProfile"
                class="text-sm border border-gray-300 text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-50">
                {{ editProfile ? 'Cancel' : 'Edit profile' }}
              </button>
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
            <select [(ngModel)]="editTeamLeadId" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
              <option [ngValue]="null">— none —</option>
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
            <input [(ngModel)]="newPassword" type="password" placeholder="New password (min 6 chars)"
              class="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
            <button (click)="savePassword()"
              [disabled]="newPassword.length < 6"
              class="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-50">
              Set password
            </button>
          </div>
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

      <!-- Logs list -->
      <h3 class="text-sm font-semibold text-gray-700 mb-3">All Logs</h3>
      <div class="space-y-3 mb-6">
        <div *ngFor="let log of logs()" class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <p class="text-sm font-medium text-gray-900">{{ log.logDate | date:'EEE, d MMM yyyy' }}</p>
            <span *ngIf="log.isUnscheduledWfh" class="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Unscheduled WFH</span>
          </div>
          <p class="text-xs text-gray-500 mb-2">{{ log.projectName }}</p>
          <p class="text-sm text-gray-700 line-clamp-2 mb-3">{{ log.tasksDescription }}</p>
          <div *ngIf="log.rating">
            <div *ngIf="editingRatingId !== log.id">
              <div class="flex items-center gap-2">
                <app-star-rating [rating]="log.rating.rating" [readonly]="true" />
                <span *ngIf="log.rating.isAutomated" class="text-xs text-gray-400 italic">(Auto)</span>
                <button (click)="openEditRating(log)" class="text-xs text-gray-400 hover:text-primary ml-auto">Edit rating</button>
              </div>
              <p *ngIf="log.rating.comment" class="text-xs text-gray-500 mt-1 italic">"{{ log.rating.comment }}"</p>
            </div>
            <div *ngIf="editingRatingId === log.id" class="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
              <p class="text-xs font-semibold text-gray-500 uppercase tracking-wider">Edit rating</p>
              <app-star-rating [rating]="editRatingValue" (ratingChange)="editRatingValue = $event" />
              <textarea [(ngModel)]="editRatingComment" rows="2" placeholder="Comment (optional)…"
                class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"></textarea>
              <div class="flex gap-2">
                <button (click)="saveEditRating(log)" [disabled]="editRatingValue === 0"
                  class="bg-primary text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50">Save</button>
                <button (click)="editingRatingId = null"
                  class="border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg text-sm">Cancel</button>
              </div>
            </div>
          </div>
          <div *ngIf="!log.rating" class="flex items-center gap-3">
            <app-star-rating [rating]="inlineRating(log.id)" (ratingChange)="setInlineRating(log.id, $event)" />
            <button (click)="quickRate(log)" [disabled]="inlineRating(log.id) === 0"
              class="text-xs bg-primary text-white px-3 py-1 rounded-lg disabled:opacity-50">Rate</button>
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
    </div>
  `
})
export class MemberDetailComponent implements OnInit {
  @Input() id!: string;

  private readonly memberService = inject(MemberService);
  private readonly ratingService = inject(RatingService);
  private readonly auth = inject(AuthService);

  get isManager(): boolean { return this.auth.role === 'MANAGER'; }

  member = signal<MemberSummary | null>(null);
  logs = signal<DailyLogResponse[]>([]);
  kpi = signal<KpiReport | null>(null);
  wfhDays = signal<DayOfWeek[]>([]);

  editProfile = false;
  editWfh = false;
  editName = '';
  editTeam: TeamName | '' = '';
  editModule: ModuleName | '' = '';
  editRole: UserRole = 'MEMBER';
  editTeamLeadId: number | null = null;
  teamLeads: MemberSummary[] = [];
  wfhDaysEdit: DayOfWeek[] = [];
  allDays = ALL_DAYS;
  teams: TeamName[] = ['TECHNICAL'];
  modules: ModuleName[] = ['FRONTEND', 'BACKEND', 'TESTING', 'FLUTTER'];
  openKpiSections = new Set<string>();
  private inlineRatings = new Map<number, number>();
  editingRatingId: number | null = null;
  editRatingValue = 0;
  editRatingComment = '';
  newPassword = '';
  passwordSaved = signal(false);

  inlineRating(id: number): number { return this.inlineRatings.get(id) ?? 0; }
  setInlineRating(id: number, r: number): void { this.inlineRatings.set(id, r); }

  toggleDay(d: DayOfWeek): void {
    this.wfhDaysEdit = this.wfhDaysEdit.includes(d)
      ? this.wfhDaysEdit.filter(x => x !== d)
      : [...this.wfhDaysEdit, d];
  }

  toggleKpiSection(key: string): void {
    this.openKpiSections.has(key) ? this.openKpiSections.delete(key) : this.openKpiSections.add(key);
  }

  savePassword(): void {
    this.memberService.setMemberPassword(+this.id, this.newPassword).subscribe(() => {
      this.newPassword = '';
      this.passwordSaved.set(true);
      setTimeout(() => this.passwordSaved.set(false), 3000);
    });
  }

  saveProfile(): void {
    const uid = +this.id;
    this.memberService.updateMember(uid, {
      name: this.editName || undefined,
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

  quickRate(log: DailyLogResponse): void {
    const rating = this.inlineRating(log.id);
    this.ratingService.submitRating(log.id, rating, '').subscribe(r => {
      this.logs.update(ls => ls.map(l => l.id === log.id ? { ...l, rating: r } : l));
    });
  }

  openEditRating(log: DailyLogResponse): void {
    if (!log.rating) return;
    this.editingRatingId = log.id;
    this.editRatingValue = log.rating.rating;
    this.editRatingComment = log.rating.comment ?? '';
  }

  saveEditRating(log: DailyLogResponse): void {
    if (!log.rating || this.editRatingValue === 0) return;
    this.ratingService.updateRating(log.rating.id, this.editRatingValue, this.editRatingComment).subscribe(r => {
      this.logs.update(ls => ls.map(l => l.id === log.id ? { ...l, rating: r } : l));
      this.editingRatingId = null;
    });
  }

  ngOnInit(): void {
    const uid = +this.id;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    this.memberService.getMember(uid).subscribe(m => {
      this.member.set(m);
      this.editName = m.name;
      this.editTeam = m.team ?? '';
      this.editModule = m.module ?? '';
      this.editRole = m.role;
      this.editTeamLeadId = m.teamLeadId;
    });
    this.memberService.getMembers({ size: 200 }).subscribe(res => {
      this.teamLeads = res.data.filter(m => m.role === 'TEAM_LEAD' || m.role === 'MANAGER');
    });
    this.memberService.getMemberLogs(uid, month).subscribe(logs => {
      this.logs.set([...logs].sort((a, b) => b.logDate.localeCompare(a.logDate)));
    });
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
