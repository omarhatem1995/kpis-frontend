import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { NavShellComponent } from './shared/components/nav-shell/nav-shell.component';

export const routes: Routes = [
  { path: 'login',      loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'verify-otp', loadComponent: () => import('./features/auth/otp-verify/otp-verify.component').then(m => m.OtpVerifyComponent) },

  {
    path: 'member',
    component: NavShellComponent,
    canActivate: [authGuard('MEMBER')],
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/member/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'log',       loadComponent: () => import('./features/member/daily-log-form/daily-log-form.component').then(m => m.DailyLogFormComponent) },
      { path: 'history',   loadComponent: () => import('./features/member/log-history/log-history.component').then(m => m.LogHistoryComponent) },
      { path: 'kpi',       loadComponent: () => import('./features/member/kpi-view/kpi-view.component').then(m => m.KpiViewComponent) },
      { path: 'leave',     loadComponent: () => import('./features/member/leave-request/leave-request.component').then(m => m.LeaveRequestComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  {
    path: 'manager',
    component: NavShellComponent,
    canActivate: [authGuard('MANAGER')],
    children: [
      { path: 'overview', loadComponent: () => import('./features/manager/team-overview/team-overview.component').then(m => m.TeamOverviewComponent) },
      { path: 'member/:id', loadComponent: () => import('./features/manager/member-detail/member-detail.component').then(m => m.MemberDetailComponent) },
      { path: 'pending',  loadComponent: () => import('./features/manager/pending-ratings/pending-ratings.component').then(m => m.PendingRatingsComponent) },
      { path: 'wfh',      loadComponent: () => import('./features/manager/wfh-monitor/wfh-monitor.component').then(m => m.WfhMonitorComponent) },
      { path: 'export',   loadComponent: () => import('./features/manager/export/export.component').then(m => m.ExportComponent) },
      { path: 'leave',    loadComponent: () => import('./features/manager/leave-manager/leave-manager.component').then(m => m.LeaveManagerComponent) },
      { path: 'weekend',   loadComponent: () => import('./features/manager/weekend-config/weekend-config.component').then(m => m.WeekendConfigComponent) },
      { path: 'projects',  loadComponent: () => import('./features/manager/projects/projects-manager.component').then(m => m.ProjectsManagerComponent) },
      { path: '', redirectTo: 'overview', pathMatch: 'full' }
    ]
  },

  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
