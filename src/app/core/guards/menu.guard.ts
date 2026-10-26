import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MenuService } from '../service/menu-service';

export const menuGuard: CanActivateFn = (_route, state) => {
  const menuService = inject(MenuService);

  if (menuService.canAccessUrl(state.url)) {
    return true;
  }

  const homeUrl = menuService.homeUrl();

  if (homeUrl) {
    return inject(Router).parseUrl(homeUrl);
  }

  return true;
};

export const homeRedirectGuard: CanActivateFn = () => {
  const menuService = inject(MenuService);
  const homeUrl = menuService.homeUrl();

  if (homeUrl) {
    return inject(Router).parseUrl(homeUrl);
  }

  return true;
};
