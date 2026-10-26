import {
  DetailProfessorPreloadItemApi,
} from './detail-professor-preload.model';
import {
  DetalleCargaDocenteRequest,
  SaveDetailProfessorPreloadRequest,
} from './save-detail-professor-preload.model';
import {
  DirectLearningActivity,
  SimpleActivity,
} from './professor-activities-modal.models';
import { ProfessorProjectRow } from './professor-projects.model';
import {
  SaveDetailProfessorPreloadInput,
  mapFadDetalle,
  mapCriteriaDetalle,
  mapProjectDetalle,
  findActivityType,
  withCentroCosto,
} from './professor-activities-save.mapper';
import {
  patchFadDetailItem,
  patchCriteriaDetailItem,
  patchProjectDetailItem,
  hasDetailChanges,
} from './professor-activities-update.mapper';

export interface NoveltyDistributionResult {
  saveRequest: SaveDetailProfessorPreloadRequest;
  updateRequests: DetailProfessorPreloadItemApi[];
}

export function buildNoveltyActivityDistributionRequest(
  input: SaveDetailProfessorPreloadInput,
  loadedDetails: Map<number, DetailProfessorPreloadItemApi>,
): NoveltyDistributionResult {
  const idCentroCosto = input.idCentroCosto ?? undefined;
  const detalles: DetalleCargaDocenteRequest[] = [];
  const updateRequests: DetailProfessorPreloadItemApi[] = [];

  const directCodigos = Object.keys(input.directByCodigo);
  for (let index = 0; index < directCodigos.length; index += 1) {
    const codigo = directCodigos[index];
    const categoryType = findActivityType(input.activityTypes, codigo);
    collectDirectNovelty(
      input.directByCodigo[codigo] ?? [],
      categoryType,
      input,
      loadedDetails,
      idCentroCosto,
      detalles,
      updateRequests,
    );
  }

  const criteriaCodigos = Object.keys(input.criteriaByCodigo);
  for (let index = 0; index < criteriaCodigos.length; index += 1) {
    const codigo = criteriaCodigos[index];
    const categoryType = findActivityType(input.activityTypes, codigo);
    collectCriteriaNovelty(
      input.criteriaByCodigo[codigo] ?? [],
      categoryType,
      input,
      loadedDetails,
      idCentroCosto,
      detalles,
      updateRequests,
    );
  }

  const projectCodigos = Object.keys(input.projectsByCodigo);
  for (let index = 0; index < projectCodigos.length; index += 1) {
    const codigo = projectCodigos[index];
    collectProjectNovelty(
      input.projectsByCodigo[codigo] ?? [],
      input,
      loadedDetails,
      idCentroCosto,
      detalles,
      updateRequests,
    );
  }

  return {
    saveRequest: {
      idCargaDocente: input.idCargaDocente,
      detalles,
    },
    updateRequests,
  };
}

export function hasNoveltyChanges(
  input: SaveDetailProfessorPreloadInput,
  loadedDetails: Map<number, DetailProfessorPreloadItemApi>,
): boolean {
  const directCodigos = Object.keys(input.directByCodigo);

  for (let index = 0; index < directCodigos.length; index += 1) {
    const codigo = directCodigos[index];
    const activities = input.directByCodigo[codigo] ?? [];

    for (let itemIndex = 0; itemIndex < activities.length; itemIndex += 1) {
      const activity = activities[itemIndex];

      // Cuando se agrega una nueva actividad, hubo un cambio real
      if (activity.idDetalleCargaDocente == null) {
        return true;
      }

      const original = loadedDetails.get(activity.idDetalleCargaDocente);
      if (!original?.detalles[0]) {
        continue;
      }

      // Cuando se actualiza una actividad, hubo un cambio real
      const patched = patchFadDetailItem(original, activity, input);
      if (hasDetailChanges(original, patched)) {
        return true;
      }
    }
  }

  const criteriaCodigos = Object.keys(input.criteriaByCodigo);

  for (let index = 0; index < criteriaCodigos.length; index += 1) {
    const codigo = criteriaCodigos[index];
    const activities = input.criteriaByCodigo[codigo] ?? [];
    const categoryType = findActivityType(input.activityTypes, codigo);

    for (let itemIndex = 0; itemIndex < activities.length; itemIndex += 1) {
      const activity = activities[itemIndex];

      // Cuando se agrega una nueva actividad, hubo un cambio real
      if (activity.idDetalleCargaDocente == null) {
        return true;
      }

      const original = loadedDetails.get(activity.idDetalleCargaDocente);
      if (!original?.detalles[0]) {
        continue;
      }

      // Cuando se actualiza una actividad, hubo un cambio real
      const patched = patchCriteriaDetailItem(original, activity, categoryType, input);
      if (hasDetailChanges(original, patched)) {
        return true;
      }
    }
  }

  const projectCodigos = Object.keys(input.projectsByCodigo);

  for (let index = 0; index < projectCodigos.length; index += 1) {
    const codigo = projectCodigos[index];
    const projects = input.projectsByCodigo[codigo] ?? [];
    
    for (let itemIndex = 0; itemIndex < projects.length; itemIndex += 1) {
      const project = projects[itemIndex];

      // Cuando se agrega un nuevo proyecto, hubo un cambio real
      if (project.idDetalleCargaDocente == null) {
        return true;
      }

      const original = loadedDetails.get(project.idDetalleCargaDocente);
      if (!original?.detalles[0]) {
        continue;
      }

      // Cuando se actualiza un proyecto, hubo un cambio real
      const patched = patchProjectDetailItem(original, project, input);
      if (hasDetailChanges(original, patched)) {
        return true;
      }
    }
  }

  // No hubo cambios nuevos o actualizados
  return false;
}


function isMarkedAsNovelty(
  original: DetailProfessorPreloadItemApi,
): boolean {
  // esDeNovedad = 1 -> Viene de tabla detalles novedad
  // esDeNovedad = 0 -> Viene de tabla detalles
  return original.esDeNovedad === 1;
}

function collectDirectNovelty(
  activities: DirectLearningActivity[],
  categoryType: ReturnType<typeof findActivityType>,
  input: SaveDetailProfessorPreloadInput,
  loadedDetails: Map<number, DetailProfessorPreloadItemApi>,
  idCentroCosto: number | undefined,
  detalles: DetalleCargaDocenteRequest[],
  updateRequests: DetailProfessorPreloadItemApi[],
): void {
  for (let index = 0; index < activities.length; index += 1) {
    const activity = activities[index];

    if (activity.idDetalleCargaDocente == null) {
      detalles.push(withCentroCosto(mapFadDetalle(activity, categoryType), idCentroCosto));
      continue;
    }

    const original = loadedDetails.get(activity.idDetalleCargaDocente);
    if (!original?.detalles[0]) {
      continue;
    }

    // Si viene de la original, se debe crear como nuevo detalle y se agrega al save
    if (!isMarkedAsNovelty(original)) {
      detalles.push(withCentroCosto(mapFadDetalle(activity, categoryType), idCentroCosto));
      continue;
    }

    // Si viene de novedad, se actualiza si algo cambio
    const patched = patchFadDetailItem(original, activity, input);
    if (hasDetailChanges(original, patched)) {
      updateRequests.push(patched);
    }
  }
}

function collectCriteriaNovelty(
  activities: SimpleActivity[],
  categoryType: ReturnType<typeof findActivityType>,
  input: SaveDetailProfessorPreloadInput,
  loadedDetails: Map<number, DetailProfessorPreloadItemApi>,
  idCentroCosto: number | undefined,
  detalles: DetalleCargaDocenteRequest[],
  updateRequests: DetailProfessorPreloadItemApi[],
): void {
  for (let index = 0; index < activities.length; index += 1) {
    const activity = activities[index];

    if (activity.idDetalleCargaDocente == null) {
      detalles.push(withCentroCosto(mapCriteriaDetalle(activity, categoryType), idCentroCosto));
      continue;
    }

    const original = loadedDetails.get(activity.idDetalleCargaDocente);
    if (!original?.detalles[0]) {
      continue;
    }

    // Si viene de la original, se debe crear como nuevo detalle y se agrega al save
    if (!isMarkedAsNovelty(original)) {
      detalles.push(withCentroCosto(mapCriteriaDetalle(activity, categoryType), idCentroCosto));
      continue;
    }

    // Si viene de novedad, se actualiza si algo cambio
    const patched = patchCriteriaDetailItem(original, activity, categoryType, input);
    if (hasDetailChanges(original, patched)) {
      updateRequests.push(patched);
    }
  }
}

function collectProjectNovelty(
  projects: ProfessorProjectRow[],
  input: SaveDetailProfessorPreloadInput,
  loadedDetails: Map<number, DetailProfessorPreloadItemApi>,
  idCentroCosto: number | undefined,
  detalles: DetalleCargaDocenteRequest[],
  updateRequests: DetailProfessorPreloadItemApi[],
): void {
  for (let index = 0; index < projects.length; index += 1) {
    const project = projects[index];

    if (project.idDetalleCargaDocente == null) {
      detalles.push(withCentroCosto(mapProjectDetalle(project), idCentroCosto));
      continue;
    }

    const original = loadedDetails.get(project.idDetalleCargaDocente);
    if (!original?.detalles[0]) {
      continue;
    }

    // Si viene de la original, se debe crear como nuevo detalle y se agrega al save
    if (!isMarkedAsNovelty(original)) {
      detalles.push(withCentroCosto(mapProjectDetalle(project), idCentroCosto));
      continue;
    }

    // Si viene de novedad, se actualiza si algo cambio
    const patched = patchProjectDetailItem(original, project, input);
    if (hasDetailChanges(original, patched)) {
      updateRequests.push(patched);
    }
  }
}