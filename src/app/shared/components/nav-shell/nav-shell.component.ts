import { Component, inject, signal, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { AppNotification } from '../../../core/models/notification.model';
import { AvatarComponent } from '../avatar/avatar.component';

interface NavItem { label: string; route: string; icon: string; }

const MEMBER_NAV: NavItem[] = [
  { label: 'Dashboard',  route: '/member/dashboard',       icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Log Today',  route: '/member/log',             icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' },
  { label: 'History',   route: '/member/history',          icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { label: 'KPI Score', route: '/member/kpi',              icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: 'Leave',     route: '/member/leave',            icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Password',  route: '/member/changePassword',   icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
];

const MANAGER_NAV: NavItem[] = [
  { label: 'Team',      route: '/manager/overview',        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
  { label: 'Pending',   route: '/manager/pending',         icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { label: 'WFH',       route: '/manager/wfh',             icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: 'Leave',     route: '/manager/leave',           icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { label: 'Weekends',  route: '/manager/weekend',         icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: 'Projects',  route: '/manager/projects',        icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
  { label: 'Export',    route: '/manager/export',          icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' },
  { label: 'Password',  route: '/manager/changePassword',  icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
];

const TYPE_ICON: Record<string, string> = {
  TASK_COMMENT:         '💬',
  TASK_MENTION:         '📣',
  TASK_COLLABORATION:   '🤝',
  LEAVE_REQUEST:        '📅',
  WFH_REQUEST:          '🏠',
  PASSWORD_CHANGE:      '🔑',
  TASK_RATING_SUBMITTED:'⭐',
  RATING_WARNING:       '⚠️',
  MANAGER_NOTIFICATION: '📢',
  TEAM_LEAD_NOTIFICATION:'📢',
};

@Component({
  selector: 'app-nav-shell',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, AvatarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-surface flex flex-col">

      <!-- Top bar -->
      <header class="fixed top-0 inset-x-0 z-30 bg-white shadow-sm h-14 flex items-center px-5 gap-3">
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
            <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <span class="font-bold text-gray-900 text-sm hidden sm:inline">CIC Performance</span>
        </div>
        <div class="flex-1"></div>
        <div class="flex items-center gap-3">

          <!-- Notification bell -->
          <div class="relative">
            <button (click)="toggleNotifPanel()" class="relative p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
              <span *ngIf="unread() > 0"
                class="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {{ unread() > 99 ? '99+' : unread() }}
              </span>
            </button>

            <!-- Notification dropdown -->
            <div *ngIf="showNotifPanel"
              class="absolute right-0 top-10 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden">
              <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span class="font-semibold text-gray-900 text-sm">Notifications</span>
                <button *ngIf="unread() > 0" (click)="markAllSeen()"
                  class="text-xs text-primary hover:underline">Mark all read</button>
              </div>
              <div class="max-h-96 overflow-y-auto divide-y divide-gray-50">
                <ng-container *ngIf="notifications().length > 0; else noNotifs">
                  <div *ngFor="let n of notifications()"
                    (click)="onNotifClick(n)"
                    class="flex gap-3 px-4 py-3 cursor-pointer transition-colors"
                    [class.bg-blue-50]="!n.seen"
                    [class.hover:bg-gray-50]="n.seen"
                    [class.hover:bg-blue-100]="!n.seen">
                    <span class="text-xl leading-none mt-0.5 shrink-0">{{ typeIcon(n.type) }}</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 truncate">{{ n.title }}</p>
                      <p class="text-xs text-gray-500 mt-0.5 line-clamp-2">{{ n.body }}</p>
                      <p class="text-[10px] text-gray-400 mt-1">{{ timeAgo(n.createdAt) }}</p>
                    </div>
                    <div *ngIf="!n.seen" class="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5"></div>
                  </div>
                </ng-container>
                <ng-template #noNotifs>
                  <p class="text-center text-sm text-gray-400 py-10">No notifications yet</p>
                </ng-template>
              </div>
              <div *ngIf="hasMore" class="px-4 py-2 border-t border-gray-100 text-center">
                <button (click)="loadMore()" class="text-xs text-primary hover:underline">Load more</button>
              </div>
            </div>
          </div>

          <div class="hidden sm:flex flex-col items-end">
            <span class="text-sm font-semibold text-gray-900 leading-tight">{{ userName }}</span>
            <span class="text-xs text-gray-400">{{ roleLabel }}</span>
          </div>
          <app-avatar [name]="userName" size="sm" />
          <button (click)="logout()"
            class="ml-1 p-1.5 rounded-lg text-gray-400 hover:text-danger hover:bg-red-50 transition-colors">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
          </button>
        </div>
      </header>

      <!-- Click-outside overlay to close panel -->
      <div *ngIf="showNotifPanel" class="fixed inset-0 z-40" (click)="showNotifPanel = false"></div>

      <div class="flex pt-14 min-h-screen">

        <!-- Sidebar -->
        <nav class="fixed left-0 top-14 bottom-0 w-16 sm:w-52 bg-white border-r border-gray-100 flex flex-col py-3 z-20 overflow-y-auto">
          <a *ngFor="let item of navItems"
            [routerLink]="item.route"
            routerLinkActive="bg-primary-light text-primary font-semibold"
            class="group flex items-center gap-3 mx-2 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all text-sm">
            <svg class="w-5 h-5 shrink-0" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" [attr.d]="item.icon"/>
            </svg>
            <span class="hidden sm:inline truncate">{{ item.label }}</span>
          </a>
        </nav>

        <!-- Page content -->
        <main class="flex-1 ml-16 sm:ml-52 p-4 sm:p-6 bg-surface">
          <div class="max-w-4xl mx-auto">
            <router-outlet />
          </div>
        </main>
      </div>
    </div>
  `
})
export class NavShellComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly notifService = inject(NotificationService);
  private readonly cdr = inject(ChangeDetectorRef);

  notifications = signal<AppNotification[]>([]);
  unread = signal(0);
  showNotifPanel = false;
  hasMore = false;
  private currentPage = 0;

  get role()      { return this.auth.role; }
  get userName()  { return this.auth.userName ?? ''; }
  get roleLabel() {
    const r = this.role;
    if (r === 'MANAGER') return 'Manager';
    if (r === 'TEAM_LEAD') return 'Team Lead';
    return 'Member';
  }
  get navItems()  { return (this.role === 'MANAGER' || this.role === 'TEAM_LEAD') ? MANAGER_NAV : MEMBER_NAV; }

  ngOnInit(): void {
    this.loadNotifications();
    this.pollUnread();
  }

  private pollUnread(): void {
    this.notifService.unreadCount().subscribe(c => {
      this.unread.set(c);
      this.cdr.markForCheck();
    });
    // Refresh count every 60 s
    setInterval(() => {
      this.notifService.unreadCount().subscribe(c => {
        this.unread.set(c);
        this.cdr.markForCheck();
      });
    }, 60_000);
  }

  toggleNotifPanel(): void {
    this.showNotifPanel = !this.showNotifPanel;
    if (this.showNotifPanel && this.notifications().length === 0) {
      this.loadNotifications();
    }
  }

  private loadNotifications(page = 0): void {
    this.notifService.list(page, 20).subscribe(res => {
      const items = page === 0 ? res.data : [...this.notifications(), ...res.data];
      this.notifications.set(items);
      this.hasMore = !res.lastPage;
      this.currentPage = page;
      this.cdr.markForCheck();
    });
  }

  loadMore(): void {
    this.loadNotifications(this.currentPage + 1);
  }

  onNotifClick(n: AppNotification): void {
    if (!n.seen) {
      this.notifService.markClicked(n.id).subscribe(updated => {
        this.notifications.update(list => list.map(x => x.id === updated.id ? updated : x));
        this.unread.update(c => Math.max(0, c - 1));
        this.cdr.markForCheck();
      });
    }
  }

  markAllSeen(): void {
    this.notifService.markAllSeen().subscribe(() => {
      this.notifications.update(list => list.map(n => ({ ...n, seen: true })));
      this.unread.set(0);
      this.cdr.markForCheck();
    });
  }

  typeIcon(type: string): string {
    return TYPE_ICON[type] ?? '🔔';
  }

  timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  logout(): void { this.auth.logout(); }
}
