/**
 * 1–5 star rating selector. Emits ratingChange when user selects a star.
 * Pass [readonly]=true to show stars without interaction.
 */
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex gap-1" [class.cursor-default]="readonly">
      <button
        *ngFor="let star of stars"
        type="button"
        class="text-2xl transition-transform"
        [class.cursor-pointer]="!readonly"
        [class.cursor-default]="readonly"
        [class.hover:scale-110]="!readonly"
        (click)="!readonly && select(star)"
        (mouseenter)="!readonly && (hovered = star)"
        (mouseleave)="!readonly && (hovered = 0)"
      >
        <span [class.text-amber-400]="star <= (hovered || rating)" [class.text-gray-300]="star > (hovered || rating)">★</span>
      </button>
    </div>
  `
})
export class StarRatingComponent {
  @Input() rating = 0;
  @Input() readonly = false;
  @Output() ratingChange = new EventEmitter<number>();

  stars = [1, 2, 3, 4, 5];
  hovered = 0;

  select(star: number): void {
    this.rating = star;
    this.ratingChange.emit(star);
  }
}
