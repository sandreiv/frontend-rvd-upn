export type ActivityTypeCode = 'CTEI' | 'AC' | 'FAD' | 'FAI' | 'ISU' | 'PTD';

/**
 * Tipo de tarjeta/formulario asociado al tipo de actividad.
 * Debe coincidir con los formType del modal de precarga docente.
 */
export type ActivityTypeComponente = 'direct' | 'criteria' | 'project';

export interface ActivityTypeItem {
  id: number;
  nombre: string;
  descripcion: string;
  codigo: ActivityTypeCode | string;
  minimoHoras: string | null;
  maximoHoras: string | null;
  orden: string | null;
  ptd: '1' | '0' | string | null;
  estado: '1' | '0' | 'ACTIVO' | 'INACTIVO' | string;
  /** Presente cuando el backend exponga tiac_componente. */
  componente?: ActivityTypeComponente | string | null;
}

export interface ActivityTypeFormData {
  nombre: string;
  descripcion: string;
  codigo: ActivityTypeCode | string;
  minimoHoras: number | null;
  maximoHoras: number | null;
  ptd: '1' | '0';
  estado: '1' | '0';
  componente: ActivityTypeComponente | string | null;
}

export interface DeleteBulkActivityTypesRequest {
  ids: number[];
}

export const ACTIVITY_TYPE_CODE_OPTIONS = [
  { value: 'CTEI', label: 'CTEI' },
  { value: 'AC', label: 'AC' },
  { value: 'FAD', label: 'FAD' },
  { value: 'FAI', label: 'FAI' },
  { value: 'ISU', label: 'ISU' },
  { value: 'PTD', label: 'PTD' },
];

export const ACTIVITY_TYPE_COMPONENTE_OPTIONS = [
  {
    value: 'direct',
    label: 'Actividades directas',
  },
  {
    value: 'criteria',
    label: 'Actividades indirectas',
  },
  {
    value: 'criteria',
    label: 'Actividades administrativas',
  },
  {
    value: 'project',
    label: 'Proyectos CTeI - ISU',
  },
];

export function parseActivityHours(
  value: string | number | null | undefined,
): number | null {
  if (value == null || value === '') {
    return null;
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function sumChildrenMaxHours(
  children: ActivityTypeItem[],
  excludeId?: number | null,
): number {
  return children.reduce((total, child) => {
    if (excludeId != null && child.id === excludeId) {
      return total;
    }

    const hours = parseActivityHours(child.maximoHoras);
    return total + (hours ?? 0);
  }, 0);
}
