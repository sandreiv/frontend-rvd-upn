export interface ProfessorLoadState {
  id: number | null;
  nombre: string | null;
  descripcion: string | null;
  orden: string | null;
  tipo: string | null;
}

export interface ProfessorLoadItem {
  idPersonaGeneral: number | null;
  nombreCompleto: string | null;
  idCargaDocente: number | null;
  idTipoVinculacionConvocatoria: number | null;
  idCategoriaCatedratico: number | null;
  idCoordinacion: number | null;
  estadoCarga: ProfessorLoadState | null;
  cargaFechaInicio: string | null;
  cargaFechaFin: string | null;
  valorContrato: number | null;
  valorPrestaciones: number | null;
  asignacionSalarial: number | null;
  totalContrato: number | null;
  horas: string | null;
  valorHora: number | null;
  puntos: string | null;
  valorPunto: number | null;
  semanas: string | null;
  onceMeses: string | null;
  tieneActividades: number | null;
}

const NN_LABEL = 'NN';

export function professorLoadDisplayName(item: ProfessorLoadItem): string {
  if (item.idPersonaGeneral == null) {
    return NN_LABEL;
  }

  return item.nombreCompleto?.trim() || NN_LABEL;
}

export type ProfessorLoadBadgeTone =
  | 'success'
  | 'brand'
  | 'warning'
  | 'error'
  | 'gray';

export interface ProfessorLoadStatus {
  label: string;
  tone: ProfessorLoadBadgeTone;
}

export function professorLoadStatus(
  estado: ProfessorLoadState | null | undefined,
): ProfessorLoadStatus | null {
  const label = estado?.nombre?.trim() || estado?.descripcion?.trim() || '';
  if (!label) {
    return null;
  }

  return {
    label,
    tone: professorLoadTone(estado?.orden),
  };
}

function professorLoadTone(
  orden: string | null | undefined,
): ProfessorLoadBadgeTone {
  switch ((orden ?? '').trim()) {
    case '1':
      return 'gray';
    case '2':
      return 'success';
    case '3':
      return 'success';
    case '4':
      return 'warning';
    default:
      return 'gray';
  }
}
