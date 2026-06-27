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
    if (auth.role !== requiredRole) {
      const redirect = auth.role === 'MANAGER' ? '/manager/overview' : '/member/dashboard';
      return router.createUrlTree([redirect]);
    }
    return true;
  };
}
