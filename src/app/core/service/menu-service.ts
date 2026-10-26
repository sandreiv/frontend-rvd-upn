import { effect, inject, Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  FUNC_ROUTE_MAP,
  FuncRouteItem,
  resolveFuncCodigoFromUrl,
} from '../config/func-route.map';
import { FuncionalidadNodo } from '../model/funcionalidad.model';
import { AppIconName } from '../../shared/ui/icon/icons';
import { forNext } from '../utils/for-next.function';
import { AuthService } from './auth-service';

export type MenuNavItem = {
  name: string;
  icon: AppIconName;
  path: string;
  codigo: string;
  subItems?: { name: string; path: string; new?: boolean }[];
};

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  readonly tree = signal<FuncionalidadNodo[]>([]);
  readonly loaded = signal(false);
  readonly navItems = signal<MenuNavItem[]>([]);

  constructor() {
    effect(() => {
      if (!this.authService.isAuthenticated()) {
        this.tree.set([]);
        this.navItems.set([]);
        this.loaded.set(false);
      }
    });
  }

  load(): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      this.markLoaded([]);
      return of(undefined);
    }

    const params = this.buildArbolParams(
      this.authService.getRoles(),
      environment.auth.applicationId,
    );

    const arbolUrl = this.resolveArbolUrl();

    if (!arbolUrl) {
      this.markLoaded([]);
      return of(undefined);
    }

    return this.http.get<unknown>(arbolUrl, { params }).pipe(
      map((payload) => nestByCodigo(normalizeArbol(payload))),
      tap((nodos) => this.markLoaded(nodos)),
      map(() => undefined),
      catchError(() => {
        this.markLoaded([]);
        return of(undefined);
      }),
    );
  }

  findByCodigo(codigo: string): FuncionalidadNodo | null {
    return findNodoByCodigo(this.tree(), codigo);
  }

  homeUrl(): string | null {
    return this.navItems()[0]?.path ?? null;
  }

  canAccessUrl(url: string): boolean {
    if (!this.loaded()) {
      return true;
    }

    const codigo = resolveFuncCodigoFromUrl(url);

    if (!codigo) {
      return false;
    }

    const items = this.navItems();
    let allowed = false;

    forNext(items, (item) => {
      if (item.codigo === codigo) {
        allowed = true;
      }
    });

    return allowed;
  }

  private markLoaded(nodos: FuncionalidadNodo[]): void {
    this.tree.set(nodos);
    this.navItems.set(toNavItems(nodos));
    this.loaded.set(true);
  }

  private resolveArbolUrl(): string | null {
    const configured = environment.api.securityAuthUrl.trim();
    const issuer = this.authService.getIssuer();
    const base = configured || issuer;

    if (!base) {
      return null;
    }

    return `${base}/funcionalidad/arbol-roles`;
  }

  private buildArbolParams(roles: string[], appId: number): HttpParams {
    return roles.reduce(
      (params, role) => params.append('roles', role),
      new HttpParams().set('idAplicacion', String(appId)),
    );
  }
}

function toNavItems(nodos: FuncionalidadNodo[]): MenuNavItem[] {
  const items: MenuNavItem[] = [];

  forNext(nodos, (nodo) => {
    const mapped = FUNC_ROUTE_MAP[nodo.codigo];

    if (!mapped) {
      return;
    }

    items.push(toNavItem(nodo, mapped));
  });

  return items;
}

function toNavItem(
  nodo: FuncionalidadNodo,
  mapped: FuncRouteItem,
): MenuNavItem {
  return {
    name: nodo.nombre,
    icon: mapped.icon,
    path: mapped.path,
    codigo: nodo.codigo,
  };
}

function findNodoByCodigo(
  nodos: FuncionalidadNodo[],
  codigo: string,
): FuncionalidadNodo | null {
  let found: FuncionalidadNodo | null = null;

  forNext(nodos, (nodo) => {
    if (found) {
      return;
    }

    if (nodo.codigo === codigo) {
      found = nodo;
      return;
    }

    found = findNodoByCodigo(nodo.funHijas, codigo);
  });

  return found;
}

function nestByCodigo(nodos: FuncionalidadNodo[]): FuncionalidadNodo[] {
  if (hasAnyHijas(nodos)) {
    return nodos;
  }

  const parents: FuncionalidadNodo[] = [];

  forNext(nodos, (nodo) => {
    if (nodo.codigo.includes('_')) {
      return;
    }

    parents.push({
      ...nodo,
      funHijas: hijasOf(nodos, nodo.codigo),
    });
  });

  return parents.length ? parents : nodos;
}

function hasAnyHijas(nodos: FuncionalidadNodo[]): boolean {
  let found = false;

  forNext(nodos, (nodo) => {
    if (nodo.funHijas.length > 0) {
      found = true;
    }
  });

  return found;
}

function hijasOf(
  nodos: FuncionalidadNodo[],
  parentCodigo: string,
): FuncionalidadNodo[] {
  const hijas: FuncionalidadNodo[] = [];
  const prefix = `${parentCodigo}_`;

  forNext(nodos, (nodo) => {
    if (nodo.codigo.startsWith(prefix)) {
      hijas.push(nodo);
    }
  });

  return hijas;
}

function normalizeArbol(payload: unknown): FuncionalidadNodo[] {
  const rawList = extractNodoList(payload);
  const nodos: FuncionalidadNodo[] = [];

  forNext(rawList, (item) => {
    const nodo = normalizeNodo(item);

    if (nodo) {
      nodos.push(nodo);
    }
  });

  return nodos;
}

function extractNodoList(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;
  const nested =
    record['data'] ??
    record['funcionalidades'] ??
    record['arbol'] ??
    record['content'] ??
    record['items'] ??
    record['nodos'];

  return Array.isArray(nested) ? nested : [];
}

function normalizeNodo(raw: unknown): FuncionalidadNodo | null {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const item = raw as Record<string, unknown>;
  const codigo = readString(item, ['codigo', 'funcCodigo', 'func_codigo']);
  const nombre = readString(item, ['nombre', 'funcNombre', 'func_nombre']);

  if (!codigo || !nombre) {
    return null;
  }

  return {
    id: (item['id'] ?? item['funcId'] ?? item['func_id']) as
      | number
      | string
      | undefined,
    codigo,
    nombre,
    urlRecurso: readString(item, [
      'urlRecurso',
      'funcUrlRecurso',
      'func_urlrecurso',
    ]),
    nombreFuncion: readString(item, [
      'nombreFuncion',
      'funcNombreFuncion',
      'func_nombrefuncion',
    ]),
    funHijas: normalizeArbol(
      item['funHijas'] ??
        item['hijas'] ??
        item['children'] ??
        item['hijos'] ??
        item['funcionalidadesHijas'],
    ),
  };
}

function readString(
  item: Record<string, unknown>,
  keys: string[],
): string | undefined {
  let value: string | undefined;

  forNext(keys, (key) => {
    if (value) {
      return;
    }

    const raw = item[key];

    if (typeof raw === 'string' && raw.trim()) {
      value = raw.trim();
      return;
    }

    if (typeof raw === 'number') {
      value = String(raw);
    }
  });

  return value;
}
