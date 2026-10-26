export type ProjectCallCodigo = 'CTEI' | 'ISU';

export interface ProjectCallItem {
  id: number;
  nombre: string;
  descripcion: string;
  codigo: ProjectCallCodigo | string;
  nombreConvocatoria?: string | null;
  idConvocatoria?: number | null;
}

export interface ProjectCallFormData {
  nombre: string;
  descripcion: string;
  codigo: string;
  idConvocatoria: number;
}

export interface DeleteBulkProjectCallsRequest {
  ids: number[];
}

export const PROJECT_CALL_CODIGO_OPTIONS = [
  { value: 'CTEI', label: 'CTEI' },
  { value: 'ISU', label: 'ISU' },
];

export function resolveProjectCallConvocatoriaLabel(
  item: ProjectCallItem,
): string {
  const nombre = item.nombreConvocatoria?.trim();
  return nombre || '-';
}

export function resolveProjectCallConvocatoriaId(
  item: ProjectCallItem | null | undefined,
  options: Array<{ value: string; label: string }> = [],
): string {
  if (!item) {
    return '';
  }

  if (item.idConvocatoria != null) {
    return String(item.idConvocatoria);
  }

  const nombre = item.nombreConvocatoria?.trim().toLowerCase();
  if (!nombre) {
    return '';
  }

  const match = options.find(
    (option) => option.label.trim().toLowerCase() === nombre,
  );
  return match?.value ?? '';
}
