import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { PUBLIC_HOME_PATH } from '../../core/model/public-menu';
import { WebRequestService } from './web-request-service';
import { PublicAccessRequest, PublicSessionResponse, PublicTeacher } from '../model/public-session.model';

const TOKEN_KEY = 'rvd.public.token';
const USER_KEY = 'rvd.public.user';

@Injectable({
  providedIn: 'root',
})
export class PublicSessionService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly router = inject(Router);
  private readonly sessionUpdated = signal(0);

  readonly teacher = signal<PublicTeacher | null>(this.readTeacher());

  readonly isAuthenticated = computed(() => {
    this.sessionUpdated();
    return this.getToken() !== null;
  });

  getToken(): string | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    return sessionStorage.getItem(TOKEN_KEY);
  }

  async signIn(request: PublicAccessRequest): Promise<void> {
    const response = await firstValueFrom(
      this.webRequestService.postWithoutAuth<PublicSessionResponse>(
        '/public/session',
        request,
      ),
    );

    const token = response?.accessToken?.trim();
    const id = token ? readPegeId(token) : null;
    const teacher = response?.docente;

    if (!token || id === null || !teacher?.numeroDocumento) {
      throw new Error('Respuesta de acceso docente incompleta.');
    }

    const sessionTeacher: PublicTeacher = {
      id,
      numeroDocumento: teacher.numeroDocumento,
      nombreCompleto: teacher.nombreCompleto,
    };

    sessionStorage.setItem(TOKEN_KEY, token);
    sessionStorage.setItem(USER_KEY, JSON.stringify(sessionTeacher));
    this.teacher.set(sessionTeacher);
    this.sessionUpdated.update((value) => value + 1);
    await this.router.navigateByUrl(PUBLIC_HOME_PATH);
  }

  logout(): void {
    this.clear();
    void this.router.navigateByUrl('/acceso-docente');
  }

  private clear(): void {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    this.teacher.set(null);
    this.sessionUpdated.update((value) => value + 1);
  }

  private readTeacher(): PublicTeacher | null {
    if (typeof sessionStorage === 'undefined') {
      return null;
    }

    const raw = sessionStorage.getItem(USER_KEY);

    if (!raw) {
      return null;
    }

    try {
      const teacher = JSON.parse(raw) as PublicTeacher;
      if (typeof teacher.id === 'number' && Number.isFinite(teacher.id)) {
        return teacher;
      }

      const token = sessionStorage.getItem(TOKEN_KEY);
      const id = token ? readPegeId(token) : null;
      if (id === null || !teacher?.numeroDocumento) {
        return null;
      }

      const sessionTeacher: PublicTeacher = {
        id,
        numeroDocumento: teacher.numeroDocumento,
        nombreCompleto: teacher.nombreCompleto,
      };
      sessionStorage.setItem(USER_KEY, JSON.stringify(sessionTeacher));
      return sessionTeacher;
    } catch {
      return null;
    }
  }
}

function readPegeId(token: string): number | null {
  const payload = token.split('.')[1];
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(normalized)) as { sub?: unknown };
    const pegeId = Number(decoded.sub);
    return Number.isInteger(pegeId) && pegeId > 0 ? pegeId : null;
  } catch {
    return null;
  }
}
