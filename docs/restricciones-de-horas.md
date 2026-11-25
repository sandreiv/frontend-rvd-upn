# Restricciones de horas en el modal de actividades

El modal **Gestionar actividades** no envía un detalle si las horas nuevas, sumadas a las ya guardadas, superan un máximo. La comparación se hace en `findHoursLimitViolation` (`model/hours-limit.model.ts`) antes de `saveActivityDistribution`.

Igualar un máximo es válido. Superarlo no. `minimoHoras` y el mínimo del tipo de vinculación no participan.

## Orden de las reglas

1. **Tipo de vinculación.** Es el tope que no se puede saltar. `maximo` de `list-linkage-types` aplica a la suma de todas las horas del docente, de cualquier actividad. Si el tipo no trae máximo numérico, esta regla no corre.
2. **Tipo de actividad, de la hoja hacia la raíz.** Cada hora guardada cuenta en su actividad y en cada ancestro del árbol (`hijos`) que tenga `maximoHoras`. Si un nodo trae `maximoHoras` vacío, no pone tope propio y se sigue subiendo.

El padre de horas es el padre del árbol, no `idDependencia`.

## Ejemplo

Docente de planta de tiempo completo: máximo 40 h semanales.

| Nodo | Máximo | Qué suma |
|---|---|---|
| Encargo | 4 | Solo las horas de Encargo |
| Situaciones administrativas | ninguno | No pone tope |
| Gestión institucional | 14 | Encargo, las demás situaciones, predeterminadas y proyectos del plan |
| Vinculación | 40 | Todas las horas del docente |

Un Encargo de 3 h cabe en su máximo de 4 y entra en las 14 de gestión y en las 40 de la vinculación. Un segundo Encargo de 2 h no se guarda: Encargo quedaría en 5. Si Encargo sigue en 3 y el resto de gestión ya suma 12, esas 3 h de más no se guardan por el máximo de 14, aunque Encargo por sí solo aún quepa.

Tutoría de estudiantes cuenta contra su máximo (2), contra apoyo a la docencia (8), contra actividades académicas de docencia (16) y contra la vinculación. El nodo Docencia no tiene máximo, así que no agrega otro tope.

## Cómo se ve en títulos y tarjetas

En los títulos de sección los badges quedan en una columna a la derecha. En las actividades con desplegable aparecen dentro de la tarjeta, en esa misma columna, al abrirla. Cada nivel muestra dos datos:

- **Rango:** el rango permitido. `1 – 4 h`, `Hasta 4 h`, `Desde 1 h` o `4 h` si mínimo y máximo coinciden.
- **Total:** las horas ya asignadas en ese nivel, sumando el nodo y sus descendientes.

Si el nodo no trae uno de los dos límites, se toma el del primer ancestro del árbol que sí lo tenga. Encargo muestra `1 – 4 h` porque lo trae propio. Coordinación de énfasis no trae límites, ni su padre de predeterminadas, así que muestra el rango de gestión institucional: `10 – 14 h`.

## Dónde se aplica

La rama visible del modal recibe el árbol de esa raíz y el máximo de la vinculación. Estos guardados lo consultan:

- Asignatura y práctica educativa
- Apoyo a la docencia
- Proyectos (trabajo de grado, investigación, extensión y plan institucional)
- Actividades predeterminadas y situaciones administrativas

Si hay violación, no sale la petición y se muestra el aviso **Límite de horas**. La vinculación se informa primero. Si esa cabe, se informa la actividad más baja de la cadena que se pasa.

Las horas ya guardadas salen de `list-detail-professor-load`. Las nuevas son los `detalles` del guardado que está por enviarse. Varias filas del mismo tipo se acumulan.
