/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Modelo general de proyectos, participantes y actividades
 * 10/11/2026 - Leonel Antonio Perez Rios - Limpieza y refactorización del modelo, remoción de funciones y tipos en desuso
 * 13/11/2026 - Inclusión de CostCenterOption, funciones de participantes, centro de costo y programa
 */

export interface ProjectLookup {
  id: number;
  nombre: string;
  codigo?: string;
}

export interface CoordinacionSupervisionItem {
  id: number;
  idPadre: number | null;
  nombre: string;
  esAcademica?: string;
  nivel?: number;
  esGestionable: boolean;
}

export interface CostCenterOption {
  id: number;
  codigo: string;
  nombre: string;
}

export interface CentroCostoItem {
  id: number;
  descripcion: string;
}

export interface ProgramaCentrosCostoItem {
  id: number;
  nombre: string;
  grupo?: string | null;
  centrosCosto: CentroCostoItem[];
}

export interface CoordinacionCentrosCostoResponse {
  id?: number | null;
  nombre?: string | null;
  centrosCosto: CentroCostoItem[];
  programas: ProgramaCentrosCostoItem[];
}

export interface ParticipantFunctionOption {
  codigo: string;
  nombre: string;
}

export interface ParticipantLevelOption {
  codigo: string;
  nombre: string;
}

export interface DayOfWeekOption {
  codigo: string;
  nombre: string;
  abreviacion: string;
}

export interface DayScheduleState {
  dia: string;
  nombre: string;
  abreviacion: string;
  activo: boolean;
  horaInicio: string;
  horaFin: string;
}

export interface ParticipantScheduleSlot {
  dia: string;
  horaInicio: string;
  horaFin: string;
}

export interface ParticipantSchedule {
  dias: string[];
  horaInicio: string;
  horaFin: string;
}

export interface ParticipantDataPayload {
  funcion?: string;
  nivel?: string;
  horario?: ParticipantScheduleSlot[] | ParticipantSchedule;
  [key: string]: unknown;
}

export interface ProjectGroupOption {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface CoordinationOption {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface TipoActividadComponenteOption {
  codigo: string;
  descripcion: string;
  requiereFuncion: boolean;
  requiereNivel: boolean;
  requiereHorario: boolean;
  aplicaPrograma: boolean;
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
  requiereFuncion?: boolean;
  requiereNivel?: boolean;
  requiereHorario?: boolean;
  aplicaPrograma?: boolean;
  minimoHoras?: number | null;
  maximoHoras?: number | null;
}

export interface ProjectItem {
  id: number;
  codigo?: string | null;
  idTipoActividad: number;
  idCoordinacion: number;
  idProyectoPadre?: number | null;
  idMateriaTdg?: number | null;
  idProyectoGrupo?: number | null;
  proyectoGrupoNombre?: string | null;
  nombre: string;
  descripcion?: string | null;
  actaConsejo?: string | null;
  numeroActa?: string | null;
  fechaActa?: string | null;
  activo?: string | null;
  estado?: string | null;
  tipoActividad?: ProjectLookup | null;
  coordinacion?: ProjectLookup | null;
  totalDocentes?: number;
  totalEstudiantes?: number;
  idConvocatoriaProyectos?: number | null;
  idTipoProyecto?: number | null;
  monto?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  convocatoriaProyectos?: ProjectLookup | null;
  tipoProyecto?: ProjectLookup | null;
}

export interface ProjectFormData {
  codigo?: string | null;
  nombre: string;
  descripcion?: string | null;
  actaConsejo?: string | null;
  numeroActa?: string | null;
  fechaActa?: string | null;
  activo?: string | null;
  idTipoActividad: number;
  idCoordinacion: number;
  idProyectoPadre?: number | null;
  idMateriaTdg?: number | null;
  idProyectoGrupo?: number | null;
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
  idCentroCosto?: number | null;
  centroCostoNombre?: string | null;
  centroCostoCodigo?: string | null;
  idPrograma?: number | null;
  programaNombre?: string | null;
  funcion?: string | null;
  nivel?: string | null;
  horario?: ParticipantSchedule | ParticipantScheduleSlot[] | null;
  data?: string | null;
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
  idCentroCosto?: number | null;
  idPrograma?: number | null;
  funcion?: string | null;
  nivel?: string | null;
  horario?: ParticipantSchedule | ParticipantScheduleSlot[] | null;
  data?: string | null;
  estado?: '1' | '0' | string;
  esActivo?: '1' | '0' | string;
}

export interface DeleteBulkProjectsRequest {
  ids: number[];
}

export interface ProjectStudentItem {
  id: number;
  idProyecto: number;
  idPersonaGeneral: number;
  idEstudiantePensum?: number | null;
  documento?: string;
  nombreCompleto: string;
  idPrograma?: number | null;
  nombrePrograma?: string | null;
  idCentroCosto?: number | null;
  nombreCentroCosto?: string | null;
}

export interface StudentSearchItem {
  idPersonaGeneral: number;
  documento?: string | null;
  nombreCompleto: string;
  idEstudiantePensum?: number | null;
  idPrograma?: number | null;
  nombrePrograma?: string | null;
}

export interface ProjectStudentFormData {
  id?: number;
  idProyecto: number;
  idPersonaGeneral: number;
  idEstudiantePensum?: number | null;
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
