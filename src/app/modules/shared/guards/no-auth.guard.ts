import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { userRoutes } from '~modules/user/shared/user-routes';
import { AuthRepository } from '~modules/auth/store/auth.repository';

export const noAuthGuard: CanActivateFn = () => {
  const authRepository = inject(AuthRepository);
  const router = inject(Router);

  if (!authRepository.isLoggedInValue()) {
    return true;
  }

  return router.navigate([userRoutes.dashboard]).then(() => false);
};

export const NoAuthGuard = noAuthGuard;
