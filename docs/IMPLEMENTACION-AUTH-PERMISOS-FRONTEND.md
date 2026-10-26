# Implementación de autenticación y permisos en el frontend RVD

Documento de cómo quedó cableada la sesión SSO, el menú y los botones en Angular.
Complementa el contrato de `docs/SEGURIDAD-BACKEND-FRONTEND-RVD.md`.

Aplicación Vortal: **55100** (RVD).  
Rutas Angular: **no** coinciden con `func_urlrecurso` (eso es el API).

---

## Idea en una frase

El JWT solo trae **quién eres y qué roles tienes**.  
El **árbol de funcionalidades** dice **qué menú y qué botones** ves.  
El **backend RVD** sigue siendo quien autoriza de verdad (401 / 403).

Angular no pregunta `if (rol === 'Coordinador')`. Pregunta `if (permissions.can('02_02'))`.

---

## Piezas

| Pieza | Archivos principales | Qué hace |
| --- | --- | --- |
| Sesión | `auth-service.ts`, `storage-service.ts`, `auth.guard.ts` | Lee `#access_token`, llama bootstrap, guarda JWT |
| Bearer | `auth.interceptor.ts` | Pone `Authorization` en RVD y SecurityAuth |
| Árbol | `menu-service.ts` | `GET {securityAuth}/funcionalidad/arbol-roles` |
| Mapa padres | `func-route.map.ts` → `FUNC_ROUTE_MAP` | Código `01`/`02`/`03` → ruta Angular + icono |
| Mapa botones | `func-route.map.ts` → `PRELOAD_FUNC` | `ADD` → `02_02`, etc. |
| Permisos | `permission-service.ts` | `can('02_02')` si el código está en el árbol |
| UI | Precarga docente | `@if` / `[disabled]` según `can(...)` |

---

## Flujo al arrancar

```text
1. Vortal abre RVD con #access_token=<JWT SecurityAuth>
2. APP_INITIALIZER
     AuthService.bootstrapFromVortalHash()
       POST http://localhost:8080/rvd/api/auth/bootstrap
       { "accessToken": "<JWT>" }
     Guarda accessToken, username, roles, idPersona, idAplicacion
3. MenuService.load()
     GET /security-auth/funcionalidad/arbol-roles
         ?roles=<rol del bootstrap>
         &idAplicacion=55100
     (en development el proxy reenvía a http://127.0.0.1:8171)
4. Sidebar: solo padres 01, 02, 03 que vengan en el árbol
5. PermissionService arma un Set con todos los códigos (padres e hijas)
```

**No** se llama `GET /rvd/api/auth/arbol-roles`. RVD aplica `enforce-funcionalidad` y responde **403** (esa URL no es una funcionalidad de negocio).

En development:

| Config | Valor |
| --- | --- |
| `api.baseUrl` | `http://localhost:8080/rvd` |
| `api.securityAuthUrl` | `/security-auth` |
| Proxy | `/security-auth` → `http://127.0.0.1:8171` (`iss` del JWT) |

Logout: borra token, usuario y árbol. Si no hay `logoutRedirectUrl` de Vortal, va a `/sesion-requerida`.

---

## Dos mapas (no confundirlos)

### Padres = pantallas (`FUNC_ROUTE_MAP`)

Vortal no conoce `/rvd/precarga-docente`. Conoce el código `02` y una URL de API.

| Código | Módulo | Ruta Angular |
| --- | --- | --- |
| `01` | Convocatoria precarga | `/rvd/convocatoria-precarga` |
| `02` | Precarga docente | `/rvd/precarga-docente` |
| `03` | Administración | `/rvd/administracion` |

Si el árbol no trae `01`, ese ítem no se pinta. El guard usa el camino inverso: URL actual → código padre → ¿está en el menú?

### Hijas = botones (`PRELOAD_FUNC`)

| Clave en código | Código Vortal | Acción UI |
| --- | --- | --- |
| `DOWNLOAD` | `02_01` | Descargar reporte |
| `ADD` | `02_02` | Agregar docente |
| `UPDATE` | `02_03` | Actualizar docente |
| `DELETE` | `02_04` | Eliminar docente |
| `SAVE_DETAIL` | `02_05` | Guardar detalle de actividades |
| `APPROVE` | `02_06` | Aprobar |

Este mapa **no otorga** el permiso. Solo evita hardcodear `'02_02'` en cada plantilla.

`PermissionService.can('02_02')` mira si ese código vino en el árbol de **este** usuario.

---

## Ejemplo didáctico: botón «Agregar docente»

Botón real en Precarga, modalidad distinta de planta:

```24:37:src/app/features/configuration/professor-preload/components/contract-modality-detail/contract-modality-detail.html
        @if (!isPlantaSelected() && permissions.canAddProfessor()) {
          ...
              Agregar docente
```

`canAddProfessor()` es:

```ts
canAddProfessor() {
  return this.can(PRELOAD_FUNC.ADD); // '02_02'
}
```

### Usuarios de prueba

| Usuario | Rol en bootstrap | ¿Trae `02_02` en el árbol? |
| --- | --- | --- |
| `pmduran` | Coordinador | Sí (en el catálogo de Vortal de Precarga) |
| `araguilar` | ADMIN RVD-UDEC | No (ese rol no tiene la hija «Agregar docente») |

*(Si en Vortal cambian las asignaciones, el comportamiento cambia sin tocar Angular.)*

### Coordinador (`pmduran`) — sí puede

1. Bootstrap responde `roles: ["Coordinador"]`.
2. Árbol incluye el padre `02` (Precarga docente) y la hija `02_02`.
3. `funcCodes` contiene `'02_02'`.
4. `canAddProfessor()` → **true**.
5. El botón **se renderiza**.
6. Al guardar, `POST /configuration/coordination/add-professor` con Bearer → **200** (el backend también tiene esa funcionalidad).

```text
Árbol Coordinador (esquema)
02 Precarga docente
  02_01 Descargar reporte
  02_02 Agregar docente     ← llave del botón
  02_03 Actualizar docente
  02_04 Eliminar docente
  ...
```

### ADMIN RVD-UDEC (`araguilar`) — no puede

1. Bootstrap responde `roles: ["ADMIN RVD-UDEC"]`.
2. El árbol **no** incluye `02_02` (aunque sí puede traer el padre `02` u otros módulos).
3. `funcCodes` **no** tiene `'02_02'`.
4. `canAddProfessor()` → **false**.
5. El `@if` **no pinta** el botón. No es un `disabled`: el control no existe en el DOM.
6. Si alguien fuerza el API a mano, RVD responde **403**. Ocultar el botón es UX, no seguridad.

```text
Árbol ADMIN (esquema, ejemplo)
02 Precarga docente
  02_01 Descargar reporte
  02_03 Actualizar docente
  ← no hay 02_02
```

Misma pantalla, mismo componente, **sin** `if (rol === 'ADMIN')`. Solo cambia el árbol.

### Cómo comprobarlo

1. Salir (limpiar sesión) entre un usuario y el otro.
2. Network → `funcionalidad/arbol-roles` (host SecurityAuth vía proxy, no `/rvd/api/auth/arbol-roles`).
3. Coordinador: 200 y aparece `02_02` en hijas.
4. ADMIN: 200 y **no** aparece `02_02`.
5. En Precarga, Coordinador ve «Agregar docente»; ADMIN no.

Otro botón del mismo patrón: «Descargar Reporte» (`02_01`) en `coordination-detail.html`, con `permissions.canDownloadPreloadExcel()`.

---

## Responsabilidades (regla de oro)

| Capa | Responsabilidad |
| --- | --- |
| Vortal | Quién tiene qué funcionalidad (`rolaplicacionfuncionalidad`) |
| SecurityAuth | JWT + árbol `/funcionalidad/arbol-roles` |
| Angular | Token, menú de padres, ocultar botones |
| Backend RVD | 401/403 reales (`METHOD:URL`) |

---

## Archivos tocados (índice)

| Área | Ruta |
| --- | --- |
| Config | `src/environments/environment*.ts`, `proxy.conf.json`, `angular.json` |
| Sesión | `src/app/core/service/auth-service.ts`, `storage-service.ts` |
| HTTP | `src/app/core/interceptors/auth.interceptor.ts`, `http-error.interceptor.ts` |
| Guards | `src/app/core/guards/auth.guard.ts`, `menu.guard.ts` |
| Menú / permisos | `menu-service.ts`, `permission-service.ts`, `func-route.map.ts` |
| Login local | `src/app/features/auth/session-required/` |
| Precarga | `contract-modality-detail`, `professor-add-modal`, `professor-activities-modal`, `coordination-detail` |

---

## Cómo agregar un botón nuevo más adelante

1. Crear la funcionalidad hija en Vortal (código, por ejemplo `02_07`) y asignarla al rol.
2. Añadir la clave en `PRELOAD_FUNC` (opcional, por legibilidad).
3. En la plantilla: `@if (permissions.can('02_07'))` o un `canXxx()` que llame a `can(...)`.
4. El API correspondiente debe existir en el catálogo; si no, el backend devolverá 403 aunque el botón se vea.

No hace falta un `if` por nombre de rol.
