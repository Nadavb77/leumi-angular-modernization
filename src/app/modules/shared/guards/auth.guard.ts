import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { appRoutes } from '../../../app-routes';
import { AuthRepository } from '~modules/auth/store/auth.repository';

export const authGuard: CanActivateFn = () => {
  const authRepository = inject(AuthRepository);
  const router = inject(Router);

  if (authRepository.isLoggedInValue()) {
    return true;
  }

  return router.navigate([appRoutes.home]).then(() => false);
};

export const AuthGuard = authGuard;
