import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

type ProjectCategory = 'DEVELOPMENT' | 'REFACTOR' | 'SELF_STUDY';

interface Project {
  id: number;
  name: string;
  category: ProjectCategory | null;
  status: 'INITIATION' | 'IN_PROGRESS' | 'FINISHED';
  isActive: boolean;
}

@Component({
  selector: 'app-projects-manager',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <h1 class="text-xl font-semibold text-gray-900">Projects</h1>

      <!-- Add project form -->
      <div class="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <h2 class="text-sm font-semibold text-gray-700 mb-3">Add New Project</h2>
        <div class="flex gap-3 flex-wrap">
          <input
            [(ngModel)]="newName"
            placeholder="Project name"
            class="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <select
            [(ngModel)]="newCategory"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option [ngValue]="null">No category</option>
            <option value="DEVELOPMENT">Development</option>
            <option value="REFACTOR">Refactor</option>
            <option value="SELF_STUDY">Self Study</option>
          </select>
          <select
            [(ngModel)]="newStatus"
            class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="INITIATION">Initiation</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="FINISHED">Finished</option>
          </select>
          <button
            (click)="addProject()"
            [disabled]="!newName.trim() || saving()"
            class="bg-primary hover:bg-primary-hover text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ saving() ? 'Adding…' : 'Add Project' }}
          </button>
        </div>
        @if (error()) {
          <p class="mt-2 text-xs text-danger">{{ error() }}</p>
        }
      </div>

      <!-- Project list -->
      <div class="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        @if (loading()) {
          <div class="p-8 text-center text-sm text-gray-400">Loading projects…</div>
        } @else if (projects().length === 0) {
          <div class="p-8 text-center text-sm text-gray-400">No projects yet.</div>
        } @else {
          <table class="w-full text-sm">
            <thead>
              <tr class="border-b border-gray-100 bg-gray-50 text-left">
                <th class="px-4 py-3 font-semibold text-gray-600">Name</th>
                <th class="px-4 py-3 font-semibold text-gray-600">Category</th>
                <th class="px-4 py-3 font-semibold text-gray-600">Status</th>
                <th class="px-4 py-3 font-semibold text-gray-600">State</th>
                <th class="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              @for (p of projects(); track p.id) {
                <tr class="border-b border-gray-50 hover:bg-gray-50 transition-colors" [class.opacity-40]="!p.isActive">
                  <td class="px-4 py-3 font-medium text-gray-900">
                    @if (editingId() === p.id) {
                      <input
                        [(ngModel)]="editName"
                        class="border border-gray-300 rounded px-2 py-1 text-sm w-40 focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    } @else {
                      {{ p.name }}
                    }
                  </td>
                  <td class="px-4 py-3">
                    @if (editingId() === p.id) {
                      <select [(ngModel)]="editCategory"
                        class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option [ngValue]="null">No category</option>
                        <option value="DEVELOPMENT">Development</option>
                        <option value="REFACTOR">Refactor</option>
                        <option value="SELF_STUDY">Self Study</option>
                      </select>
                    } @else {
                      <span [class]="categoryClass(p.category)">{{ categoryLabel(p.category) }}</span>
                    }
                  </td>
                  <td class="px-4 py-3">
                    @if (editingId() === p.id) {
                      <select [(ngModel)]="editStatus"
                        class="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
                        <option value="INITIATION">Initiation</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="FINISHED">Finished</option>
                      </select>
                    } @else {
                      <span [class]="statusClass(p.status)">{{ statusLabel(p.status) }}</span>
                    }
                  </td>
                  <td class="px-4 py-3">
                    <span [class]="p.isActive ? 'text-success text-xs font-medium' : 'text-gray-400 text-xs font-medium'">
                      {{ p.isActive ? 'Active' : 'Removed' }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex gap-2 justify-end">
                      @if (editingId() === p.id) {
                        <button (click)="saveEdit(p)" class="text-xs text-primary font-medium hover:underline">Save</button>
                        <button (click)="cancelEdit()" class="text-xs text-gray-400 hover:underline">Cancel</button>
                      } @else {
                        <button (click)="startEdit(p)" class="text-xs text-gray-500 hover:text-primary font-medium">Edit</button>
                        @if (p.isActive) {
                          <button
                            (click)="removeProject(p)"
                            class="text-xs text-danger hover:underline font-medium"
                          >Remove</button>
                        } @else {
                          <button
                            (click)="restoreProject(p)"
                            class="text-xs text-success hover:underline font-medium"
                          >Restore</button>
                        }
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>
    </div>
  `
})
export class ProjectsManagerComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/manager/projects`;

  projects = signal<Project[]>([]);
  loading  = signal(true);
  saving   = signal(false);
  error    = signal('');

  newName     = '';
  newCategory: ProjectCategory | null = null;
  newStatus: Project['status'] = 'IN_PROGRESS';

  editingId   = signal<number | null>(null);
  editName    = '';
  editCategory: ProjectCategory | null = null;
  editStatus: Project['status'] = 'IN_PROGRESS';

  ngOnInit() {
    this.load();
  }

  private load() {
    this.loading.set(true);
    this.http.get<Project[]>(this.base).subscribe({
      next: list => { this.projects.set(list); this.loading.set(false); },
      error: ()  => this.loading.set(false)
    });
  }

  addProject() {
    if (!this.newName.trim()) return;
    this.saving.set(true);
    this.error.set('');
    this.http.post<Project>(this.base, { name: this.newName.trim(), category: this.newCategory, status: this.newStatus }).subscribe({
      next: p => {
        this.projects.update(list => [p, ...list]);
        this.newName = '';
        this.newCategory = null;
        this.newStatus = 'IN_PROGRESS';
        this.saving.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Failed to add project');
        this.saving.set(false);
      }
    });
  }

  startEdit(p: Project) {
    this.editingId.set(p.id);
    this.editName     = p.name;
    this.editCategory = p.category;
    this.editStatus   = p.status;
  }

  cancelEdit() { this.editingId.set(null); }

  saveEdit(p: Project) {
    this.http.patch<Project>(`${this.base}/${p.id}`, { name: this.editName, category: this.editCategory, status: this.editStatus }).subscribe({
      next: updated => {
        this.projects.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.editingId.set(null);
      }
    });
  }

  removeProject(p: Project) {
    this.http.patch<Project>(`${this.base}/${p.id}`, { isActive: false }).subscribe({
      next: updated => this.projects.update(list => list.map(x => x.id === updated.id ? updated : x))
    });
  }

  restoreProject(p: Project) {
    this.http.patch<Project>(`${this.base}/${p.id}`, { isActive: true }).subscribe({
      next: updated => this.projects.update(list => list.map(x => x.id === updated.id ? updated : x))
    });
  }

  categoryLabel(c: ProjectCategory | null): string {
    if (!c) return '—';
    return { DEVELOPMENT: 'Development', REFACTOR: 'Refactor', SELF_STUDY: 'Self Study' }[c];
  }

  categoryClass(c: ProjectCategory | null): string {
    const base = 'text-xs font-medium px-2 py-0.5 rounded-full ';
    if (!c) return base + 'bg-gray-100 text-gray-400';
    return base + ({
      DEVELOPMENT: 'bg-blue-100 text-blue-800',
      REFACTOR:    'bg-purple-100 text-purple-800',
      SELF_STUDY:  'bg-green-100 text-green-800'
    }[c]);
  }

  statusLabel(s: Project['status']): string {
    return { INITIATION: 'Initiation', IN_PROGRESS: 'In Progress', FINISHED: 'Finished' }[s];
  }

  statusClass(s: Project['status']): string {
    const base = 'text-xs font-medium px-2 py-0.5 rounded-full ';
    return base + ({
      INITIATION: 'bg-amber-100 text-amber-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      FINISHED:   'bg-green-100 text-green-800'
    }[s]);
  }
}
