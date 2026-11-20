export interface LinkageTypeLookup {
  id: number;
  descripcion: string;
}

export interface LinkageTypeItem {
  id: number;
  idTipoVinculacionConvocatoria: number;
  clasificacionDocente: LinkageTypeLookup;
  dedicacionDocente: LinkageTypeLookup;
  minimo: string | null;
  maximo: string | null;
  formaPago: string;
  tipoContrato: string;
  esPlanta: number;
  tipoHoras: string;
}

export interface LinkageTypeListResponse {
  tipoVinculaciones: LinkageTypeItem[];
}

/** Máximo de horas del tipo de vinculación. Vacío si no viene o no es numérico. */
export function linkageHoursLimit(item: LinkageTypeItem | null | undefined): number | null {
  const raw = item?.maximo?.trim() ?? '';
  if (!raw) {
    return null;
  }

  const value = Number(raw.replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

/** Texto del periodo de las horas: semanales, mensuales o semestrales. */
export function linkageHoursPeriod(item: LinkageTypeItem | null | undefined): string {
  const key = item?.tipoHoras?.trim().toUpperCase() ?? '';
  if (key === 'SEMANAL') {
    return 'semanales';
  }
  if (key === 'MENSUAL') {
    return 'mensuales';
  }
  if (key === 'SEMESTRAL') {
    return 'semestrales';
  }

  return '';
}

export function linkageTypeLabel(item: LinkageTypeItem): string {
  const clasificacion = item.clasificacionDocente?.descripcion?.trim() ?? '';
  const dedicacion = item.dedicacionDocente?.descripcion?.trim() ?? '';

  if (clasificacion && dedicacion) {
    return `${clasificacion} - ${dedicacion}`;
  }

  return clasificacion || dedicacion || '-';
}
