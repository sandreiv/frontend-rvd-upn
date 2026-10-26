import { CoordinationItem, CoordinationLookupItem, CoordinationUniversityPeriod } from "../../professor-preload/model/coordination.model";
import { CdpRequest } from "./cdp-request.model";

export interface CdpContext {
  idCoordinacionFacultad: number;
  idUnidadAcademica: number;
  unidadAcademica: string;
  idFacultad: number;
  facultad: string;
}

export interface FacultyRequestCdpApiItem {
  id: number;
  nombre: string;
  descripcion: string;
  codigo: string | null;
  esAcademica: string;
  unidadRegional: CoordinationLookupItem;
  unidadArea: CoordinationLookupItem;
  metodologia: CoordinationLookupItem | null;
  modalidad: CoordinationLookupItem | null;
  periodoUniversidad: CoordinationUniversityPeriod;
  solicitud: CdpRequest;
  cdpTesoreria: CdpSearchResult | null;
}

export interface FacultyCoordinationItem extends CoordinationItem {
  solicitud: CdpRequest;
  cdpTesoreria: CdpSearchResult | null;
}

export interface CdpSearchResult {
  idRubro: number;
  idCdp: number;
  numero: string;
  fecha: string;
  vigencia: string;
  articulo: string;
  descripcion: string;
}

export interface ApproveCdpRequest {
  idSolicitud: number;
  idCdp: number;
  numero: string;
}


export function normalizeFacultyRequestCdpItem(item: FacultyRequestCdpApiItem): FacultyCoordinationItem {
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
    periodoUniversidad: formatUniversityPeriod(item.periodoUniversidad),
    idPeriodoUniversidad: item.periodoUniversidad.id ?? null,
    anioUniversidad: item.periodoUniversidad.anio ?? null,
    idUnidadRegional: item.unidadRegional.id ?? null,
    solicitud: item.solicitud,
    cdpTesoreria: item.cdpTesoreria,

    nivelEducativo: '',
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

function resolveLookupLabel(
  item: CoordinationLookupItem | null | undefined,
  field: 'nombre' | 'descripcion' = 'nombre',
): string {
  if (!item) {
    return '';
  }

  return item[field]?.trim() ?? '';
}