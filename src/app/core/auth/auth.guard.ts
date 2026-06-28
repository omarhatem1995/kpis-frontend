import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { UserRole } from '../models/user.model';

export function authGuard(requiredRole: UserRole): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    if (!auth.isLoggedIn) {
      return router.createUrlTree(['/login']);
    }
    const role = auth.role;
    const isManagerLike = role === 'MANAGER' || role === 'TEAM_LEAD';
    if (requiredRole === 'MANAGER' && isManagerLike) return true;
    if (role !== requiredRole) {
      const redirect = isManagerLike ? '/manager/overview' : '/member/dashboard';
      return router.createUrlTree([redirect]);
    }
    return true;
  };
}
