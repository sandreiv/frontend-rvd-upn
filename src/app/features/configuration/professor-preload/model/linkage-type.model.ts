export interface LinkageTypeLookup {
  id: number;
  descripcion: string;
}

export interface LinkageTypeItem {
  id: number;
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

export function linkageTypeLabel(item: LinkageTypeItem): string {
  const clasificacion = item.clasificacionDocente?.descripcion?.trim() ?? '';
  const dedicacion = item.dedicacionDocente?.descripcion?.trim() ?? '';

  if (clasificacion && dedicacion) {
    return `${clasificacion} - ${dedicacion}`;
  }

  return clasificacion || dedicacion || '-';
}
