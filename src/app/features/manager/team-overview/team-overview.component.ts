import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MemberService } from '../../../core/services/member.service';
import { MemberSummary } from '../../../core/models/user.model';
import { AvatarComponent } from '../../../shared/components/avatar/avatar.component';
import { ScorePillComponent } from '../../../shared/components/score-pill/score-pill.component';
import { LoadingComponent } from '../../../shared/components/loading/loading.component';

@Component({
  selector: 'app-team-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, AvatarComponent, ScorePillComponent, LoadingComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <app-loading *ngIf="loading()" />
      <ng-container *ngIf="!loading()">
      <h2 class="text-lg font-semibold text-gray-900 mb-6">Team Overview</h2>

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

      <!-- Team filter by team -->
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
  `
})
export class TeamOverviewComponent implements OnInit {
  private readonly memberService = inject(MemberService);

  members = signal<MemberSummary[]>([]);
  loading = signal(true);
  filter = signal('All');
  teamFilters = ['All', 'Frontend', 'Backend', 'Testing', 'Flutter'];

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

  ngOnInit(): void { this.memberService.getMembers().subscribe(m => { this.members.set(m); this.loading.set(false); }); }
}
