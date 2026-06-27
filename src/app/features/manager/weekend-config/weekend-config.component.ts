import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberService } from '../../../core/services/member.service';
import { WeekendConfigResponse, UserWeekendOverride } from '../../../core/models/weekend-config.model';
import { DayOfWeek } from '../../../core/models/user.model';

const ALL_DAYS: DayOfWeek[] = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];

@Component({
  selector: 'app-weekend-config',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-2">Weekend Configuration</h2>
      <p class="text-sm text-gray-500 mb-6">Configure which days are non-working for the whole team or individuals.</p>

      <!-- Global weekends -->
      <div class="bg-white rounded-xl border border-gray-200 p-5 shadow-sm mb-5">
        <div class="flex items-center justify-between mb-1">
          <p class="text-sm font-semibold text-gray-900">Global weekends</p>
          <button (click)="saveGlobal()" [disabled]="savingGlobal()"
            class="bg-primary text-white px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50">
            {{ savingGlobal() ? 'Saving…' : 'Save' }}
          </button>
        </div>
        <p class="text-xs text-gray-400 mb-4">These apply to all team members unless overridden below.</p>
        <div class="flex flex-wrap gap-3">
          <label *ngFor="let d of allDays" class="flex items-center gap-2 cursor-pointer select-none">
            <input type="checkbox" [checked]="globalDays().includes(d)" (change)="toggleGlobal(d)" class="accent-primary" />
            <span class="text-sm text-gray-700">{{ d.charAt(0) + d.slice(1).toLowerCase() }}</span>
          </label>
        </div>
      </div>

      <!-- Per-user overrides -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div class="px-5 py-4 border-b border-gray-100">
          <p class="text-sm font-semibold text-gray-900">Per-person extra days off</p>
          <p class="text-xs text-gray-400 mt-0.5">Additional non-working days on top of global weekends.</p>
        </div>
        <div *ngFor="let ov of overrides(); let i = index" class="px-5 py-4 border-b border-gray-100 last:border-0">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 mb-2">{{ ov.memberName }}</p>
              <div class="flex flex-wrap gap-3">
                <label *ngFor="let d of allDays" class="flex items-center gap-1.5 cursor-pointer select-none">
                  <input type="checkbox"
                    [checked]="ov.extraDays.includes(d)"
                    (change)="toggleUserDay(i, d)"
                    class="accent-primary" />
                  <span class="text-xs text-gray-600">{{ d.charAt(0) + d.slice(1).toLowerCase() }}</span>
                </label>
              </div>
            </div>
            <div class="flex flex-col gap-1 shrink-0">
              <button (click)="saveUser(ov)"
                class="bg-primary text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-primary-hover">
                Save
              </button>
              <button (click)="clearUser(i, ov)"
                class="border border-gray-300 text-gray-500 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50">
                Clear
              </button>
            </div>
          </div>
        </div>
        <p *ngIf="!overrides().length" class="px-5 py-8 text-sm text-gray-400 text-center">
          No per-user overrides configured.
        </p>
      </div>
    </div>
  `
})
export class WeekendConfigComponent implements OnInit {
  private readonly memberService = inject(MemberService);

  config = signal<WeekendConfigResponse | null>(null);
  globalDays = signal<DayOfWeek[]>([]);
  overrides = signal<UserWeekendOverride[]>([]);
  savingGlobal = signal(false);
  allDays = ALL_DAYS;

  toggleGlobal(d: DayOfWeek): void {
    this.globalDays.update(days =>
      days.includes(d) ? days.filter(x => x !== d) : [...days, d]
    );
  }

  toggleUserDay(idx: number, d: DayOfWeek): void {
    this.overrides.update(ov => {
      const updated = [...ov];
      const item = { ...updated[idx] };
      item.extraDays = item.extraDays.includes(d)
        ? item.extraDays.filter(x => x !== d)
        : [...item.extraDays, d];
      updated[idx] = item;
      return updated;
    });
  }

  saveGlobal(): void {
    this.savingGlobal.set(true);
    this.memberService.updateGlobalWeekends(this.globalDays()).subscribe(() => this.savingGlobal.set(false));
  }

  saveUser(ov: UserWeekendOverride): void {
    this.memberService.updateUserWeekendOverride(ov.userId, ov.extraDays).subscribe();
  }

  clearUser(idx: number, ov: UserWeekendOverride): void {
    this.memberService.updateUserWeekendOverride(ov.userId, []).subscribe(() => {
      this.overrides.update(os => {
        const updated = [...os];
        updated[idx] = { ...ov, extraDays: [] };
        return updated;
      });
    });
  }

  ngOnInit(): void {
    this.memberService.getWeekendConfig().subscribe(cfg => {
      this.config.set(cfg);
      this.globalDays.set(cfg.globalDays);
      this.overrides.set(cfg.userOverrides);
    });
  }
}
