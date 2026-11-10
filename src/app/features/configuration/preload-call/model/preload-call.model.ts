export interface ClasificacionDocenteItem {
  id: number;
  descripcion: string;
}

export interface DedicacionDocenteItem {
  id: number;
  descripcion: string;
}

export interface TipoHorasItem {
  valor: string;
  descripcion: string;
}

export interface TipoVinculacionDTO {
  id: number;
  idClasificacionDocente?: number | null;
  idDedicacionDocente?: number | null;
  minimo?: number | string | null;
  maximo?: number | string | null;
  tipoHoras?: string | null;
  formaPago?: string | null;
  tipoContrato?: string | null;
  esPlanta?: number | null;
  estado?: string | null;
}

export interface TipoVinculacionConvocatoriaItem {
  id?: number | null;
  idTipoVinculacion: number;
  nombreTipoVinculacion?: string | null;
  estado?: string | null;
}

export interface PeriodoExtensionDTO {
  id?: number | null;
  idPeriodoUniversidad: number;
  nombrePeriodo?: string | null;
}

export interface PreloadCallItem {
  id: number;
  nombre: string;
  descripcion: string;
  idPeriodoUniversidad: number;
  periodoUniversidad: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  idRelacion: number | null;
  esIntersemestral: string;
}

export interface PreloadCallListApiItem {
  id?: number | string;
  idConvocatoria?: number | string;
  nombre?: string | null;
  descripcion?: string | null;
  idPeriodoUniversidad?: number | string | null;
  periodoUniversidad?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  estado?: string | null;
  idRelacion?: number | string | null;
  esIntersemestral?: string | null;
}

export interface PreloadCallDetailFecha {
  id?: number;
  codigo?: string;
  fechaInicio?: string;
  fechaFin?: string;
}

export interface ConvocatoriaFormularioDTO {
  id?: number | null;
  idPeriodoUniversidad: number;
  idRelacion?: number | null;
  nombre: string;
  descripcion?: string | null;
  fechaInicio: string;
  fechaFin: string;
  estado?: string | null;
  esIntersemestral: string;
  vinculaciones: TipoVinculacionConvocatoriaItem[];
  periodosExtension?: PeriodoExtensionDTO[];
  fechas?: PreloadCallDetailFecha[];
}

export type PreloadCallDetailResponse = ConvocatoriaFormularioDTO;

export interface UniversityPeriodItem {
  id: number;
  ano?: number;
  anio?: number;
  periodo: string;
  codigoPeriodo?: string | null;
  idTipoPeriodo?: number | null;
  tipoPeriodo?: string | null;
}

export function formatUniversityPeriodLabel(period: UniversityPeriodItem): string {
  const anio = period.anio ?? period.ano ?? '';
  let tipo = '';
  if (period.tipoPeriodo?.trim()) {
    const raw = period.tipoPeriodo.trim().toLowerCase();
    tipo = ` · ${raw.charAt(0).toUpperCase() + raw.slice(1)}`;
  }
  const codigo = period.codigoPeriodo ? ` (${period.codigoPeriodo})` : '';
  return `${anio} - ${period.periodo}${codigo}${tipo}`;
}

export interface PersonaAutorizaConvocatoriaItem {
  id: number;
  documentoIdentidad: string;
  nombreCompleto: string;
  telefonoCelular?: string | null;
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

export function resolvePreloadCallListId(item: PreloadCallListApiItem): number | null {
  const candidates = [item.id, item.idConvocatoria];
  for (const value of candidates) {
    if (value == null || value === '') continue;
    const parsed = Number(value);
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
  }
  return null;
}

function resolveIdRelacion(value: number | string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) || parsed <= 0 ? null : parsed;
}

export function normalizePreloadCallListItem(item: PreloadCallListApiItem): PreloadCallItem | null {
  const id = resolvePreloadCallListId(item);
  if (id == null) return null;

  return {
    id,
    nombre: item.nombre ?? '',
    descripcion: item.descripcion ?? '',
    idPeriodoUniversidad: item.idPeriodoUniversidad != null ? Number(item.idPeriodoUniversidad) : 0,
    periodoUniversidad: item.periodoUniversidad ?? '',
    fechaInicio: item.fechaInicio ?? '',
    fechaFin: item.fechaFin ?? '',
    estado: item.estado ?? '1',
    idRelacion: resolveIdRelacion(item.idRelacion),
    esIntersemestral: item.esIntersemestral === '1' ? '1' : '0',
  };
}
