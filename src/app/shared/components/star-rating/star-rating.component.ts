/**
 * 1–10 rating selector. Emits ratingChange when user selects a value.
 * Pass [readonly]=true to show without interaction.
 */
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex flex-wrap gap-1" [class.cursor-default]="readonly">
      <button
        *ngFor="let n of stars"
        type="button"
        class="w-8 h-8 rounded-lg text-sm font-semibold transition-colors"
        [class.cursor-pointer]="!readonly"
        [class.cursor-default]="readonly"
        [class.bg-amber-400]="n <= (hovered || rating)"
        [class.text-white]="n <= (hovered || rating)"
        [class.bg-gray-100]="n > (hovered || rating)"
        [class.text-gray-500]="n > (hovered || rating)"
        (click)="!readonly && select(n)"
        (mouseenter)="!readonly && (hovered = n)"
        (mouseleave)="!readonly && (hovered = 0)"
      >{{ n }}</button>
    </div>
    <p *ngIf="!readonly && rating > 0" class="text-xs text-gray-500 mt-1">Selected: {{ rating }}/10</p>
  `
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() readonly = false;
  @Output() ratingChange = new EventEmitter<number>();

  stars = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  hovered = 0;

  select(n: number): void {
    this.rating = n;
    this.ratingChange.emit(n);
  }
}
