import { AddProfessorRequest } from './add-professor.model';
import { PreloadCargaApi } from './preload-carga.model';

export interface CoordinationLookupItem {
  id: number;
  nombre?: string;
  descripcion?: string;
}

export interface CoordinationUniversityPeriod {
  id: number;
  anio: number;
  periodo: string;
}

export const CAREER_PROFESSOR_TAB_ID = 'career-professors';

export const CAREER_PROFESSOR_TAB_LABEL = 'Planta';

export interface CoordinationContractModality {
  id: number;
  nombre: string;
  esPlanta?: boolean;
}

export interface ContractModalityItem {
  id: number;
  nombre: string;
  descripcion: string;
  instructivo: string | null;
  estado: string;
  sigla: string | null;
}

export const AVAL_DESARROLLO_ESTADO = 'AVAL DESARROLLO';

export function isAvalDesarrolloCarga(
  estadoCarga: string | null | undefined,
): boolean {
  const value = estadoCarga?.trim().toLocaleUpperCase('es-CO') ?? '';
  return value === AVAL_DESARROLLO_ESTADO;
}

export interface CoordinationCentroCosto {
  id: number;
  descripcion: string;
}

export interface CoordinationPreloadCallApi {
  id: number;
  nombre: string;
  descripcion: string;
  estado?: string;
  nivelEducativo?: CoordinationLookupItem | null;
  periodoUniversidad?: CoordinationUniversityPeriod | null;
  modalidadesContratacion?: CoordinationContractModality[];
}

export interface CoordinationApiItem {
  id: number;
  nombre: string;
  descripcion: string;
  codigo: string | null;
  esAcademica: string;
  unidadRegional: CoordinationLookupItem;
  unidadArea: CoordinationLookupItem;
  metodologia: CoordinationLookupItem | null;
  modalidad: CoordinationLookupItem | null;
  convocatoria: CoordinationPreloadCallApi | null;
  carga: PreloadCargaApi | null;
  centroCosto?: CoordinationCentroCosto | null;
  canEditPreassignment?: boolean | string | null;
  editBlockReason?: string | null;
  editionMode?: string | null;
}

export interface CoordinationItem {
  id: number;
  nombre: string;
  descripcion: string;
  codigo: string;
  esAcademica: string;
  unidadRegional: string;
  unidadArea: string;
  metodologia: string;
  modalidad: string;
  nivelEducativo: string;
  periodoUniversidad: string;
  idPeriodoUniversidad: number | null;
  anioUniversidad: number | null;
  idUnidadRegional: number | null;
  estadoCarga: string;
  idCarga: number | null;
  valor: number | null;
  valorAutorizado: number | null;
  idConvocatoria: number | null;
  idNivelEducativo: number | null;
  convocatoriaNombre: string;
  modalidadesContratacion: CoordinationContractModality[];
  centroCosto: CoordinationCentroCosto | null;
  canEditPreassignment: boolean;
  editBlockReason: string | null;
  editionMode: string;
}

export interface ValuePointsPreload {
  valorHora: number;
  valorPunto: number;
  puntosDocente: number | null;
  asignacionSalarial: number | null;
}

export const UNASSIGNED_PRELOAD_CALL_FILTER = 'none';

function resolveLookupLabel(
  item: CoordinationLookupItem | null | undefined,
  field: 'nombre' | 'descripcion' = 'nombre',
): string {
  if (!item) {
    return '';
  }

  return item[field]?.trim() ?? '';
}

function formatUniversityPeriod(
  period: CoordinationUniversityPeriod | null | undefined,
): string {
  if (!period) {
    return '';
  }

  return `${period.anio}-${period.periodo}`;
}

function formatAcademicFlag(value: string | null | undefined): string {
  if (value === '1') {
    return 'Sí';
  }

  if (value === '0') {
    return 'No';
  }

  return value?.trim() ?? '';
}

function resolveEstadoCarga(
  carga: PreloadCargaApi | null | undefined,
): string {
  if (!carga?.estadoCarga) {
    return '';
  }

  return (
    resolveLookupLabel(carga.estadoCarga, 'descripcion') ||
    resolveLookupLabel(carga.estadoCarga, 'nombre')
  );
}

function normalizeCentroCosto(centroCosto: CoordinationCentroCosto | null | undefined): CoordinationCentroCosto | null {
  if (!centroCosto) {
    return null;
  }

  return {
    id: centroCosto.id,
    descripcion: centroCosto.descripcion?.trim() ?? '',
  };
}

function normalizeCanEditPreassignment(
  value: boolean | string | null | undefined,
): boolean {
  return value === true || value === '1' || value === 'true';
}

function resolveConvocatoriaNombre(convocatoria: CoordinationPreloadCallApi | null | undefined): string {
  if (!convocatoria) {
    return '';
  }

  return (
    convocatoria.nombre?.trim() ||
    convocatoria.descripcion?.trim() ||
    ''
  );
}

export function normalizeCoordinationItem(item: CoordinationApiItem): CoordinationItem {
  return {
    id: item.id,
    nombre: item.nombre?.trim() ?? '',
    descripcion: item.descripcion?.trim() ?? '',
    codigo: item.codigo?.trim() ?? '',
    esAcademica: formatAcademicFlag(item.esAcademica),
    unidadRegional: resolveLookupLabel(item.unidadRegional),
    unidadArea: resolveLookupLabel(item.unidadArea),
    metodologia: resolveLookupLabel(item.metodologia, 'descripcion'),
    modalidad: resolveLookupLabel(item.modalidad, 'descripcion'),
    nivelEducativo: resolveLookupLabel(
      item.convocatoria?.nivelEducativo,
      'descripcion',
    ),
    periodoUniversidad: formatUniversityPeriod(
      item.convocatoria?.periodoUniversidad,
    ),
    idPeriodoUniversidad: item.convocatoria?.periodoUniversidad?.id ?? null,
    anioUniversidad: item.convocatoria?.periodoUniversidad?.anio ?? null,
    idUnidadRegional: item.unidadRegional.id,
    estadoCarga: resolveEstadoCarga(item.carga),
    idCarga: item.carga?.id ?? null,
    valor: item.carga?.valor ?? null,
    valorAutorizado: item.carga?.valorAutorizado ?? null,
    idConvocatoria: item.convocatoria?.id ?? null,
    idNivelEducativo: item.convocatoria?.nivelEducativo?.id ?? null,
    convocatoriaNombre: resolveConvocatoriaNombre(item.convocatoria),
    modalidadesContratacion:
      item.convocatoria?.modalidadesContratacion ?? [],
    centroCosto: normalizeCentroCosto(item.centroCosto),
    canEditPreassignment: normalizeCanEditPreassignment(
      item.canEditPreassignment,
    ),
    editBlockReason: item.editBlockReason?.trim() || null,
    editionMode: item.editionMode?.trim() || 'NORMAL_ACTIVE',
  };
}

export interface ModalityProfessor {
  idNovedadCargaDocente?: number | null;
  idCargaDocente: number | null;
  idPersonaGeneral: number | null;
  nombreCompleto: string | null;
  estado: string;
  tieneCarga?: boolean;
  idModalidadContratacion: number;
  idCategoriaCatedratico: number;
  idCarga: number;
  idNovedadCatalogo?: number | null;
  estadoNovedad?: string | number | null;
  tipoNovedad?: string | null;
  motivoRechazo?: string | null;
  idFechasConvocatoria: number;
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
  tieneDetalleActividades?: boolean;
}

export interface ProfessorEscalafon {
  id: number;
  idCategoriaCatedratico: number;
  idModalidadContratacion: number;
  idPersonaGeneral: number;
  puntos: string;
}

export interface ProfessorCargaDocenteSummary {
  id: number;
  idCarga: number;
  idConvocatoria: number;
  idCoordinacion: number;
  idModalidadContratacion: number;
  idFechasConvocatoria: number;
}

export interface ProfessorSearchResult {
  id: number;
  documentoIdentidad: string;
  nombreCompleto: string;
  categoriaCatedratico: CoordinationLookupItem | null;
  escalafon: ProfessorEscalafon | null;
  cargaDocente?: ProfessorCargaDocenteSummary | null;
}

export interface WorkDate {
  id: number;
  fechaInicio: string;
  fechaFin: string;
  semanas: string | null;
  vacaciones: string | null;
  rangoHoras: string | null;
}

export interface LoadRestrictionPersonExceptionPreview {
  idPersona: number;
  maximoHoras: string | null;
}

export interface LoadRestrictionPreview {
  formaPago?: string | null;
  personasExcepcion: LoadRestrictionPersonExceptionPreview[];
  minimo: string | null;
  maximo: string | null;
}

export interface GetWorkDatesParams {
  idCoordinacion: number;
  idModalidadContratacion: number;
}

export interface CategoriaCatedratico {
  id: number;
  descripcion: string;
}

export interface TotalHorasPreloadItem {
  idTipoActividad: number;
  codigo: string;
  nombre: string;
  horas: number;
}

export interface TotalPreload {
  totalDocentes: number;
  totalPrestaciones: number;
  totalContratos: number;
  totalPreasignacion: number;
  totalHorasPreasignacion: TotalHorasPreloadItem[];
  totalHoras: number;
}

export interface ActivitiesHoursItem {
  codigo: string;
  nombre: string;
  horas: number;
}

export interface ActivitiesHours {
  totalHorasPreasignacion: ActivitiesHoursItem[];
  totalHoras: number;
}

export interface AssignNameNnRequest {
  idCargaDocente: number;
  idNovedad: number;
  idPersonaGeneral: number;
  idEscalafon: number;
}

export interface ChangeProfessorRequest {
  idCargaDocente: number;
  idNovedad: number;
  idPersonaGeneral: number;
  idEscalafon: number;
}

export interface DeleteProfessorRequest {
  idCargaDocente: number;
  idNovedad: number;
}

export interface AddNoveltyProfessorRequest {
  cargaDocente: AddProfessorRequest;
  idNovedad: number;
}

export interface UpdateContractValueRequest {
  idCargaDocente: number;
  idNovedad: number;
}

export interface RejectProfessorNoveltyRequest {
  idPersonaGeneral: number;
  observacion: string;
}