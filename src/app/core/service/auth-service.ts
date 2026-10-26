import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { jwtDecode } from 'jwt-decode';
import { environment } from '../../../environments/environment';
import {
  BootstrapResponse,
  SessionUser,
} from '../model/session-user.model';
import { StorageService } from './storage-service';
import { WebRequestService } from './web-request-service';

interface JwtIssuerPayload {
  iss?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly router = inject(Router);
  private readonly storageService = inject(StorageService);
  private readonly webRequestService = inject(WebRequestService);

  private readonly sessionUpdated = signal(0);
  private readonly bootstrapError = signal<string | null>(null);

  readonly isAuthenticated = computed(() => {
    this.sessionUpdated();
    return this.storageService.hasSession();
  });

  readonly currentUser = signal<SessionUser | null>(
    this.storageService.getUser<SessionUser>(),
  );

  consumeBootstrapError(): string | null {
    const message = this.bootstrapError();
    this.bootstrapError.set(null);
    return message;
  }

  getToken(): string | null {
    return this.storageService.getToken();
  }

  getRoles(): string[] {
    return this.currentUser()?.roles ?? [];
  }

  /**
   * Issuer del JWT SecurityAuth. Sirve como base URL del árbol.
   */
  getIssuer(): string | null {
    const token = this.getToken();

    if (!token) {
      return null;
    }

    try {
      const payload = jwtDecode<JwtIssuerPayload>(token);
      const issuer = payload.iss?.trim();
      return issuer ? issuer.replace(/\/$/, '') : null;
    } catch {
      return null;
    }
  }

  /**
   * Lee #access_token (SSO Vortal) o token de desarrollo y arma la sesión.
   */
  async bootstrapFromVortalHash(): Promise<boolean> {
    const fromHash = this.readAccessTokenFromHash();

    if (fromHash) {
      return this.bootstrapWithToken(fromHash);
    }

    if (this.isAuthenticated()) {
      return true;
    }

    const fromDev = this.storageService.getDevToken();

    if (!fromDev) {
      return false;
    }

    return this.bootstrapWithToken(fromDev);
  }

  async bootstrapWithToken(accessToken: string): Promise<boolean> {
    try {
      const res = await firstValueFrom(
        this.webRequestService.postWithoutAuth<BootstrapResponse>(
          '/api/auth/bootstrap',
          { accessToken },
        ),
      );

      const persisted = this.persistSession(res);
      this.clearHashFromUrl();

      if (!persisted) {
        this.bootstrapError.set('No se pudo iniciar sesión desde Vortal.');
        return false;
      }

      if (!environment.production) {
        this.storageService.setDevToken(accessToken);
      }

      return true;
    } catch (err: unknown) {
      this.clearHashFromUrl();
      this.bootstrapError.set(this.resolveBootstrapError(err));
      this.clearLocalSession();
      return false;
    }
  }

  logout(): void {
    this.clearLocalSession();
    this.redirectAfterLogout();
  }

  private persistSession(res: BootstrapResponse): boolean {
    const token = res?.accessToken;

    if (!token || typeof token !== 'string') {
      return false;
    }

    const sessionUser = this.resolveSessionUser(res);

    this.storageService.setToken(token);
    this.storageService.setUser(sessionUser);
    this.currentUser.set(sessionUser);
    this.sessionUpdated.update((value) => value + 1);
    return true;
  }

  private resolveSessionUser(res: BootstrapResponse): SessionUser {
    const fromUsuario = res.usuario;
    const roles = fromUsuario?.roles ?? res.roles ?? [];

    const username =
      fromUsuario?.username ??
      res.username ??
      '';

    const nombreCompleto =
      fromUsuario?.nombreCompleto?.trim() ||
      res.nombreCompleto?.trim() ||
      username;

    return {
      username,
      nombreCompleto,
      idPersona: fromUsuario?.idPersona ?? res.idPersona ?? null,
      roles: Array.isArray(roles) ? roles : [],
      idAplicacion:
        fromUsuario?.idAplicacion ?? environment.auth.applicationId,
    };
  }

  private readAccessTokenFromHash(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const raw = window.location.hash.replace(/^#/, '');

    if (!raw) {
      return null;
    }

    const accessToken = new URLSearchParams(raw).get('access_token');
    return accessToken?.trim() ? accessToken.trim() : null;
  }

  private clearHashFromUrl(): void {
    if (typeof window === 'undefined') {
      return;
    }

    const path = window.location.pathname + window.location.search;
    window.history.replaceState(null, '', path);
  }

  private clearLocalSession(): void {
    this.storageService.clearSession();
    this.currentUser.set(null);
    this.sessionUpdated.update((value) => value + 1);
  }

  private redirectAfterLogout(): void {
    const vortalUrl = environment.auth.logoutRedirectUrl;

    if (vortalUrl.startsWith('http')) {
      window.location.assign(vortalUrl);
      return;
    }

    void this.router.navigate([environment.auth.sessionRequiredUrl]);
  }

  private resolveBootstrapError(err: unknown): string {
    const httpErr = err as {
      status?: number;
      error?: { message?: string; mensaje?: string } | string;
      message?: string;
    };

    const backendMessage = this.readBackendMessage(httpErr);

    if (httpErr?.status === 401) {
      return backendMessage ?? 'Sesión de Vortal inválida o expirada.';
    }

    if (httpErr?.status === 403) {
      return (
        backendMessage ?? 'Usuario no asociado a RVD. Contacte soporte.'
      );
    }

    return backendMessage ?? 'No se pudo validar la sesión de Vortal.';
  }

  private readBackendMessage(httpErr: {
    error?: { message?: string; mensaje?: string } | string;
    message?: string;
  }): string | null {
    if (typeof httpErr?.error === 'string') {
      return httpErr.error;
    }

    if (typeof httpErr?.error === 'object') {
      return httpErr.error?.message ?? httpErr.error?.mensaje ?? null;
    }

    return httpErr?.message ?? null;
  }
}
