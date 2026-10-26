# Docentes de planta

Planta dejó de ser una modalidad de contratación. La pestaña se arma con el padrón de la coordinación (`DOCENTESPLANTACOORDINACION`). Si ese padrón no tiene docentes, la pestaña no se muestra.

El frontend ya no decide que alguien es de planta por `esPlanta`, por el id `5`, por la sigla ni por el nombre «planta».

## Por qué cambió

Antes el backend marcaba la modalidad cuando el nombre o la sigla decía «planta» y, con eso, cambiaba fechas, listados, valor del contrato y presupuesto. Esa fila sale del catálogo. Si el nombre cambiaba, la regla se perdía.

Ahora hay dos preguntas distintas, y las resuelve el backend:

- A quién mostrar: quien esté en el padrón de la coordinación.
- A quién aplicarle las reglas de planta (sin valor de contrato y con proyecto CTEI o ISU): quien esté vigente en `TALENTOV3.TRABAJADORLABOR`. El frontend no consulta esa tabla para pintar la lista.

La carga de planta es una fila de `CARGADOCENTE` sin `idModalidadContratacion`. No se mezcla con la cátedra o el tiempo completo del mismo docente.

## Dónde se lista

La pestaña se llama **Planta**. Su id interno es `career-professors` (`CAREER_PROFESSOR_TAB_ID` en `coordination.model.ts`). El badge es la cantidad de docentes del padrón, no verificados sobre el total.

| Pantalla | Archivo | Endpoint |
|---|---|---|
| Precarga | `professor-preload/data/coordination.service.ts` | `GET /configuration/coordination/list-career-professor-loads?idCarga=` |
| Novedades | el mismo servicio | `GET /configuration/coordination/list-career-alteration-professors?idCarga=` |
| Contratación | `hiring-call/data/hiring-call.service.ts` | `GET /configuration/hiring-call/list-career-professors?idCarga=` |

Esos listados se piden solo con `idCarga`. Cátedra y tiempo completo ocasional siguen en `GET /list-professors-modality`.

Las pantallas que agregan la pestaña cuando el listado trae al menos un docente:

- `professor-preload/components/contract-modality-detail/`
- `professor-preload/components/alteration/components/alteration-contract-modality-detail/`
- `hiring-call/components/hiring-contract-modality-detail/`

En precarga, los docentes de planta que ya tienen carga entran al conteo de verificación y aprobación de la coordinación.

## Cómo se guarda la carga

`POST /configuration/coordination/save-career-professor-preload`

Cuerpo, definido en `save-career-professor-preload.model.ts`:

- `idCarga`
- `idConvocatoria`
- `idPersonaGeneral`

No se envía modalidad ni fechas. El botón **Activar carga** de la precarga arma ese cuerpo en `contract-modality-detail.ts`.

En la pestaña Planta de precarga no aparece **Agregar docente**. Si el docente no tiene carga, el menú solo ofrece **Activar carga**. Si ya tiene carga, el menú es actividades y ver resumen: no hay detalle de preasignación ni eliminar.

En novedades tampoco aparece **Agregar docente**. Activar carga no existe ahí. Quien no tiene carga no tiene acciones. Quien ya tiene carga usa el menú de novedades.

El combo de tipos de novedad sigue siendo `GET /coordination/list-novelties`. Cátedra y TCO envían `accion` y `idModalidadContratacion`. Planta envía solo `accion=ACTUALIZAR` (o `ELIMINAR` al borrar docente): sin modalidad, el backend devuelve las novedades con `NOVE_FORPLANTA = '1'`. Eso está en `coordination.service.ts` (`getNoveltiesTypes`, `getDeleteNovelties`) y en `alteration-professor-novelties.ts`.

En contratación la pestaña solo lista el padrón. El menú de plan de trabajo y contrato es el de las otras pestañas.

## Actividades

Las tarjetas no salen de `GET /list-activities-modality`, porque esa consulta pide una modalidad. Salen del catálogo general `GET /list-activity-types`, filtrado por `buildCareerActivityItems` en `professor-activities.config.ts`. Entran los tipos cuyo componente es `direct`, `criteria` o `project`.

Eso se usa en:

- `professor-activities-modal.ts`, cuando `isCareerProfessor` es verdadero.
- `change-direct-activities.ts` y `change-project-activities.ts`, cuando no hay modalidad de contratación.

La tarjeta de actividades directas necesita coordinación, nivel educativo, periodo y carga docente. Esos datos alcanzan para unidades, programas, materias y grupos. `idModalidadContratacion` quedó opcional en `direct-activity-card.ts`. Si es nulo, no se llama la restricción de horas por programa.

El mismo contexto, sin exigir modalidad, está en el modal de actividades de precarga y en la novedad de actividades directas.

## Límite de 40 horas

El tope está en `careerProfessor.maxActivityHours` de:

- `src/environments/environment.ts`
- `src/environments/environment.development.ts`
- `src/environments/environment.production.ts`

`career-professor.config.ts` lo expone como `CAREER_PROFESSOR_MAX_ACTIVITY_HOURS`. Para cambiar el tope se edita el entorno, no los componentes.

Si el total asignado supera ese valor, **Guardar** queda deshabilitado y se muestra el aviso de que supera el límite. También se bloquea **Para verificar**. El mismo tope aplica en las novedades de actividades directas y de proyecto cuando el docente no tiene modalidad. No exige que las horas sean exactamente 40: impide pasarlas.

## Resumen, valor y fechas

El resumen de precarga (`professor-summary.ts`) y el de novedades (`novelty-summary.ts`) reciben `isCareerProfessor`. En ese caso ocultan **Valores de contratación** y muestran la etiqueta **Planta**. El valor del contrato llega nulo desde el backend y no se recalcula en el frontend.

`professor-contract-value.ts` ya no devuelve 0 por una bandera `esPlanta`. Cátedra y tiempo completo se calculan como antes. Se quitó la prueba que esperaba 0 para planta.

En la convocatoria de precarga, el formulario de modalidad (`modality-form-modal`) y el armado del payload (`build-preload-call-save-payload.function.ts`) ya no omiten fechas ni semanas porque la etiqueta diga «planta». La convocatoria de contratación sigue sin pedir fechas para todas las modalidades.

En verificación de docentes, `toContractModality` ya no marca planta porque el nombre sea exactamente `planta`.

## Qué no cambió

La administración de coordinaciones sigue con la pestaña **Docentes planta** y los endpoints `plant-professors`. Ese padrón es el que alimenta los listados nuevos.

`esPlanta` puede seguir llegando en el DTO de la modalidad. El frontend no lo usa para abrir la pestaña ni para las reglas de planta.
