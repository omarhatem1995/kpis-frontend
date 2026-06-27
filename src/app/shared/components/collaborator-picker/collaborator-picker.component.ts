/**
 * Multi-select chip grid of team members with search and team filter.
 * Emits selectionChange with array of selected user IDs.
 */
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AvatarComponent } from '../avatar/avatar.component';

export interface CollaboratorOption {
  userId: number;
  name: string;
  team: string | null;
}

@Component({
  selector: 'app-collaborator-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.Default,
  template: `
    <div class="space-y-3">
      <!-- Search + team filter row -->
      <div class="flex gap-2 flex-wrap">
        <input
          [(ngModel)]="search"
          (ngModelChange)="applyFilter()"
          placeholder="Search by name…"
          class="flex-1 min-w-40 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        <div class="flex gap-1 flex-wrap">
          <button type="button"
            (click)="setTeam(null)"
            class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            [class]="activeTeam === null ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'"
          >All</button>
          <button type="button" *ngFor="let t of teams"
            (click)="setTeam(t)"
            class="px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
            [class]="activeTeam === t ? 'bg-primary text-white border-primary' : 'bg-white text-gray-600 border-gray-300 hover:border-primary'"
          >{{ t }}</button>
        </div>
      </div>

      <!-- Selected summary -->
      <p *ngIf="selected.length" class="text-xs text-primary font-medium">
        {{ selected.length }} selected
        <button type="button" (click)="clearAll()" class="ml-2 text-gray-400 hover:text-danger underline">Clear</button>
      </p>

      <!-- Chips -->
      <div class="flex flex-wrap gap-2">
        <button
          *ngFor="let m of filtered"
          type="button"
          class="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
          [class]="isSelected(m.userId)
            ? 'bg-primary text-white border-primary'
            : 'bg-white text-gray-700 border-gray-300 hover:border-primary'"
          (click)="toggle(m.userId)"
        >
          <app-avatar [name]="m.name" size="sm" />
          {{ m.name.split(' ')[0] }}
          <span *ngIf="m.team" class="text-xs opacity-70">({{ m.team }})</span>
        </button>
        <p *ngIf="filtered.length === 0" class="text-sm text-gray-400">No members match your filter.</p>
      </div>
    </div>
    <p *ngIf="!members.length" class="text-sm text-gray-400">No team members available.</p>
  `
})
export class CollaboratorPickerComponent implements OnChanges {
  @Input() members: CollaboratorOption[] = [];
  @Input() selected: number[] = [];
  @Output() selectionChange = new EventEmitter<number[]>();

  search = '';
  activeTeam: string | null = null;
  filtered: CollaboratorOption[] = [];
  teams: string[] = [];

  ngOnChanges(): void {
    this.teams = [...new Set(this.members.map(m => m.team).filter((t): t is string => !!t))];
    this.applyFilter();
  }

  applyFilter(): void {
    const q = this.search.toLowerCase();
    this.filtered = this.members.filter(m => {
      const matchesName = !q || m.name.toLowerCase().includes(q);
      const matchesTeam = !this.activeTeam || m.team === this.activeTeam;
      return matchesName && matchesTeam;
    });
  }

  setTeam(team: string | null): void {
    this.activeTeam = team;
    this.applyFilter();
  }

  isSelected(id: number): boolean {
    return this.selected.includes(id);
  }

  toggle(id: number): void {
    const next = this.isSelected(id)
      ? this.selected.filter(x => x !== id)
      : [...this.selected, id];
    this.selectionChange.emit(next);
  }

  clearAll(): void {
    this.selectionChange.emit([]);
  }
}
