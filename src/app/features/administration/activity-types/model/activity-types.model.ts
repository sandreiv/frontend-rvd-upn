export enum TipoActividadComponenteEnum {
  DOCENCIADIRECTA = 'DOCENCIADIRECTA',
  ASIGNATURA = 'ASIGNATURA',
  APOYO = 'APOYO',
  INVESTIGACION = 'INVESTIGACION',
  DIRECCIONTDG = 'DIRECCIONTDG',
  PROYECTOSINVESTIGACION = 'PROYECTOSINVESTIGACION',
  EXTENSION = 'EXTENSION',
  GESTIONINSTITUCIONAL = 'GESTIONINSTITUCIONAL',
  ACTIVIDADESPREDETERMINADAS = 'ACTIVIDADESPREDETERMINADAS',
  PROYECTOSPLAN = 'PROYECTOSPLAN',
  SITUACIONESADMINISTRATIVAS = 'SITUACIONESADMINISTRATIVAS',
}

export type ActivityTypeComponente = TipoActividadComponenteEnum | string;

export const TIPO_ACTIVIDAD_COMPONENTE_LABELS: Record<string, string> = {
  [TipoActividadComponenteEnum.DOCENCIADIRECTA]: 'Docencia directa',
  [TipoActividadComponenteEnum.ASIGNATURA]: 'Asignatura',
  [TipoActividadComponenteEnum.APOYO]: 'Apoyo',
  [TipoActividadComponenteEnum.INVESTIGACION]: 'Investigación',
  [TipoActividadComponenteEnum.DIRECCIONTDG]: 'Dirección trabajo de grado',
  [TipoActividadComponenteEnum.PROYECTOSINVESTIGACION]: 'Proyectos de investigación',
  [TipoActividadComponenteEnum.EXTENSION]: 'Extensión',
  [TipoActividadComponenteEnum.GESTIONINSTITUCIONAL]: 'Gestión institucional',
  [TipoActividadComponenteEnum.ACTIVIDADESPREDETERMINADAS]: 'Actividades predeterminadas',
  [TipoActividadComponenteEnum.PROYECTOSPLAN]: 'Proyectos de plan',
  [TipoActividadComponenteEnum.SITUACIONESADMINISTRATIVAS]: 'Situaciones administrativas',
};

export const ACTIVITY_TYPE_COMPONENTE_OPTIONS = Object.entries(
  TIPO_ACTIVIDAD_COMPONENTE_LABELS,
).map(([value, label]) => ({
  value,
  label,
}));

export interface ActivityTypeItem {
  id: number;
  idPadre?: number | null;
  idDependencia?: number | null;
  orden: string | null;
  nombre: string;
  descripcion: string;
  componente?: ActivityTypeComponente | string | null;
  minimoHoras: string | null;
  maximoHoras: string | null;
  docenciaDirecta?: '1' | '0' | string | null;
  horasPorSemestre?: '1' | '0' | string | null;
  estado: '1' | '0' | 'ACTIVO' | 'INACTIVO' | string;
}

export interface ActivityTypeFormData {
  nombre: string;
  descripcion: string;
  componente: ActivityTypeComponente | string | null;
  orden?: string | null;
  idDependencia?: number | null;
  docenciaDirecta: '1' | '0';
  horasPorSemestre: '1' | '0';
  minimoHoras: number | null;
  maximoHoras: number | null;
  estado: '1' | '0';
}

export interface DeleteBulkActivityTypesRequest {
  ids: number[];
}

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

    const maxHours = parseActivityHours(child.maximoHoras);
    return total + (maxHours ?? 0);
  }, 0);
}
