import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { environment } from '../../../environments/environment';
import { StorageService } from '../service/storage-service';
import { PublicSessionService } from '../service/public-session.service';

const BOOTSTRAP_PATH = '/api/auth/bootstrap';
const PUBLIC_SESSION_PATH = '/public/session';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes(BOOTSTRAP_PATH) || req.url.includes(PUBLIC_SESSION_PATH)) {
    return next(req);
  }

  if (req.url.includes('/public/')) {
    const publicToken = inject(PublicSessionService).getToken();

    if (!publicToken) {
      return next(req);
    }

    return next(
      req.clone({
        setHeaders: { Authorization: `Bearer ${publicToken}` },
      }),
    );
  }

  if (!isSecuredApi(req.url)) {
    return next(req);
  }

  const token = inject(StorageService).getToken();

  if (!token) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    }),
  );
};

function isSecuredApi(url: string): boolean {
  if (url.includes('/funcionalidad/arbol-roles')) {
    return true;
  }

  if (url.includes('/security-auth')) {
    return true;
  }

  const rvd = environment.api.baseUrl;
  const securityAuth = environment.api.securityAuthUrl.trim();

  if (rvd && url.startsWith(rvd)) {
    return true;
  }

  return Boolean(securityAuth && url.startsWith(securityAuth));
}
