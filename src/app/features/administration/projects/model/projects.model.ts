import { parseCurrencyToNumber } from '../../../../shared/utils/currency.util';
import { ProjectTypeItem } from '../../project-types/model/project-types.model';

export interface ProjectLookup {
  id: number;
  nombre: string;
}

export interface ProjectItem {
  id: number;
  idConvocatoriaProyectos: number;
  idTipoProyecto: number;
  idCoordinacion: number;
  nombre: string;
  descripcion: string;
  monto: string;
  fechaInicio: string;
  fechaFin: string;
  idProyectoPadre?: number | null;
  convocatoriaProyectos?: ProjectLookup | null;
  tipoProyecto?: ProjectLookup | null;
  coordinacion?: ProjectLookup | null;
}

export interface ProjectFormData {
  nombre: string;
  descripcion: string;
  monto: string;
  fechaInicio: string;
  fechaFin: string;
  idConvocatoriaProyectos: number;
  idTipoProyecto: number;
  idCoordinacion: number;
  idProyectoPadre?: number | null;
}

export interface ProjectPersonItem {
  id: number;
  idProyecto: number;
  idPersonaGeneral: number;
  nombreCompleto: string;
  idTipoActividad: number;
  tipoActividad?: ProjectLookup | null;
  tipo: string;
  horas: string;
  observacion: string | null;
  esActivo: '1' | '0' | 'S' | 'N' | string;
}

export interface ProjectPersonFormData {
  idProyecto: number;
  idPersonaGeneral: number;
  idTipoActividad: number;
  tipo: string;
  horas: string;
  observacion: string | null;
  esActivo: '1' | '0';
}

export interface DeleteBulkProjectsRequest {
  ids: number[];
}

export interface ProjectTypeLimits {
  minimoParticipantes: number | null;
  maximoParticipantes: number | null;
  montoMaximo: number | null;
  minimoProductos: number | null;
}

export function toDateOnly(value: string | null | undefined): string {
  if (!value) {
    return '';
  }

  const datePart = value.split('T')[0];
  return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : '';
}

export function resolveProjectLookupName(
  lookup: ProjectLookup | null | undefined,
): string {
  return lookup?.nombre?.trim() || '-';
}

export function parseLimitNumber(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const numeric = Number(String(value).trim().replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
}

export function resolveProjectTypeLimits(
  type: ProjectTypeItem | null | undefined,
): ProjectTypeLimits {
  return {
    minimoParticipantes: parseLimitNumber(type?.minimoParticipantes),
    maximoParticipantes: parseLimitNumber(type?.maximoParticipantes),
    montoMaximo: parseCurrencyToNumber(type?.montoMaximo ?? null),
    minimoProductos: parseLimitNumber(type?.minimoProductos),
  };
}

export function enrichProjectItem(
  item: ProjectItem,
  convocatoriaMap: Map<number, string>,
  tipoMap: Map<number, string>,
  coordinacionMap: Map<number, string>,
): ProjectItem {
  return {
    ...item,
    convocatoriaProyectos: {
      id: item.idConvocatoriaProyectos,
      nombre:
        item.convocatoriaProyectos?.nombre ||
        convocatoriaMap.get(item.idConvocatoriaProyectos) ||
        '',
    },
    tipoProyecto: {
      id: item.idTipoProyecto,
      nombre:
        item.tipoProyecto?.nombre ||
        tipoMap.get(item.idTipoProyecto) ||
        '',
    },
    coordinacion: {
      id: item.idCoordinacion,
      nombre:
        item.coordinacion?.nombre ||
        coordinacionMap.get(item.idCoordinacion) ||
        '',
    },
  };
}
