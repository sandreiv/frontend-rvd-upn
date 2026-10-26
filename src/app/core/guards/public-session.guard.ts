import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PublicSessionService } from '../service/public-session.service';

export const publicSessionGuard: CanActivateFn = () => {
  const session = inject(PublicSessionService);

  if (session.isAuthenticated()) {
    return true;
  }

  return inject(Router).parseUrl('/acceso-docente');
};
