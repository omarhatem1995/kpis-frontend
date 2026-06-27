/**
 * Coloured pill badge: green ≥75, amber ≥55, red <55, grey for null/zero.
 */
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-score-pill',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="text-xs font-semibold px-2.5 py-0.5 rounded-full" [ngClass]="pillClass">
      {{ score != null ? (score | number:'1.1-1') + ' / 100' : 'Pending' }}
    </span>
  `
})
export class ScorePillComponent {
  @Input() score: number | null = null;

  get pillClass(): string {
    if (this.score == null || this.score === 0) return 'bg-gray-100 text-gray-500';
    if (this.score >= 75) return 'bg-green-100 text-green-800';
    if (this.score >= 55) return 'bg-amber-100 text-amber-800';
    return 'bg-red-100 text-red-800';
  }
}
