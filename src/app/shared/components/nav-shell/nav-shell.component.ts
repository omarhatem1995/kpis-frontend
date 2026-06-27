/**
 * Authenticated layout shell: top nav bar + sidebar + page content outlet.
 * Used by both member and manager feature routes.
 */
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { AvatarComponent } from '../avatar/avatar.component';

interface NavItem {
  label: string;
  route: string;
  icon: string;
}

const MEMBER_NAV: NavItem[] = [
  { label: 'Dashboard',  route: '/member/dashboard', icon: '▦' },
  { label: 'Log Today',  route: '/member/log',       icon: '✏' },
  { label: 'History',    route: '/member/history',   icon: '📋' },
  { label: 'KPI Score',  route: '/member/kpi',       icon: '📊' },
  { label: 'Leave',      route: '/member/leave',     icon: '🗓' }
];

const MANAGER_NAV: NavItem[] = [
  { label: 'Team',       route: '/manager/overview', icon: '👥' },
  { label: 'Pending',    route: '/manager/pending',  icon: '⭐' },
  { label: 'WFH',        route: '/manager/wfh',      icon: '🏠' },
  { label: 'Leave',      route: '/manager/leave',    icon: '🗓' },
  { label: 'Weekends',   route: '/manager/weekend',  icon: '📅' },
  { label: 'Projects',   route: '/manager/projects', icon: '🗂' },
  { label: 'Export',     route: '/manager/export',   icon: '⬇' }
];

@Component({
  selector: 'app-nav-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-surface flex flex-col">
      <!-- Top bar -->
      <header class="fixed top-0 inset-x-0 z-30 bg-white border-b border-gray-200 h-14 flex items-center px-4 gap-4">
        <span class="font-semibold text-primary text-sm tracking-wide">CIC Performance Portal</span>
        <span class="text-gray-300">|</span>
        <span class="text-xs text-gray-500 hidden sm:inline">{{ role === 'MANAGER' ? 'Manager View' : 'My Workspace' }}</span>
        <div class="flex-1"></div>
        <div class="flex items-center gap-3">
          <app-avatar [name]="userName" size="sm" />
          <span class="text-sm font-medium text-gray-700 hidden sm:inline">{{ userName }}</span>
          <button
            (click)="logout()"
            class="text-xs text-gray-500 hover:text-danger transition-colors px-2 py-1 rounded"
          >Sign out</button>
        </div>
      </header>

      <div class="flex pt-14 min-h-screen">
        <!-- Sidebar -->
        <nav class="fixed left-0 top-14 bottom-0 w-16 sm:w-48 bg-white border-r border-gray-200 flex flex-col py-4 z-20 overflow-y-auto">
          <a
            *ngFor="let item of navItems"
            [routerLink]="item.route"
            routerLinkActive="bg-blue-50 text-primary border-r-2 border-primary"
            class="flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm font-medium"
          >
            <span class="text-base shrink-0">{{ item.icon }}</span>
            <span class="hidden sm:inline truncate">{{ item.label }}</span>
          </a>
        </nav>

        <!-- Page content -->
        <main class="flex-1 ml-16 sm:ml-48 p-4 sm:p-6">
          <div class="max-w-4xl mx-auto">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `
})
export class NavShellComponent {
  private readonly auth = inject(AuthService);

  get role() { return this.auth.role; }
  get userName() { return this.auth.userName ?? ''; }
  get navItems(): NavItem[] { return this.role === 'MANAGER' ? MANAGER_NAV : MEMBER_NAV; }

  logout(): void { this.auth.logout(); }
}
