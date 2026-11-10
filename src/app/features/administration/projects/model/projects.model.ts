/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Modelo general de proyectos, participantes y actividades
 */
export interface ProjectLookup {
  id: number;
  nombre: string;
  codigo?: string;
}

export interface TipoActividadProyectoItem {
  id: number;
  idPadre: number | null;
  nombre: string;
  nombrePadre: string | null;
  nombreCompleto: string;
  descripcion: string | null;
  componente: string | null;
  esSeleccionable: boolean;
}

export interface ProjectItem {
  id: number;
  idTipoActividad: number;
  idCoordinacion: number;
  idProyectoPadre?: number | null;
  idMateriaTdg?: number | null;
  nombre: string;
  descripcion?: string | null;
  actaConsejo?: string | null;
  estado?: string | null;
  tipoActividad?: ProjectLookup | null;
  coordinacion?: ProjectLookup | null;
  totalDocentes?: number;
  idConvocatoriaProyectos?: number | null;
  idTipoProyecto?: number | null;
  monto?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  convocatoriaProyectos?: ProjectLookup | null;
  tipoProyecto?: ProjectLookup | null;
}

export interface ProjectFormData {
  nombre: string;
  descripcion?: string | null;
  actaConsejo?: string | null;
  idTipoActividad: number;
  idCoordinacion: number;
  idProyectoPadre?: number | null;
  idMateriaTdg?: number | null;
  estado?: string;
  monto?: string;
  fechaInicio?: string;
  fechaFin?: string;
  idConvocatoriaProyectos?: number;
  idTipoProyecto?: number;
}

export interface ProjectPersonItem {
  id: number;
  idProyecto: number;
  idPersonaGeneral: number;
  nombreCompleto: string;
  documento?: string;
  idTipoActividad?: number | null;
  tipoActividad?: ProjectLookup | null;
  horas: string;
  observacion: string | null;
  estado?: string;
  esActivo?: '1' | '0' | 'S' | 'N' | string;
}

export interface ProjectPersonFormData {
  idProyecto: number;
  idPersonaGeneral: number;
  idTipoActividad?: number | null;
  tipoActividad?: ProjectLookup | null;
  horas: string;
  observacion?: string | null;
  estado?: '1' | '0' | string;
  esActivo?: '1' | '0' | string;
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
  value: unknown,
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
  type: unknown,
): ProjectTypeLimits {
  const t = type as {
    minimoParticipantes?: unknown;
    maximoParticipantes?: unknown;
    montoMaximo?: unknown;
    minimoProductos?: unknown;
  } | null | undefined;

  return {
    minimoParticipantes: parseLimitNumber(t?.minimoParticipantes),
    maximoParticipantes: parseLimitNumber(t?.maximoParticipantes),
    montoMaximo: parseLimitNumber(t?.montoMaximo),
    minimoProductos: parseLimitNumber(t?.minimoProductos),
  };
}

export function enrichProjectItem(
  item: ProjectItem,
  activityTypeMap?: Map<number, string> | null,
  coordinacionMap?: Map<number, string> | null,
  param3?: Map<number, string> | null,
  ..._extra: unknown[]
): ProjectItem {
  let tipoActividadNombre = item.tipoActividad?.nombre;
  let coordinacionNombre = item.coordinacion?.nombre;

  if (param3 !== undefined) {
    coordinacionNombre =
      coordinacionNombre || param3?.get(item.idCoordinacion) || '';
    tipoActividadNombre =
      tipoActividadNombre ||
      coordinacionMap?.get(item.idTipoActividad) ||
      activityTypeMap?.get(item.idTipoActividad) ||
      '';
  } else {
    tipoActividadNombre =
      tipoActividadNombre || activityTypeMap?.get(item.idTipoActividad) || '';
    coordinacionNombre =
      coordinacionNombre || coordinacionMap?.get(item.idCoordinacion) || '';
  }

  return {
    ...item,
    tipoActividad: {
      id: item.idTipoActividad,
      nombre: tipoActividadNombre || '',
    },
    coordinacion: {
      id: item.idCoordinacion,
      nombre: coordinacionNombre || '',
    },
  };
}
