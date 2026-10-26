import { inject } from '@angular/core';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { catchError, tap, throwError } from 'rxjs';
import { AuthService } from '../service/auth-service';
import { PublicSessionService } from '../service/public-session.service';
import { ToastService } from '../service/toastService';
import {
  resolveHttpErrorToast,
  resolveHttpSuccessToast,
} from './model/http-toast-message.model';

const MUTATION_METHODS = new Set([
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
]);

const BOOTSTRAP_PATH = '/api/auth/bootstrap';
const PUBLIC_SESSION_PATH = '/public/session';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const authService = inject(AuthService);
  const publicSession = inject(PublicSessionService);

  return next(req).pipe(
    tap((event) => {
      if (!(event instanceof HttpResponse)) {
        return;
      }

      if (shouldSkipToast(req) || !MUTATION_METHODS.has(req.method)) {
        return;
      }

      const toast = resolveHttpSuccessToast(
        req.method,
        event.status,
        event.body,
        req.url,
      );

      toastService.show(toast.message, 'success', toast.title);
    }),
    catchError((error: HttpErrorResponse) => {
      if (shouldSkipToast(req)) {
        return throwError(() => error);
      }

      const toast = resolveHttpErrorToast(
        req.method,
        error,
        req.url,
      );

      if (error.status === 401 && req.url.includes('/public/')) {
        publicSession.logout();
      } else if (error.status === 401) {
        authService.logout();
      }

      toastService.show(toast.message, 'error', toast.title, 5000);

      return throwError(() => error);
    }),
  );
};

function shouldSkipToast(req: HttpRequest<unknown>): boolean {
  return (
    req.url.includes(BOOTSTRAP_PATH) ||
    req.url.includes(PUBLIC_SESSION_PATH) ||
    req.url.includes('/arbol-roles')
  );
}
