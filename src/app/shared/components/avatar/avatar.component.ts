/**
 * Displays user initials in a circle with a deterministic colour derived from the name.
 */
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

const PALETTE = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-600', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-600', 'bg-indigo-500', 'bg-teal-600'
];

@Component({
  selector: 'app-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="flex items-center justify-center rounded-full text-white font-semibold select-none shrink-0"
      [class]="sizeClass + ' ' + colour"
    >{{ initials }}</div>
  `
})
export class AvatarComponent {
  @Input() name = '';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';

  get initials(): string {
    return this.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }

  get colour(): string {
    let hash = 0;
    for (const c of this.name) hash = (hash * 31 + c.charCodeAt(0)) & 0xffff;
    return PALETTE[hash % PALETTE.length];
  }

  get sizeClass(): string {
    return { sm: 'w-7 h-7 text-xs', md: 'w-9 h-9 text-sm', lg: 'w-14 h-14 text-lg' }[this.size];
  }
}
