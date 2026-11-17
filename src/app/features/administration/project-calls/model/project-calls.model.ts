export interface ConvocatoriaOpcion {
  id: number;
  nombre: string;
  periodo: string;
  estado: string;
}

export interface ProjectCallItem {
  id: number;
  nombre: string;
  descripcion: string;
  estado: string;
  totalProyectos: number;
  totalConvocatorias: number;
  convocatorias: ConvocatoriaOpcion[];
}

export interface ProjectCallFormData {
  nombre: string;
  descripcion?: string;
  estado: string;
  idConvocatorias: number[];
}

export interface DeleteBulkProjectCallsRequest {
  ids: number[];
}

export function resolveProjectCallConvocatoriaLabel(
  item: ProjectCallItem,
): string {
  if (!item.convocatorias || item.convocatorias.length === 0) {
    return 'Sin convocatorias';
  }
  return item.convocatorias
    .map((c) => (c.periodo ? `${c.nombre} (${c.periodo})` : c.nombre))
    .join(', ');
}
