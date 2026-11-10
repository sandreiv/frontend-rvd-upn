/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Modelo general de proyectos, participantes y actividades
 * 10/11/2026 - Leonel Antonio Perez Rios - Limpieza y refactorización del modelo, remoción de funciones y tipos en desuso
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

export function resolveProjectLookupName(
  lookup: ProjectLookup | null | undefined,
): string {
  return lookup?.nombre?.trim() || '-';
}

export function enrichProjectItem(
  item: ProjectItem,
  activityTypeMap?: Map<number, string> | null,
  coordinacionMap?: Map<number, string> | null,
): ProjectItem {
  const tipoActividadNombre =
    item.tipoActividad?.nombre ||
    activityTypeMap?.get(item.idTipoActividad) ||
    '';

  const coordinacionNombre =
    item.coordinacion?.nombre ||
    coordinacionMap?.get(item.idCoordinacion) ||
    '';

  return {
    ...item,
    tipoActividad: {
      id: item.idTipoActividad,
      nombre: tipoActividadNombre,
    },
    coordinacion: {
      id: item.idCoordinacion,
      nombre: coordinacionNombre,
    },
  };
}
