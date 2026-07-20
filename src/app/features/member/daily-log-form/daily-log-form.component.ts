import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LogService } from '../../../core/services/log.service';
import { MemberService } from '../../../core/services/member.service';
import { AuthService } from '../../../core/auth/auth.service';
import { ActivityChipGridComponent } from '../../../shared/components/activity-chip-grid/activity-chip-grid.component';
import { CollaboratorPickerComponent, CollaboratorOption } from '../../../shared/components/collaborator-picker/collaborator-picker.component';
import { ActivityItem, ProjectItem, SelfLearning, Location, DailyLogResponse } from '../../../core/models/daily-log.model';

const SELF_LEARNING_LABELS: Record<SelfLearning, string> = {
  NONE: 'None',
  COURSE: 'Online course / tutorial',
  CERT: 'Certification study',
  DOCS: 'Reading documentation',
  POC: 'Built a PoC / experiment',
  ARTICLE: 'Read technical article'
};

@Component({
  selector: 'app-daily-log-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ActivityChipGridComponent, CollaboratorPickerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div>
      <div class="flex items-center gap-2 mb-6">
        <h2 class="text-lg font-semibold text-gray-900">{{ editLogId ? 'Edit Task' : 'New Task' }}</h2>
        @if (editLogId) {
          <span class="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">Editing</span>
        }
      </div>

      <!-- Date toggle (only for new logs) -->
      @if (!editLogId) {
        <div class="flex gap-2 mb-6">
          <button type="button" (click)="selectedDate = 'today'"
            class="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
            [class.bg-primary]="selectedDate === 'today'"
            [class.text-white]="selectedDate === 'today'"
            [class.border-primary]="selectedDate === 'today'"
            [class.border-gray-200]="selectedDate !== 'today'"
            [class.text-gray-600]="selectedDate !== 'today'">
            Today — {{ todayLabel }}
          </button>
          <button type="button" (click)="selectedDate = 'yesterday'"
            class="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
            [class.bg-primary]="selectedDate === 'yesterday'"
            [class.text-white]="selectedDate === 'yesterday'"
            [class.border-primary]="selectedDate === 'yesterday'"
            [class.border-gray-200]="selectedDate !== 'yesterday'"
            [class.text-gray-600]="selectedDate !== 'yesterday'">
            Yesterday — {{ yesterdayLabel }}
          </button>
        </div>
      }

      <!-- Step progress -->
      <div class="flex gap-1 mb-8">
        <div *ngFor="let s of steps; let i = index"
          class="flex-1 h-1.5 rounded-full transition-colors"
          [class.bg-primary]="i <= step()"
          [class.bg-gray-200]="i > step()">
        </div>
      </div>

      <!-- Step 1: Project -->
      <div *ngIf="step() === 0">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Step 1 — Project <span class="text-danger normal-case font-normal">* required</span>
        </p>
        <div class="relative">
          <input
            [(ngModel)]="projectSearch"
            (ngModelChange)="onProjectSearch()"
            (focus)="showDropdown.set(true)"
            (blur)="onProjectBlur()"
            placeholder="Search and select a project…"
            autocomplete="off"
            class="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            [class.border-gray-300]="form.projectId || !projectTouched"
            [class.border-danger]="!form.projectId && projectTouched"
          />
          @if (form.projectId) {
            <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary font-medium">✓ selected</span>
          }
          @if (showDropdown() && filteredProjects().length > 0) {
            <ul class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
              @for (p of filteredProjects(); track p.id) {
                <li
                  (mousedown)="selectProject(p)"
                  class="px-3 py-2 text-sm cursor-pointer hover:bg-blue-50 hover:text-primary transition-colors"
                  [class.bg-blue-50]="form.projectId === p.id"
                  [class.text-primary]="form.projectId === p.id"
                >{{ p.name }}</li>
              }
            </ul>
          }
          @if (showDropdown() && projectSearch.length > 0 && filteredProjects().length === 0) {
            <div class="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow px-3 py-2 text-sm text-gray-400">
              No projects match "{{ projectSearch }}"
            </div>
          }
        </div>
        @if (form.projectId) {
          <p class="mt-1.5 text-xs text-gray-500">Selected: <span class="font-medium text-gray-700">{{ selectedProjectName() }}</span></p>
        }
        @if (!form.projectId && projectTouched) {
          <p class="mt-1.5 text-xs text-danger">Please select a project before continuing.</p>
        }
      </div>

      <!-- Step 2: Activities -->
      <div *ngIf="step() === 1">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 2 — Activity types</p>
        <app-activity-chip-grid
          [activities]="activities()"
          [selected]="form.activities"
          (selectionChange)="form.activities = $event"
        />
        <p *ngIf="form.activities.length === 0" class="text-xs text-danger mt-2">Select at least one activity.</p>
      </div>

      <!-- Step 3: Self-learning -->
      <div *ngIf="step() === 2">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 3 — Self-learning</p>
        <select [(ngModel)]="form.selfLearning" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent mb-3">
          <option *ngFor="let opt of selfLearningOptions" [value]="opt.value">{{ opt.label }}</option>
        </select>
        <div *ngIf="form.selfLearning !== 'NONE'">
          <label class="block text-sm font-medium text-gray-700 mb-1">What did you study?</label>
          <input [(ngModel)]="form.selfLearningNote" type="text" placeholder="e.g. Docker networking tutorial"
            class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent" />
        </div>
      </div>

      <!-- Step 4: Collaborators -->
      <div *ngIf="step() === 3">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 4 — Collaboration <span class="text-gray-300 normal-case font-normal">(optional)</span></p>
        <app-collaborator-picker
          [members]="collaborators()"
          [selected]="form.collaboratorIds"
          (selectionChange)="form.collaboratorIds = $event"
        />
      </div>

      <!-- Step 5: Work details -->
      <div *ngIf="step() === 4">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 5 — Work details</p>
        <label class="block text-sm font-medium text-gray-700 mb-1">What did you deliver or work on today? <span class="text-danger">*</span></label>
        <textarea [(ngModel)]="form.tasksDescription" rows="5" placeholder="Describe your tasks in detail…"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none mb-1">
        </textarea>
        <p class="text-xs mb-3"
          [class.text-gray-400]="form.tasksDescription.trim().length >= 20"
          [class.text-danger]="form.tasksDescription.trim().length > 0 && form.tasksDescription.trim().length < 20">
          {{ form.tasksDescription.trim().length }}/20 characters minimum
        </p>
        <label class="block text-sm font-medium text-gray-700 mb-1">Any blockers or issues? <span class="text-gray-400 font-normal">(optional)</span></label>
        <textarea [(ngModel)]="form.blockers" rows="2" placeholder="Describe any blockers…"
          class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none">
        </textarea>
      </div>

      <!-- Step 6: Location -->
      <div *ngIf="step() === 5">
        <p class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Step 6 — Location</p>
        <div class="flex gap-4 mb-4">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" [(ngModel)]="form.location" value="OFFICE" class="accent-primary" />
            <span class="text-sm font-medium text-gray-700">Office</span>
          </label>
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="radio" [(ngModel)]="form.location" value="WFH" class="accent-primary" />
            <span class="text-sm font-medium text-gray-700">Working from home (WFH)</span>
          </label>
        </div>
        <div *ngIf="form.location === 'WFH' && !isScheduledWfh()"
          class="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
          <span class="text-danger shrink-0">⚠</span>
          <p class="text-sm text-red-700">
            This day is not in your approved WFH schedule.
            Submitting as WFH on an unscheduled day will affect your attendance score.
          </p>
        </div>
        <div *ngIf="submitError()" class="mt-3 text-sm text-danger">{{ submitError() }}</div>
      </div>

      <!-- Navigation -->
      <div class="flex justify-between mt-8">
        <button *ngIf="step() > 0" type="button" (click)="prev()"
          class="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
          Back
        </button>
        <div *ngIf="step() === 0"></div>

        <button *ngIf="step() < 5" type="button" (click)="next()" [disabled]="!canAdvance()"
          class="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
          Continue
        </button>

        <button *ngIf="step() === 5" type="button" (click)="submit()" [disabled]="submitting()"
          class="bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
          {{ submitting() ? 'Saving…' : (editLogId ? 'Save changes' : 'Submit task') }}
        </button>
      </div>
    </div>
  `
})
export class DailyLogFormComponent implements OnInit {
  private readonly logService = inject(LogService);
  private readonly memberService = inject(MemberService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  editLogId: number | null = null;

  step = signal(0);
  steps = [0, 1, 2, 3, 4, 5];
  projects = signal<ProjectItem[]>([]);
  activities = signal<ActivityItem[]>([]);
  collaborators = signal<CollaboratorOption[]>([]);
  submitting = signal(false);
  submitError = signal('');
  showDropdown = signal(false);
  filteredProjects = signal<ProjectItem[]>([]);
  projectSearch = '';
  projectTouched = false;

  form = {
    projectId: null as number | null,
    activities: [] as string[],
    selfLearning: 'NONE' as SelfLearning,
    selfLearningNote: '',
    tasksDescription: '',
    blockers: '',
    location: 'OFFICE' as Location,
    collaboratorIds: [] as number[]
  };

  selectedDate: 'today' | 'yesterday' = 'today';

  get todayLabel(): string {
    return new Date().toLocaleDateString('en-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  get yesterdayLabel(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toLocaleDateString('en-EG', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  get selfLearningOptions() {
    return (Object.entries(SELF_LEARNING_LABELS) as [SelfLearning, string][]).map(([value, label]) => ({ value, label }));
  }

  onProjectSearch(): void {
    const q = this.projectSearch.toLowerCase();
    this.filteredProjects.set(this.projects().filter(p => p.name.toLowerCase().includes(q)));
    this.showDropdown.set(true);
    if (!q) this.form.projectId = null;
  }

  onProjectBlur(): void {
    this.projectTouched = true;
    this.showDropdown.set(false);
  }

  selectProject(p: ProjectItem): void {
    this.form.projectId = p.id;
    this.projectSearch = p.name;
    this.showDropdown.set(false);
  }

  selectedProjectName(): string {
    return this.projects().find(p => p.id === this.form.projectId)?.name ?? '';
  }

  isScheduledWfh(): boolean {
    const day = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][new Date().getDay()] as import('../../../core/models/user.model').DayOfWeek;
    return this.auth.wfhSchedule.includes(day);
  }

  canAdvance(): boolean {
    switch (this.step()) {
      case 0: return !!this.form.projectId;
      case 1: return this.form.activities.length > 0;
      case 4: return this.form.tasksDescription.trim().length >= 20;
      default: return true;
    }
  }

  get projectHasSelfStudy(): boolean {
    if (!this.form.projectId) return false;
    const p = this.projects().find(x => x.id === this.form.projectId);
    return p?.category === 'SELF_STUDY';
  }

  next(): void {
    if (!this.canAdvance()) return;
    const next = this.step() + 1;
    if (next === 2 && !this.projectHasSelfStudy) {
      this.form.selfLearning = 'NONE';
      this.form.selfLearningNote = '';
      this.step.set(3);
    } else {
      this.step.set(next);
    }
  }

  prev(): void {
    const prev = this.step() - 1;
    if (prev === 2 && !this.projectHasSelfStudy) {
      this.step.set(1);
    } else {
      this.step.set(prev);
    }
  }

  submit(): void {
    this.submitting.set(true);
    this.submitError.set('');
    const d = new Date();
    if (this.selectedDate === 'yesterday') d.setDate(d.getDate() - 1);
    const logDate = this.formatDate(d);

    const payload = {
      logDate,
      projectId: this.form.projectId,
      activities: this.form.activities,
      tasksDescription: this.form.tasksDescription,
      blockers: this.form.blockers,
      selfLearning: this.form.selfLearning,
      selfLearningNote: this.form.selfLearningNote,
      location: this.form.location,
      collaboratorIds: this.form.collaboratorIds
    };

    const request$ = this.editLogId
      ? this.logService.updateLog(this.editLogId, payload)
      : this.logService.submitLog(payload);

    request$.subscribe({
      next: () => this.router.navigate(['/member/dashboard'], { state: { success: true } }),
      error: err => {
        this.submitting.set(false);
        this.submitError.set(err?.error?.message ?? 'Failed to save. Please try again.');
      }
    });
  }

  ngOnInit(): void {
    this.logService.getProjects().subscribe(p => { this.projects.set(p); this.filteredProjects.set(p); });
    this.logService.getActivities().subscribe(a => this.activities.set(a));
    this.memberService.getTeammates().subscribe(members => {
      this.collaborators.set(members.map(m => ({ userId: m.userId, name: m.name, team: m.team })));
    });

    const editId = this.route.snapshot.queryParamMap.get('editId');
    if (editId) {
      this.editLogId = +editId;
      const log: DailyLogResponse | undefined = history.state?.log;
      if (log) {
        this.form.projectId = log.projectId;
        this.form.activities = log.activities.map(a => a.key);
        this.form.selfLearning = log.selfLearning;
        this.form.selfLearningNote = log.selfLearningNote ?? '';
        this.form.tasksDescription = log.tasksDescription;
        this.form.blockers = log.blockers ?? '';
        this.form.location = log.location;
        this.form.collaboratorIds = log.collaborators?.map(c => c.userId) ?? [];
        if (log.projectName) {
          this.projectSearch = log.projectName;
        }
      }
    }
  }
}
