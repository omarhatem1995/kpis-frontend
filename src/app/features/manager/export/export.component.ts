import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../core/services/member.service';
import { ExportService } from '../../../core/services/export.service';
import { MemberSummary } from '../../../core/models/user.model';

@Component({
  selector: 'app-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">Export KPI Reports</h2>
        <select [(ngModel)]="selectedQuarter"
          class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          <option *ngFor="let q of quarters" [value]="q.value">{{ q.label }}</option>
        </select>
      </div>

      <!-- Bulk download -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm mb-5 flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-900">Download selected as ZIP</p>
          <p class="text-xs text-gray-500">{{ selected().size }} member(s) selected</p>
        </div>
        <div class="flex items-center gap-3">
          <button (click)="selectAll()" class="text-xs text-primary hover:underline">Select all</button>
          <button (click)="clearSelected()" class="text-xs text-gray-400 hover:underline">Clear</button>
          <button (click)="downloadTeam()" [disabled]="selected().size === 0 || downloading()"
            class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover disabled:opacity-50">
            {{ downloading() ? 'Preparing…' : '⬇ Download ZIP' }}
          </button>
        </div>
      </div>

      <!-- Member table -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-4 py-3 w-8">
                <input type="checkbox" [checked]="allSelected" (change)="toggleAll()" class="accent-primary" />
              </th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Team</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">KPI</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let m of members()" class="border-b border-gray-100 last:border-0 hover:bg-gray-50">
              <td class="px-4 py-3">
                <input type="checkbox" [checked]="selected().has(m.userId)" (change)="toggle(m.userId)" class="accent-primary" />
              </td>
              <td class="px-4 py-3 font-medium text-gray-900">{{ m.name }}</td>
              <td class="px-4 py-3 text-gray-500">{{ m.team ?? '—' }}</td>
              <td class="px-4 py-3 text-gray-500">{{ m.kpiTotal != null ? (m.kpiTotal | number:'1.1-1') : '—' }}</td>
              <td class="px-4 py-3 text-right">
                <button (click)="downloadOne(m)" class="text-xs text-primary hover:underline">⬇ Excel</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class ExportComponent implements OnInit {
  private readonly memberService = inject(MemberService);
  private readonly exportService = inject(ExportService);

  members = signal<MemberSummary[]>([]);
  selected = signal(new Set<number>());
  downloading = signal(false);
  quarters: { value: string; label: string }[] = [];
  selectedQuarter = '';

  get allSelected(): boolean { return this.members().length > 0 && this.selected().size === this.members().length; }

  selectAll(): void { this.selected.set(new Set(this.members().map(m => m.userId))); }
  clearSelected(): void { this.selected.set(new Set()); }
  toggleAll(): void { this.allSelected ? this.clearSelected() : this.selectAll(); }
  toggle(id: number): void {
    const s = new Set(this.selected());
    s.has(id) ? s.delete(id) : s.add(id);
    this.selected.set(s);
  }

  downloadOne(m: MemberSummary): void {
    this.exportService.downloadMemberExcel(m.userId, this.selectedQuarter).subscribe(blob => {
      this.exportService.triggerDownload(blob, `KPI_${m.name.replace(' ', '_')}_${this.selectedQuarter}.xlsx`);
    });
  }

  downloadTeam(): void {
    this.downloading.set(true);
    this.exportService.downloadTeamZip(this.selectedQuarter).subscribe({
      next: blob => {
        this.exportService.triggerDownload(blob, `KPI_Team_${this.selectedQuarter}.zip`);
        this.downloading.set(false);
      },
      error: () => this.downloading.set(false)
    });
  }

  ngOnInit(): void {
    const now = new Date();
    for (let y = now.getFullYear(); y >= now.getFullYear() - 1; y--) {
      for (let q = 4; q >= 1; q--) this.quarters.push({ value: `${y}-Q${q}`, label: `Q${q} ${y}` });
    }
    this.selectedQuarter = `${now.getFullYear()}-Q${Math.ceil((now.getMonth() + 1) / 3)}`;
    this.memberService.getMembers({ size: 200 }).subscribe(res => this.members.set(res.data));
  }
}
