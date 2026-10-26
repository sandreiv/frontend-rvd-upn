import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHotToastConfig } from '@ngxpert/hot-toast';
import { firstValueFrom } from 'rxjs';

import { routes } from './app.routes';
import { APP_CONFIG } from './core/config/app-config.token';
import { environment } from '../environments/environment';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { httpErrorInterceptor } from './core/interceptors/http-error.interceptor';
import { AuthService } from './core/service/auth-service';
import { MenuService } from './core/service/menu-service';
import { TOAST_POSITION } from './shared/ui/toast/config/toast-style.config';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideHotToastConfig({
      position: TOAST_POSITION,
      dismissible: true,
      duration: 4000,
      visibleToasts: 5,
      theme: 'material',
    }),
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor, httpErrorInterceptor]),
    ),
    provideRouter(routes),
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      const menuService = inject(MenuService);

      return authService.bootstrapFromVortalHash().then((ok) => {
        if (!ok && !authService.isAuthenticated()) {
          return;
        }

        return firstValueFrom(menuService.load());
      });
    }),
    { provide: APP_CONFIG, useValue: environment },
  ],
};
