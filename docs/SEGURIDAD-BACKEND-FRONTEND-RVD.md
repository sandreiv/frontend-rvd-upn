# Seguridad RVD: qué hace el backend y qué debe hacer Angular

Documento de contrato entre **Vortal / SecurityAuth / Backend RVD / Frontend Angular**.
Estado validado en pruebas (app `apli_id = 55100`, usuario `pmduran` / rol `Coordinador`).

---

## Idea en una frase

> El **JWT solo trae identidad + roles por aplicación**.  
> El **menú y los botones** salen del catálogo de **funcionalidades en Vortal** (vía SecurityAuth).  
> El **backend RVD** es quien realmente autoriza cada API; Angular solo oculta UI.

---

## Piezas del ecosistema


| Pieza            | Responsabilidad                                                                                                    |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Vortal**       | Login, catálogo (`aplicacion`, `rol`, `funcionalidad`, `rolaplicacionfuncionalidad`), entrega del JWT al abrir RVD |
| **SecurityAuth** | Emite JWT (RS256); expone árbol/permisos; es la fuente de “qué puede ver/hacer un rol”                             |
| **Backend RVD**  | Resource Server: valida JWT, filtra app `55100`, autoriza `METHOD:URL`, APIs de negocio                            |
| **Angular RVD**  | Bootstrap de sesión, arma menú, arma flags de botones, llama APIs con Bearer                                       |


```text
Usuario
  → Vortal (login)
  → SecurityAuth (JWT con aplicaciones[{id, roles}])
  → Angular RVD (#access_token)
       ├─ POST /rvd/api/auth/bootstrap     → sesión SPA
       ├─ GET  SecurityAuth /arbol-roles   → menú + hijas (botones)
       └─ APIs /rvd/configuration/...      → 200 | 401 | 403
```

---



## 1. Qué hace el backend RVD



### 1.1 Entrada SSO (público)

```http
POST /rvd/api/auth/bootstrap
{ "accessToken": "<JWT SecurityAuth>" }
```

- Valida firma (JWKS) + `iss`.
- Exige que en el claim `aplicaciones` exista `id: 55100` con al menos un rol.
- Responde sesión SPA (no genera otro JWT propio):

```json
{
  "accessToken": "...",
  "type": "Bearer",
  "username": "pmduran",
  "idPersona": "231326",
  "roles": ["Coordinador"],
  "usuario": {
    "username": "pmduran",
    "idPersona": 231326,
    "roles": ["Coordinador"],
    "idAplicacion": 55100
  }
}
```



### 1.2 Cada API de negocio (privado)

- Requiere `Authorization: Bearer <JWT>`.
- Sin token / anónimo → **401**.
- Con token de otra app o sin rol en `55100` → no entra como usuario RVD.
- Con token válido:
  1. Lee roles de la app `55100`.
  2. Consulta SecurityAuth (caché) y arma authorities tipo
    `GET:/configuration/coordination/list-professors-modality`,  
     `POST:/configuration/coordination/add-professor`, …
  3. Compara `HTTP method + path` del request contra esas authorities.
  4. Con `enforce-funcionalidad: true` (actual):
    - permiso OK → **200**
    - sin permiso (p. ej. Coordinador en `/preload-call/...`) → **403**  
    `{ "mensaje": "Acceso denegado: sin permiso para este recurso" }`



### 1.3 Qué NO hace el backend RVD

- No arma el menú Angular.
- No decide qué botón mostrar (eso es UX).
- No confía en “soy Coordinador” como única regla: usa **funcionalidad → URL/método**.



### 1.4 Config relevante

```yaml
rvd.security.security-auth:
  application-id: 55100
  enforce-funcionalidad: true   # estricto: solo lo del catálogo del rol
```

---



## 2. Qué hace SecurityAuth (lectura de roles / funcionalidades)

El JWT **no** lleva la lista de botones. Solo:

```json
"aplicaciones": [{ "id": 55100, "roles": ["Coordinador"] }]
```

Para UI, el front (o un BFF) consulta:

### 2.1 Árbol (menú + hijas)

```http
GET /funcionalidad/arbol-roles?roles=Coordinador&idAplicacion=55100
Authorization: Bearer <JWT>
```

Ejemplo real (Coordinador):

- Nodo menú `78546` Precarga Docente → `/configuration/coordination`
- Hijas `02_01`…`02_06` → listar / agregar / actualizar / eliminar / guardar detalle / aprobar

**Importante:** en Vortal hay que asignar también el **padre** del menú; si solo se asignan botones, el árbol puede devolver `[]`.

### 2.2 Datos en Vortal (fuente de verdad)


| Tabla                        | Uso                                                                       |
| ---------------------------- | ------------------------------------------------------------------------- |
| `aplicacion`                 | `55100` RVD - UDEC                                                        |
| `rol`                        | Coordinador, Decano, …                                                    |
| `funcionalidad`              | Menús + acciones (`func_codigo`, `func_urlrecurso`, `func_nombrefuncion`) |
| `rolaplicacionfuncionalidad` | Qué ve/puede cada rol                                                     |
| `usuariorol`                 | Usuario ↔ rol                                                             |


---



## 3. Qué se espera del frontend Angular



### 3.1 Arranque / sesión

1. Leer `access_token` (hash Vortal u otro contrato).
2. `POST /rvd/api/auth/bootstrap`.
3. Guardar `accessToken`, `roles`, `idPersona`, `idAplicacion`.
4. Interceptor HTTP: todas las llamadas a RVD **y** a SecurityAuth llevan
  `Authorization: Bearer <accessToken>`.
5. Sin sesión → no entrar a rutas privadas; logout limpia storage.



### 3.2 Armar el menú (árbol)

1. Tras bootstrap:
  `GET {securityAuth}/funcionalidad/arbol-roles?roles=...&idAplicacion=55100`
2. Roles = los del bootstrap (`usuario.roles`), no hardcodear “Coordinador”.
3. Sidebar: solo nodos de **navegación** (padres con ruta de pantalla), p. ej. Precarga Docente.
4. **No** listar en el menú las hijas `02_01`… (son acciones/botones).
5. `routerLink` alineado a `urlRecurso` (o mapa explícito url Vortal → ruta Angular).



### 3.3 Armar permisos de botones (al entrar al módulo)

Al abrir Precarga (`78546` / ruta de coordination):

**Opción recomendada (ya disponible):** usar `funHijas` del nodo del árbol.

```ts
// Ejemplo de flags
const codes = new Set(nodo.funHijas.map(h => h.codigo));

permissions = {
  listProfessors: codes.has('02_01'),
  addProfessor: codes.has('02_02'),
  updateProfessor: codes.has('02_03'),
  deleteProfessor: codes.has('02_04'),
  saveDetail: codes.has('02_05'),
  approve: codes.has('02_06'),
};
```

Preferible a medio plazo: claves estables `LIST_PROFESSORS`, `ADD_PROFESSOR`, … (`func_nombrefuncion`).

En plantilla:

```html
<button *ngIf="permissions.addProfessor">Agregar docente</button>
<button *ngIf="permissions.deleteProfessor">Eliminar</button>
```

- Guardar flags en memoria/`sessionStorage` del módulo.
- Al salir del módulo o logout → limpiar.
- **No** preguntar `if (rol === 'Coordinador')`; preguntar `if (permissions.addProfessor)`.



### 3.4 Llamadas a APIs RVD

```http
POST /rvd/configuration/coordination/add-professor
Authorization: Bearer <mismo JWT del bootstrap>
```


| HTTP | Qué hacer en Angular                                                      |
| ---- | ------------------------------------------------------------------------- |
| 401  | Sesión inválida/expirada → re-bootstrap o volver a Vortal                 |
| 403  | Toast “Sin permiso”; el botón no debió mostrarse (o alguien forzó la URL) |
| 200  | OK                                                                        |




### 3.5 Separación de responsabilidades (regla de oro)


| Capa        | Responsabilidad                               |
| ----------- | --------------------------------------------- |
| Angular     | UX: menú + ocultar/deshabilitar botones       |
| Backend RVD | Seguridad real: 401/403 aunque el front falle |
| Vortal      | Administración de roles y funcionalidades     |


---



## 4. Matriz rápida (ejemplo Coordinador)


| Recurso                     | ¿En árbol/menú?          | ¿Botón?    | API RVD (`enforce: true`)          |
| --------------------------- | ------------------------ | ---------- | ---------------------------------- |
| Precarga Docente            | Sí                       | —          | —                                  |
| Listar docentes             | —                        | Sí `02_01` | GET list-professors-modality → 200 |
| Agregar docente             | —                        | Sí `02_02` | POST add-professor → 200           |
| Convocatoria / preload-call | No (si no está asignada) | —          | GET preload-call/... → **403**     |


---



## 5. Checklist frontend

- [ ] Environment: `apiRvd`, `apiSecurityAuth`, `applicationId: 55100`
- [ ] Bootstrap + interceptor Bearer
- [ ] Servicio de menú (`arbol-roles`)
- [ ] Sidebar solo nodos padre
- [ ] Servicio de permisos por módulo (`funHijas` → flags)
- [ ] `*ngIf` / `[disabled]` en botones de precarga
- [ ] Manejo 401 / 403
- [ ] Limpieza en logout

---



## 6. Resumen


| Pregunta                                                                                        | Respuesta                               |
| ----------------------------------------------------------------------------------------------- | --------------------------------------- |
| ¿Quién autentica?*Documento de contrato seguridad backend ↔ frontend — RVD UDEC (*`55100`*).* | SecurityAuth (JWT); RVD valida          |
| ¿Quién dice el rol?                                                                             | Claim `aplicaciones` filtrado a `55100` |
| ¿Quién arma el menú?                                                                            | Angular con `/arbol-roles`              |
| ¿Quién decide botones?                                                                          |                                         |


