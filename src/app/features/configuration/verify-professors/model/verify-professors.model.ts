import {
  CoordinationContractModality,
  CoordinationItem,
  ModalityProfessor,
} from '../../professor-preload/model/coordination.model';

export interface VerifyPreloadCallItem {
  id: number;
  nombre: string;
}

export interface AcademicCoordinationItem {
  id: number;
  nombre: string;
  descripcion: string;
  codigo: string | null;
}

export interface VerifyProfessorItem {
  idCargaDocente: number;
  idPersonaGeneral: number | null;
  nombreCompleto: string | null;
  documentoIdentidad?: string | null;
  modalidadContratacion?: string | null;
  estado: string;
  idModalidadContratacion: number;
  idCategoriaCatedratico: number | null;
  idCarga: number;
  idFechasConvocatoria: number | null;
  fechaConvocatoriaCodigo: string | null;
  fechaInicio: string;
  fechaFin: string;
  valorContrato: number | null;
  valorPrestaciones: number | null;
  asignacionSalarial: number | null;
  totalContrato: number | null;
  valorHora: number | null;
  puntos: string | null;
  valorPunto: number | null;
  semanas: string | null;
  onceMeses: string | null;
  horasDeExcepcion: string | null;
  tieneCarga?: boolean;
  tieneDetalleActividades?: boolean;
}

export interface VerifyProfessorsFilter {
  idPeriodoUniversidad: number;
  idConvocatoria: number;
  idCoordinacion: number;
}

export interface PendingVerifyProfessorItem {
  idCargaDocente: number;
  nombreCompleto: string | null;
  idPeriodoUniversidad: number;
  idConvocatoria: number;
  idCoordinacion: number;
  nombreCoordinacion: string | null;
}

export interface PendingVerifyProfessorsList {
  total: number;
  items: PendingVerifyProfessorItem[];
}

export const VERIFY_PROFESSORS_PATH = '/rvd/verificar-docentes';

export const VERIFY_PROFESSORS_QUERY = {
  PERIODO: 'periodo',
  CONVOCATORIA: 'convocatoria',
  COORDINACION: 'coordinacion',
} as const;

const NN_LABEL = 'NN';
const PENDING_BADGE_MAX = 99;

export function pendingProfessorName(
  item: PendingVerifyProfessorItem,
): string {
  return item.nombreCompleto?.trim() || NN_LABEL;
}

export function pendingCoordinationName(
  item: PendingVerifyProfessorItem,
): string {
  return item.nombreCoordinacion?.trim() || '-';
}

export function formatPendingBadgeCount(total: number): string {
  if (total > PENDING_BADGE_MAX) {
    return `${PENDING_BADGE_MAX}+`;
  }

  return String(total);
}

const EMPTY_COORDINATION: Omit<
  CoordinationItem,
  'id' | 'nombre' | 'descripcion' | 'codigo'
> = {
  esAcademica: 'Sí',
  unidadRegional: '',
  unidadArea: '',
  metodologia: '',
  modalidad: '',
  nivelEducativo: '',
  periodoUniversidad: '',
  idPeriodoUniversidad: null,
  anioUniversidad: null,
  idUnidadRegional: null,
  estadoCarga: '',
  idCarga: null,
  valor: null,
  valorAutorizado: null,
  idConvocatoria: null,
  idNivelEducativo: null,
  convocatoriaNombre: '',
  modalidadesContratacion: [],
  centroCosto: null,
  canEditPreassignment: false,
  editBlockReason: null,
  editionMode: 'NORMAL_ACTIVE',
};

export function formatVerifyProfessorStatus(estado: string): string {
  if (estado === '1') {
    return 'Para verificar';
  }

  if (estado === '2') {
    return 'Verificada';
  }

  if (estado === '3') {
    return 'Observaciones';
  }

  return 'En registro';
}

export function toModalityProfessor(
  item: VerifyProfessorItem,
): ModalityProfessor {
  return {
    idCargaDocente: item.idCargaDocente,
    idPersonaGeneral: item.idPersonaGeneral,
    nombreCompleto: item.nombreCompleto,
    estado: item.estado,
    tieneCarga: item.tieneCarga,
    idModalidadContratacion: item.idModalidadContratacion,
    idCategoriaCatedratico: item.idCategoriaCatedratico ?? 0,
    idCarga: item.idCarga,
    idFechasConvocatoria: item.idFechasConvocatoria ?? 0,
    fechaConvocatoriaCodigo: item.fechaConvocatoriaCodigo,
    fechaInicio: item.fechaInicio,
    fechaFin: item.fechaFin,
    valorContrato: item.valorContrato,
    valorPrestaciones: item.valorPrestaciones,
    asignacionSalarial: item.asignacionSalarial,
    totalContrato: item.totalContrato,
    valorHora: item.valorHora,
    puntos: item.puntos,
    valorPunto: item.valorPunto,
    semanas: item.semanas,
    onceMeses: item.onceMeses,
    horasDeExcepcion: item.horasDeExcepcion,
    tieneDetalleActividades: item.tieneDetalleActividades,
  };
}

export function toSummaryCoordination(
  item: AcademicCoordinationItem,
): CoordinationItem {
  return {
    ...EMPTY_COORDINATION,
    id: item.id,
    nombre: item.nombre?.trim() ?? '',
    descripcion: item.descripcion?.trim() ?? '',
    codigo: item.codigo?.trim() ?? '',
  };
}

export function toContractModality(
  item: VerifyProfessorItem,
): CoordinationContractModality {
  const nombre = item.modalidadContratacion?.trim() ?? '';

  return {
    id: item.idModalidadContratacion,
    nombre: nombre || '-',
  };
}

export function coordinationLabel(
  item: AcademicCoordinationItem,
): string {
  return item.descripcion?.trim() || item.nombre?.trim() || '-';
}
