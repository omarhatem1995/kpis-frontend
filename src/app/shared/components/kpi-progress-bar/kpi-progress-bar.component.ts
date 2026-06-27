/**
 * Displays a KPI sub-item as a labelled progress bar.
 * Shows: label | earned / max | coloured fill bar.
 */
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-kpi-progress-bar',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-3 py-1">
      <span class="text-xs text-gray-600 w-6 font-mono shrink-0">{{ itemKey }}</span>
      <span class="text-xs text-gray-700 flex-1 min-w-0">{{ label }}</span>
      <span class="text-xs font-semibold shrink-0 w-16 text-right" [ngClass]="scoreClass">
        {{ earned | number:'1.1-1' }} / {{ max }}
      </span>
      <div class="w-24 h-2 bg-gray-200 rounded-full overflow-hidden shrink-0">
        <div class="h-full rounded-full transition-all" [ngClass]="barClass" [style.width.%]="pct"></div>
      </div>
    </div>
  `
})
export class KpiProgressBarComponent {
  @Input() itemKey = '';
  @Input() label = '';
  @Input() earned = 0;
  @Input() max = 0;
  @Input() tooltip = '';

  get pct(): number {
    return this.max > 0 ? Math.min(100, (this.earned / this.max) * 100) : 0;
  }

  get scoreClass(): string {
    if (this.pct >= 75) return 'text-green-600';
    if (this.pct >= 55) return 'text-amber-600';
    return 'text-red-500';
  }

  get barClass(): string {
    if (this.pct >= 75) return 'bg-green-500';
    if (this.pct >= 55) return 'bg-amber-500';
    return 'bg-red-500';
  }
}
