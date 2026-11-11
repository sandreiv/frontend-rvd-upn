# Renderizado de actividades en el modal

El modal **Gestionar actividades** no pinta el árbol completo al abrir. Muestra un selector con las actividades padre visibles y, al elegir una, monta solo esa rama. Se pueden sumar varias, una por cada padre, y cada una se puede quitar.

La acción que lo abre está en el menú del docente (`actividades`) dentro de `linkage-type`. El componente queda montado en esa vista y solo cambia `isOpen`.

## De dónde salen los datos

Al abrir, y solo si hay un tipo de vinculación, el modal pide en paralelo:

| Método | Ruta | Uso |
|---|---|---|
| `listActivityTypes()` | `GET /configuration/load/list-activity-types` | Árbol completo. Cada nodo trae sus descendientes en `hijos`. |
| `listActivityRestrictions(idTipoVinculacion)` | `GET /configuration/load/list-activity-restrictions` | Actividades que no se muestran para esa vinculación. |

Si el modal está cerrado, o no hay `linkageType.id`, no se consulta. El catálogo vacío es la lista inicial.

`visibleActivityTree` en `professor-activities.model.ts` recorre ese árbol y devuelve solo lo que se puede ofrecer:

1. Descarta el nodo si su `id` está en las restricciones (`tipoActividad.id`) o si `estado` no es activo. Activo es `''`, `'1'` o `'ACTIVO'`.
2. Repite lo mismo con cada hijo.
3. Si el nodo **tenía** hijos y todos quedaron descartados, el padre también se oculta. No queda un título vacío.
4. Si el nodo **nació** sin hijos, se conserva. Ese es el caso de una actividad padre que es, a la vez, título y tarjeta.

El orden del API se respeta. No se reordena por `orden`.

## Qué hace el selector

Las opciones son las raíces de ese árbol que todavía no se han agregado. La etiqueta es `nombre`.

Al elegir una:

1. Su `id` entra en `addedActivityIds`, en el orden en que se fue agregando.
2. Esa raíz desaparece del selector.
3. El selector se vuelve a crear vacío (`selectorKey`), así queda habilitado para la siguiente.
4. Debajo aparece un `app-activity-tree` con un solo nodo: esa actividad padre.

**Quitar** saca el `id` de la lista y la opción regresa al selector. Cada padre se agrega una sola vez. Si ya no quedan opciones, el selector se deshabilita y el placeholder pasa a «Todas las actividades fueron agregadas».

Al cerrar el modal se vacía la selección. Volver a abrirlo empieza de cero, aunque el componente no se destruya.

Si no hay raíces visibles, el cuerpo dice que no hay categorías para ese tipo de vinculación. Guardar sigue deshabilitado: este flujo todavía no persiste la carga.

## Cómo se dibuja una rama

`app-activity-tree` es recursivo. Recibe `nodes` y `depth` (0 en la raíz que agregó el usuario).

| Situación | Qué se pinta |
|---|---|
| `depth === 0` | Título principal, con icono, y el botón **Quitar**. Si tiene hijos, sigue con ellos. Si no tiene, una tarjeta con el mismo nodo. |
| Tiene hijos y no es la raíz | Subtítulo (`h5`) y, debajo, sus hijos. |
| No tiene hijos | Tarjeta desplegable (`app-activity-card`). |

El `componente` del padre no elige el formulario. Solo decide el icono del título principal. Un nodo intermedio con hijos, aunque traiga `componente: "ASIGNATURA"`, es subtítulo. El formulario se resuelve únicamente dentro de la tarjeta, y la tarjeta solo existe en un nodo sin hijos.

Con el árbol habitual queda así:

```text
[icono] ACTIVIDADES ACADÉMICAS DE DOCENCIA          Quitar
        DOCENCIA
          [ Espacios académicos o de asignatura ]
          [ Práctica educativa ]
        ACTIVIDADES DE APOYO A LA DOCENCIA
          [ Tutoría de estudiantes ]
          [ Preparación ]
          [ Evaluación actividades ]

[icono] ACTIVIDADES DE INVESTIGACIÓN                Quitar
          [ Dirección de trabajo de grado ]
          [ Proyectos de investigación ]

[icono] ACTIVIDADES DE EXTENSIÓN                    Quitar
          [ Actividades de extensión ]

[icono] ACTIVIDADES DE GESTIÓN INSTITUCIONAL        Quitar
          [ Lista de actividades predeterminadas ]
          [ Proyectos del Plan de Desarrollo Institucional ]
          [ Situaciones administrativas ]
```

Extensión no tiene hijos: el nombre es el título y, debajo, la tarjeta usa el mismo nodo. Dirección de trabajo de grado sí tiene padre, así que solo es tarjeta; el título es Actividades de investigación.

Los títulos principales usan mayúsculas. El icono sale de `componente` de esa raíz:

| `componente` | Icono |
|---|---|
| `DOCENCIADIRECTA` | Birrete |
| `INVESTIGACION` | Matraz |
| `EXTENSION` | Bombilla |
| `GESTIONINSTITUCIONAL` | Maletín |
| Cualquier otro | Libro, en gris |

## Qué hay dentro de la tarjeta

`app-activity-card` es un `app-collapsible-section` cerrado al crearse. El encabezado es el `nombre` de la hoja. Al abrir, el cuerpo depende de `activityComponentKey(componente)`: se recorta y se pasa a mayúsculas.

Dos hojas con la misma clave montan el mismo componente, cada una con su propio `activity`. Espacios académicos y Práctica educativa son dos tarjetas y las dos usan `app-subject`.

| `componente` de la hoja | Componente |
|---|---|
| `ASIGNATURA` | `forms/subject` |
| `APOYO` | `forms/support` |
| `DIRECCIONTDG` | `forms/degree-work` |
| `PROYECTOSINVESTIGACION` | `forms/research-project` |
| `EXTENSION` | `forms/extension-activity` |
| `ACTIVIDADESPREDETERMINADAS` | `forms/preset-activity` |
| `PROYECTOSPLAN` | `forms/institutional-project` |
| `SITUACIONESADMINISTRATIVAS` | `forms/administrative-situation` |
| Otra clave | Texto: «Esta actividad no tiene un formulario asociado.» |

Esos formularios reciben la actividad y hoy no tienen campos. El cuerpo de cada uno es el lugar del formulario de esa clave.

El switch vive en `components/activity-card`. Ahí se importa el componente y se agrega el `@case`. La clave se compara ya normalizada, así que en el template va en mayúsculas y sin espacios (`ASIGNATURA`, no `Asignatura`).

## Piezas y responsabilidad

```text
linkage-type
  professor-activities-modal          selector, altas y bajas, carga HTTP
    activity-tree                     títulos, subtítulos, icono, Quitar
      activity-card                   desplegable y switch por componente
        forms/*                       formulario de una sola actividad
```

`professor-activities.model.ts` solo conoce el nodo, la poda y la normalización de `componente`. No elige iconos ni componentes de pantalla.
