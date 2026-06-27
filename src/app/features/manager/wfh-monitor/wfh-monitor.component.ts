import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MemberService } from '../../../core/services/member.service';
import { WfhMonitorEntry } from '../../../core/models/weekend-config.model';

@Component({
  selector: 'app-wfh-monitor',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-gray-900">WFH Monitor</h2>
        <input type="month" [(ngModel)]="selectedMonth" (ngModelChange)="load()"
          class="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
      </div>

      <!-- Summary -->
      <div class="grid grid-cols-2 gap-3 mb-6">
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">Approved WFH</p>
          <p class="text-2xl font-semibold text-blue-600">{{ approvedCount }}</p>
        </div>
        <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <p class="text-xs text-gray-500 mb-1">Unscheduled WFH</p>
          <p class="text-2xl font-semibold text-red-600">{{ unscheduledCount }}</p>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Member</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Day</th>
              <th class="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let entry of entries()"
              class="border-b border-gray-100 last:border-0"
              [class.border-l-4]="entry.type === 'UNSCHEDULED'"
              [class.border-l-red-400]="entry.type === 'UNSCHEDULED'">
              <td class="px-4 py-3 font-medium text-gray-900">{{ entry.memberName }}</td>
              <td class="px-4 py-3 text-gray-600">{{ entry.date | date:'d MMM yyyy' }}</td>
              <td class="px-4 py-3 text-gray-600 capitalize">{{ entry.dayOfWeek.toLowerCase() }}</td>
              <td class="px-4 py-3">
                <span class="text-xs font-medium px-2 py-0.5 rounded-full"
                  [class]="entry.type === 'APPROVED' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'">
                  {{ entry.type === 'APPROVED' ? 'Approved' : 'Unscheduled' }}
                </span>
              </td>
            </tr>
            <tr *ngIf="!entries().length">
              <td colspan="4" class="px-4 py-8 text-center text-sm text-gray-400">No WFH entries for this month.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class WfhMonitorComponent implements OnInit {
  private readonly memberService = inject(MemberService);

  entries = signal<WfhMonitorEntry[]>([]);
  selectedMonth: string;

  constructor() {
    const now = new Date();
    this.selectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  get approvedCount(): number { return this.entries().filter(e => e.type === 'APPROVED').length; }
  get unscheduledCount(): number { return this.entries().filter(e => e.type === 'UNSCHEDULED').length; }

  load(): void {
    this.memberService.getWfhMonitor(this.selectedMonth).subscribe(e => this.entries.set(e));
  }

  ngOnInit(): void { this.load(); }
}
