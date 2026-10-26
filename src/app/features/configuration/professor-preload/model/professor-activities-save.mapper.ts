import {
  DirectLearningActivity,
  SimpleActivity,
} from './professor-activities-modal.models';
import { ProfessorProjectRow } from './professor-projects.model';
import {
  DetalleCargaDocenteRequest,
  SaveDetailProfessorPreloadRequest,
} from './save-detail-professor-preload.model';
import { TipoActividad } from './professor-activities.model';
import { DetailProfessorPreloadItemApi } from './detail-professor-preload.model';
import {
  buildUpdateDetailProfessorPreloadRequests,
  hasUpdateDetailProfessorPreloadRequests,
} from './professor-activities-update.mapper';

export interface SaveDetailProfessorPreloadInput {
  idCargaDocente: number;
  idCentroCosto: number | null;
  centroCostoDescripcion: string | null;
  activityTypes: TipoActividad[];
  directByCodigo: Record<string, DirectLearningActivity[]>;
  criteriaByCodigo: Record<string, SimpleActivity[]>;
  projectsByCodigo: Record<string, ProfessorProjectRow[]>;
}

export function buildSaveActivityDistributionRequest(
  input: SaveDetailProfessorPreloadInput,
): SaveDetailProfessorPreloadRequest {
  const idCentroCosto = input.idCentroCosto ?? undefined;
  const detalles: DetalleCargaDocenteRequest[] = [];

  const directCodigos = Object.keys(input.directByCodigo);
  for (let index = 0; index < directCodigos.length; index += 1) {
    const codigo = directCodigos[index];
    const categoryType = findActivityType(input.activityTypes, codigo);
    const activities = filterNewItems(input.directByCodigo[codigo] ?? []);

    for (let itemIndex = 0; itemIndex < activities.length; itemIndex += 1) {
      detalles.push(
        withCentroCosto(
          mapFadDetalle(activities[itemIndex], categoryType),
          idCentroCosto,
        ),
      );
    }
  }

  const criteriaCodigos = Object.keys(input.criteriaByCodigo);
  for (let index = 0; index < criteriaCodigos.length; index += 1) {
    const codigo = criteriaCodigos[index];
    const categoryType = findActivityType(input.activityTypes, codigo);
    const activities = filterNewItems(input.criteriaByCodigo[codigo] ?? []);

    for (let itemIndex = 0; itemIndex < activities.length; itemIndex += 1) {
      detalles.push(
        withCentroCosto(
          mapCriteriaDetalle(activities[itemIndex], categoryType),
          idCentroCosto,
        ),
      );
    }
  }

  const projectCodigos = Object.keys(input.projectsByCodigo);
  for (let index = 0; index < projectCodigos.length; index += 1) {
    const codigo = projectCodigos[index];
    const projects = filterNewItems(input.projectsByCodigo[codigo] ?? []);

    for (let itemIndex = 0; itemIndex < projects.length; itemIndex += 1) {
      detalles.push(
        withCentroCosto(mapProjectDetalle(projects[itemIndex]), idCentroCosto),
      );
    }
  }

  return {
    idCargaDocente: input.idCargaDocente,
    detalles,
  };
}

export function hasSaveableActivities(
  input: SaveDetailProfessorPreloadInput,
  loadedDetails: Map<number, DetailProfessorPreloadItemApi>,
): boolean {
  return (
    buildSaveActivityDistributionRequest(input).detalles.length > 0 ||
    hasUpdateDetailProfessorPreloadRequests(input, loadedDetails)
  );
}

function filterNewItems<T extends { idDetalleCargaDocente?: number }>(
  items: T[],
): T[] {
  return items.filter((item) => item.idDetalleCargaDocente == null);
}

export function mapFadDetalle(
  activity: DirectLearningActivity,
  categoryType: TipoActividad | undefined,
): DetalleCargaDocenteRequest {
  return {
    idTipoActividad: activity.idTipoActividad ?? categoryType?.id ?? 0,
    idTipoActividadHija: activity.idTipoActividadHija,
    codigoTipoActividad:
      activity.codigoTipoActividad ?? categoryType?.codigo ?? '',
    horas: activity.horasPresenciales,
    idUnidadRegional: activity.idUnidadRegional,
    idPrograma: activity.idPrograma,
    materia: {
      codigoMateria: activity.codigoMateria,
      idCentroCosto: activity.idCentroCostoMateria ?? null,
    },
    idGrupo: activity.idGrupo,
    relacionCargaProyecto: [],
  };
}

export function mapCriteriaDetalle(
  activity: SimpleActivity,
  categoryType: TipoActividad | undefined,
): DetalleCargaDocenteRequest {
  return {
    idTipoActividad: categoryType?.id ?? 0,
    idTipoActividadHija: activity.idTipoActividadHija,
    codigoTipoActividad: categoryType?.codigo ?? '',
    horas: activity.horasDedicacion,
    materia: null,
    relacionCargaProyecto: [],
  };
}

export function mapProjectDetalle(
  project: ProfessorProjectRow,
): DetalleCargaDocenteRequest {
  return {
    idTipoActividad: project.idTipoActividad,
    codigoTipoActividad: project.codigoTipoActividad,
    horas: project.horasDedicacion ?? 0,
    materia: null,
    relacionCargaProyecto: [
      {
        idPersonaProyecto: project.idPersonaProyecto,
        idProyecto: project.idProyecto,
      },
    ],
  };
}

export function findActivityType(
  activityTypes: TipoActividad[],
  codigo: string,
): TipoActividad | undefined {
  return activityTypes.find((type) => type.codigo === codigo);
}

export function withCentroCosto(
  detalle: DetalleCargaDocenteRequest,
  idCentroCosto: number | undefined,
): DetalleCargaDocenteRequest {
  if (idCentroCosto == null) {
    return detalle;
  }

  return { ...detalle, idCentroCosto };
}

export { buildUpdateDetailProfessorPreloadRequests };
