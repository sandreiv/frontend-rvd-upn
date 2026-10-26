export type PreloadCallContratacion = '1' | '0' | null;

export interface PreloadCallItem {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  nombreCompleto: string;
  periodoUniversidad: string;
  nivelEducativo: string;
  idRelacion: number | null;
  contratacion: PreloadCallContratacion;
}

/** Item crudo del listado */
export interface PreloadCallListApiItem {
  id?: number | string;
  idConvocatoria?: number | string;
  nombre: string;
  descripcion: string;
  estado: string;
  fechaInicio: string;
  fechaFin: string;
  nombreCompleto: string;
  periodoUniversidad: string;
  nivelEducativo: string;
  idRelacion?: number | string | null;
  contratacion?: string | null;
}

export function resolvePreloadCallListId(
  item: PreloadCallListApiItem,
): number | null {
  const candidates = [item.id, item.idConvocatoria];

  for (const value of candidates) {
    if (value == null || value === '') {
      continue;
    }

    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}

function resolveIdRelacion(
  value: number | string | null | undefined,
): number | null {
  if (value == null || value === '') {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

export function resolveContratacion(
  value: string | null | undefined,
): PreloadCallContratacion {
  if (value === '1' || value === '0') {
    return value;
  }
  return null;
}

export function isHiringContratacion(
  value: string | null | undefined,
): boolean {
  return value === '1';
}

export function toContratacionValue(isHiring: boolean): '1' | '0' {
  return isHiring ? '1' : '0';
}

export function labelContratacion(
  value: string | null | undefined,
): string {
  return isHiringContratacion(value) ? 'Contratación' : 'Precarga';
}

export function normalizePreloadCallListItem(item: PreloadCallListApiItem): PreloadCallItem | null {
  const id = resolvePreloadCallListId(item);
  if (id == null) {
    return null;
  }

  return {
    id,
    nombre: item.nombre ?? '',
    descripcion: item.descripcion ?? '',
    estado: item.estado ?? '',
    fechaInicio: item.fechaInicio ?? '',
    fechaFin: item.fechaFin ?? '',
    nombreCompleto: item.nombreCompleto ?? '',
    periodoUniversidad: item.periodoUniversidad ?? '',
    nivelEducativo: item.nivelEducativo ?? '',
    idRelacion: resolveIdRelacion(item.idRelacion),
    contratacion: resolveContratacion(item.contratacion),
  };
}

/** Respuesta de GET /configuration/preload-call/detail/{id} */
export interface PreloadCallDetailResponse {
  convocatoria: PreloadCallDetailConvocatoria;
  fechas: PreloadCallDetailFecha[];
  convocatoriaTipoContratacion: PreloadCallDetailCotc[];
}

export interface PreloadCallDetailConvocatoria {
  id?: number;
  nombre: string;
  descripcion: string;
  autoriza: PersonaAutorizaConvocatoriaItem;
  periodo: UniversityPeriodItem;
  nivelEducativo: EducationalLevelItem;
  contratacion?: string | null;
}

export interface PreloadCallDetailFecha {
  id?: number;
  codigo: 'CNV' | 'CTEI' | 'ISU';
  fechaInicio: string;
  fechaFin: string;
}

export interface PreloadCallDetailCotc {
  id: number;
  idModalidadContratacion: number;
  fechas: PreloadCallDetailCotcFecha[];
}

export interface PreloadCallDetailCotcFecha {
  id: number;
  vacaciones: number | null;
  fechaInicio: string;
  fechaFin: string;
  semanas: number | string;
}

export interface PersonaAutorizaConvocatoriaItem {
  id: number;
  documentoIdentidad: string;
  nombreCompleto: string;
  telefonoCelular: string | null;
}

export interface SearchGeneralPersonParams {
  nombre?: string;
  documento?: string;
  idModalidadContratacion?: number;
  idConvocatoria?: number;
}

export interface ModalityFormItem {
  id: string;
  cotcId?: number;
  fechaId?: number;
  tipoModalidad: string;
  tipoModalidadLabel: string;
  fechaInicio: string | null;
  fechaFin: string | null;
  diasVacaciones: number | null;
  semanas: number | null;
}

export interface FechaFormMeta {
  codigo: 'CNV' | 'CTEI' | 'ISU';
  id?: number;
}

/** Respuesta de GET /configuration/preload-call/list-modality */
export interface ModalityItem {
  id: number;
  nombre: string;
  descripcion: string;
  instructivo: string | null;
  estado: string;
  sigla: string | null;
}

export interface UniversityPeriodItem {
  id: number;
  anio: number;
  periodo: string;
}

/** Respuesta de GET /configuration/preload-call/list-educational-level */
export interface EducationalLevelItem {
  id: number;
  descripcion: string;
}


/** Restringir coordinación */
export interface RestrictCoordinationCoordinacion {
  id: number;
  nombre: string;
  descripcion: string;
  codigo: string | null;
}

export interface RestrictCoordinationItem {
  id: number;
  coordinacion: RestrictCoordinationCoordinacion;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
}

export interface RestrictCoordinationFormData {
  idConvocatoria: number | null;
  idCoordinacion: number;
  idFechasConvocatoria: number | null;
  fechaInicio: string;
  fechaFin: string;
  estado: '1' | '0';
}

/** Payload de eliminación (CoordinacionRestriccionDTO) */
export type RestrictCoordinationDeleteRequest = RestrictCoordinationItem;

export interface RestrictCoordinationSaveEvent {
  id: number | null;
  data: RestrictCoordinationFormData;
}



