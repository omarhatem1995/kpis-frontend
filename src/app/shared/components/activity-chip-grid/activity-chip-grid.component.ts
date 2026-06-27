/**
 * Multi-select chip grid grouped by section.
 * Emits selectionChange with the array of selected keys on each toggle.
 */
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivityItem } from '../../../core/models/daily-log.model';

interface Section {
  label: string;
  items: ActivityItem[];
}

const SECTION_LABELS: Record<string, string> = {
  '1-functional': 'Functional',
  '2-dev': 'Development'
};

@Component({
  selector: 'app-activity-chip-grid',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <div *ngFor="let section of sections">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{{ section.label }}</p>
        <div class="flex flex-wrap gap-2">
          <button
            *ngFor="let item of section.items"
            type="button"
            class="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
            [class]="isSelected(item.key)
              ? 'bg-primary text-white border-primary'
              : 'bg-white text-gray-700 border-gray-300 hover:border-primary hover:text-primary'"
            (click)="toggle(item.key)"
          >{{ item.label }}</button>
        </div>
      </div>
    </div>
  `
})
export class ActivityChipGridComponent {
  @Input() activities: ActivityItem[] = [];
  @Input() selected: string[] = [];
  @Output() selectionChange = new EventEmitter<string[]>();

  get sections(): Section[] {
    const map = new Map<string, ActivityItem[]>();
    for (const a of this.activities) {
      if (!map.has(a.section)) map.set(a.section, []);
      map.get(a.section)!.push(a);
    }
    return Array.from(map.entries()).map(([key, items]) => ({
      label: SECTION_LABELS[key] ?? key,
      items
    }));
  }

  isSelected(key: string): boolean {
    return this.selected.includes(key);
  }

  toggle(key: string): void {
    const next = this.isSelected(key)
      ? this.selected.filter(k => k !== key)
      : [...this.selected, key];
    this.selectionChange.emit(next);
  }
}
