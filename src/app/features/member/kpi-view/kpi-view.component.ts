import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LogService } from '../../../core/services/log.service';
import { KpiReport, KpiSection } from '../../../core/models/kpi-report.model';
import { ScorePillComponent } from '../../../shared/components/score-pill/score-pill.component';
import { KpiProgressBarComponent } from '../../../shared/components/kpi-progress-bar/kpi-progress-bar.component';

@Component({
  selector: 'app-kpi-view',
  standalone: true,
  imports: [CommonModule, FormsModule, ScorePillComponent, KpiProgressBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">KPI Score</h2>
        <select [(ngModel)]="selectedPeriod" (ngModelChange)="loadKpi()"
          class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option *ngFor="let m of months" [value]="m.value">{{ m.label }}</option>
        </select>
      </div>

      <div *ngIf="report(); else loading">
        <!-- Score hero -->
        <div class="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6 text-center">
          <p class="text-sm text-gray-500 mb-2">Overall Score</p>
          <p class="text-5xl font-bold mb-2" [ngClass]="scoreColour">
            {{ report()!.totalScore | number:'1.1-1' }}
          </p>
          <p class="text-gray-400 text-sm">out of 100</p>
          <div class="mt-3 flex justify-center">
            <app-score-pill [score]="report()!.totalScore" />
          </div>
        </div>

        <!-- Sections accordion -->
        <div class="space-y-3">
          <div *ngFor="let section of report()!.sections" class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <button
              type="button"
              class="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
              (click)="toggleSection(section.key)"
            >
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ section.title }}</p>
                <p class="text-xs text-gray-500 mt-0.5">{{ section.totalScore | number:'1.1-1' }} / {{ section.totalWeight }} pts</p>
              </div>
              <div class="flex items-center gap-3">
                <div class="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full"
                    [style.width.%]="section.totalWeight ? (section.totalScore / section.totalWeight) * 100 : 0">
                  </div>
                </div>
                <span class="text-gray-400 text-sm">{{ openSections.has(section.key) ? '▲' : '▼' }}</span>
              </div>
            </button>
            <div *ngIf="openSections.has(section.key)" class="px-4 pb-3 border-t border-gray-100">
              <app-kpi-progress-bar
                *ngFor="let item of section.items"
                [itemKey]="item.key"
                [label]="item.label"
                [earned]="item.score"
                [max]="item.weight"
                [tooltip]="item.tooltip"
              />
            </div>
          </div>
        </div>
      </div>

      <ng-template #loading>
        <div class="text-center py-12 text-gray-400 text-sm">Loading KPI data…</div>
      </ng-template>
    </div>
  `
})
export class KpiViewComponent implements OnInit {
  private readonly logService = inject(LogService);

  private readonly MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  report = signal<KpiReport | null>(null);
  openSections = new Set<string>();
  selectedPeriod: string;
  months: { value: string; label: string }[] = [];

  constructor() {
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      this.months.push({ value, label: `${this.MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
    }
    this.selectedPeriod = this.months[0].value;
  }

  get scoreColour(): string {
    const s = this.report()?.totalScore ?? 0;
    if (s >= 75) return 'text-green-600';
    if (s >= 55) return 'text-amber-600';
    return 'text-red-500';
  }

  toggleSection(key: string): void {
    this.openSections.has(key) ? this.openSections.delete(key) : this.openSections.add(key);
  }

  loadKpi(): void {
    this.report.set(null);
    this.logService.getMyKpi(this.selectedPeriod).subscribe(r => {
      this.report.set(r);
      this.openSections = new Set(r.sections.map(s => s.key));
    });
  }

  ngOnInit(): void { this.loadKpi(); }
}
