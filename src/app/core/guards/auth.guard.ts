import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../service/auth-service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    return true;
  }

  const vortalUrl = environment.auth.logoutRedirectUrl;

  if (environment.production && vortalUrl.startsWith('http')) {
    window.location.assign(vortalUrl);
    return false;
  }

  return inject(Router).parseUrl(environment.auth.sessionRequiredUrl);
};
