import { CoordinationCentroCosto } from './coordination.model';
import {
  DetailProfessorPreloadItemApi,
  DetalleCargaDocenteFormularioApi,
} from './detail-professor-preload.model';
import {
  DirectLearningActivity,
  SimpleActivity,
} from './professor-activities-modal.models';
import { ProfessorProjectRow } from './professor-projects.model';
import { TipoActividad } from './professor-activities.model';
import { SaveDetailProfessorPreloadInput } from './professor-activities-save.mapper';

export function buildUpdateDetailProfessorPreloadRequests(
  input: SaveDetailProfessorPreloadInput,
  loadedDetails: Map<number, DetailProfessorPreloadItemApi>,
): DetailProfessorPreloadItemApi[] {
  const requests: DetailProfessorPreloadItemApi[] = [];

  const directCodigos = Object.keys(input.directByCodigo);
  for (let index = 0; index < directCodigos.length; index += 1) {
    collectDirectUpdates(
      input.directByCodigo[directCodigos[index]] ?? [],
      input,
      loadedDetails,
      requests,
    );
  }

  const criteriaCodigos = Object.keys(input.criteriaByCodigo);
  for (let index = 0; index < criteriaCodigos.length; index += 1) {
    const codigo = criteriaCodigos[index];
    collectCriteriaUpdates(
      input.criteriaByCodigo[codigo] ?? [],
      findActivityType(input.activityTypes, codigo),
      input,
      loadedDetails,
      requests,
    );
  }

  const projectCodigos = Object.keys(input.projectsByCodigo);
  for (let index = 0; index < projectCodigos.length; index += 1) {
    collectProjectUpdates(
      input.projectsByCodigo[projectCodigos[index]] ?? [],
      input,
      loadedDetails,
      requests,
    );
  }

  return requests;
}

export function hasUpdateDetailProfessorPreloadRequests(
  input: SaveDetailProfessorPreloadInput,
  loadedDetails: Map<number, DetailProfessorPreloadItemApi>,
): boolean {
  return (
    buildUpdateDetailProfessorPreloadRequests(input, loadedDetails).length > 0
  );
}

function collectDirectUpdates(
  activities: DirectLearningActivity[],
  input: SaveDetailProfessorPreloadInput,
  loadedDetails: Map<number, DetailProfessorPreloadItemApi>,
  requests: DetailProfessorPreloadItemApi[],
): void {
  for (let index = 0; index < activities.length; index += 1) {
    const activity = activities[index];
    if (activity.idDetalleCargaDocente == null) {
      continue;
    }

    const original = loadedDetails.get(activity.idDetalleCargaDocente);
    if (!original?.detalles[0]) {
      continue;
    }

    const patched = patchFadDetailItem(original, activity, input);
    if (hasDetailChanges(original, patched)) {
      requests.push(patched);
    }
  }
}

function collectCriteriaUpdates(
  activities: SimpleActivity[],
  parentType: TipoActividad | undefined,
  input: SaveDetailProfessorPreloadInput,
  loadedDetails: Map<number, DetailProfessorPreloadItemApi>,
  requests: DetailProfessorPreloadItemApi[],
): void {
  for (let index = 0; index < activities.length; index += 1) {
    const activity = activities[index];
    if (activity.idDetalleCargaDocente == null) {
      continue;
    }

    const original = loadedDetails.get(activity.idDetalleCargaDocente);
    if (!original?.detalles[0]) {
      continue;
    }

    const patched = patchCriteriaDetailItem(
      original,
      activity,
      parentType,
      input,
    );
    if (hasDetailChanges(original, patched)) {
      requests.push(patched);
    }
  }
}

function collectProjectUpdates(
  projects: ProfessorProjectRow[],
  input: SaveDetailProfessorPreloadInput,
  loadedDetails: Map<number, DetailProfessorPreloadItemApi>,
  requests: DetailProfessorPreloadItemApi[],
): void {
  for (let index = 0; index < projects.length; index += 1) {
    const project = projects[index];
    if (project.idDetalleCargaDocente == null) {
      continue;
    }

    const original = loadedDetails.get(project.idDetalleCargaDocente);
    if (!original?.detalles[0]) {
      continue;
    }

    const patched = patchProjectDetailItem(original, project, input);
    if (hasDetailChanges(original, patched)) {
      requests.push(patched);
    }
  }
}

export function patchFadDetailItem(
  original: DetailProfessorPreloadItemApi,
  activity: DirectLearningActivity,
  input: SaveDetailProfessorPreloadInput,
): DetailProfessorPreloadItemApi {
  const detalle = cloneDetalle(original.detalles[0]);
  detalle.horas = String(activity.horasPresenciales);
  detalle.centroCosto = resolveCentroCosto(
    input.idCentroCosto,
    input.centroCostoDescripcion,
    detalle.centroCosto,
  );
  detalle.unidadRegional = {
    id: activity.idUnidadRegional,
    nombre: activity.unidad,
  };
  detalle.programa = {
    id: activity.idPrograma,
    nombre: activity.programa,
  };
  detalle.grupo = {
    id: activity.idGrupo,
    nombre: activity.grupo,
    capacidad: activity.cupos,
  };
  detalle.materia = {
    codigoMateria: activity.codigoMateria,
    nombre: activity.materia,
    idCentroCosto: activity.idCentroCostoMateria ?? null,
  };

  return buildUpdateItem(original, detalle);
}

export function patchCriteriaDetailItem(
  original: DetailProfessorPreloadItemApi,
  activity: SimpleActivity,
  parentType: TipoActividad | undefined,
  input: SaveDetailProfessorPreloadInput,
): DetailProfessorPreloadItemApi {
  const detalle = cloneDetalle(original.detalles[0]);
  detalle.horas = String(activity.horasDedicacion);
  detalle.centroCosto = resolveCentroCosto(
    input.idCentroCosto,
    input.centroCostoDescripcion,
    detalle.centroCosto,
  );

  if (activity.idTipoActividadHija != null) {
    const currentId = detalle.tipoActividadHija[0]?.id;
    if (currentId !== activity.idTipoActividadHija) {
      detalle.tipoActividadHija = [
        buildTipoActividadHija(activity, parentType),
      ];
    }
  }

  return buildUpdateItem(original, detalle);
}

export function patchProjectDetailItem(
  original: DetailProfessorPreloadItemApi,
  project: ProfessorProjectRow,
  input: SaveDetailProfessorPreloadInput,
): DetailProfessorPreloadItemApi {
  const detalle = cloneDetalle(original.detalles[0]);
  detalle.horas = String(project.horasDedicacion ?? 0);
  detalle.centroCosto = resolveCentroCosto(
    input.idCentroCosto,
    input.centroCostoDescripcion,
    detalle.centroCosto,
  );

  const relacion = detalle.relacionCargaProyecto[0];
  if (relacion) {
    detalle.relacionCargaProyecto = [
      {
        ...relacion,
        idPersonaProyecto: project.idPersonaProyecto,
        idProyecto: project.idProyecto,
      },
    ];
  }

  return buildUpdateItem(original, detalle);
}

function buildUpdateItem(
  original: DetailProfessorPreloadItemApi,
  detalle: DetalleCargaDocenteFormularioApi,
): DetailProfessorPreloadItemApi {
  return {
    idDetalleCargaDocente: original.idDetalleCargaDocente,
    idCargaDocente: original.idCargaDocente,
    detalles: [detalle],
  };
}

function buildTipoActividadHija(
  activity: SimpleActivity,
  parentType: TipoActividad | undefined,
): TipoActividad {
  return {
    id: activity.idTipoActividadHija ?? 0,
    idPadre: parentType?.id ?? null,
    nombre: activity.actividad,
    descripcion: activity.actividad,
    orden: '1',
    codigo: parentType?.codigo ?? '',
  };
}

export function hasDetailChanges(
  original: DetailProfessorPreloadItemApi,
  patched: DetailProfessorPreloadItemApi,
): boolean {
  const source = original.detalles[0];
  const target = patched.detalles[0];

  if (!source || !target) {
    return true;
  }

  return (
    source.horas !== target.horas ||
    source.unidadRegional?.id !== target.unidadRegional?.id ||
    source.programa?.id !== target.programa?.id ||
    source.grupo?.id !== target.grupo?.id ||
    source.materia?.codigoMateria !== target.materia?.codigoMateria ||
    source.tipoActividadHija[0]?.id !== target.tipoActividadHija[0]?.id ||
    source.relacionCargaProyecto[0]?.idProyecto !==
      target.relacionCargaProyecto[0]?.idProyecto ||
    source.relacionCargaProyecto[0]?.idPersonaProyecto !==
      target.relacionCargaProyecto[0]?.idPersonaProyecto
  );
}

function resolveCentroCosto(
  idCentroCosto: number | null,
  descripcion: string | null,
  original: CoordinationCentroCosto | null,
): CoordinationCentroCosto {
  const id = idCentroCosto ?? original?.id ?? 0;

  return {
    id,
    descripcion: descripcion?.trim() ?? original?.descripcion ?? '',
  };
}

function cloneDetalle(
  detalle: DetalleCargaDocenteFormularioApi,
): DetalleCargaDocenteFormularioApi {
  return structuredClone(detalle);
}

function findActivityType(
  activityTypes: TipoActividad[],
  codigo: string,
): TipoActividad | undefined {
  return activityTypes.find((type) => type.codigo === codigo);
}
