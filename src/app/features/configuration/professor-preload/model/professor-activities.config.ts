import { AppIconName } from '../../../../shared/ui/icon/icons';
import {
  ActivityFormType,
  TipoActividad,
  TipoActividadModalidad,
} from './professor-activities.model';

export type { ActivityFormType };

const ACTIVE_ACTIVITY_STATE = '1';

const ACTIVITY_FORM_TYPES: ActivityFormType[] = [
  'direct',
  'criteria',
  'project',
];

export interface ActivityUiConfig {
  formType: ActivityFormType;
  icon: AppIconName;
  iconBgClass: string;
  iconColorClass: string;
}

export interface ActivityVisibleItem extends ActivityUiConfig {
  codigo: string;
  tipoActividad?: TipoActividad;
}

export const FORM_TYPE_UI_CONFIG: Record<
  ActivityFormType,
  ActivityUiConfig
> = {
  direct: {
    formType: 'direct',
    icon: 'bookOpen',
    iconBgClass: 'bg-gray-100 dark:bg-gray-800',
    iconColorClass: 'text-gray-600 dark:text-gray-300',
  },
  criteria: {
    formType: 'criteria',
    icon: 'brain',
    iconBgClass: 'bg-purple-50 dark:bg-purple-500/10',
    iconColorClass: 'text-purple-600 dark:text-purple-400',
  },
  project: {
    formType: 'project',
    icon: 'beaker',
    iconBgClass: 'bg-success-50 dark:bg-success-500/10',
    iconColorClass: 'text-success-600 dark:text-success-400',
  },
};

/** Overrides visuales opcionales por código conocido. */
const CODE_UI_OVERRIDES: Record<string, Partial<ActivityUiConfig>> = {
  FAD: {
    icon: 'bookOpen',
    iconBgClass: 'bg-gray-100 dark:bg-gray-800',
    iconColorClass: 'text-gray-600 dark:text-gray-300',
  },
  FAI: {
    icon: 'brain',
    iconBgClass: 'bg-purple-50 dark:bg-purple-500/10',
    iconColorClass: 'text-purple-600 dark:text-purple-400',
  },
  AC: {
    icon: 'briefcase',
    iconBgClass: 'bg-warning-50 dark:bg-warning-500/10',
    iconColorClass: 'text-warning-600 dark:text-warning-400',
  },
  CTEI: {
    icon: 'beaker',
    iconBgClass: 'bg-success-50 dark:bg-success-500/10',
    iconColorClass: 'text-success-600 dark:text-success-400',
  },
  ISU: {
    icon: 'heart',
    iconBgClass: 'bg-error-50 dark:bg-error-500/10',
    iconColorClass: 'text-error-500 dark:text-error-400',
  },
};

export function isActivityFormType(
  value: string | null | undefined,
): value is ActivityFormType {
  return (
    value != null &&
    ACTIVITY_FORM_TYPES.includes(value as ActivityFormType)
  );
}

export function buildComponenteByCodigo(
  modalityTypes: TipoActividadModalidad[],
): Record<string, ActivityFormType> {
  const map: Record<string, ActivityFormType> = {};

  for (let index = 0; index < modalityTypes.length; index += 1) {
    const item = modalityTypes[index];
    if (!isActivityFormType(item.componente)) {
      continue;
    }
    map[item.codigo] = item.componente;
  }

  return map;
}

function isActiveModalityActivity(
  item: TipoActividadModalidad,
): boolean {
  return item.estado == null || item.estado === ACTIVE_ACTIVITY_STATE;
}

function compareActivityOrden(
  a: ActivityVisibleItem,
  b: ActivityVisibleItem,
): number {
  const ordenA = Number(a.tipoActividad?.orden ?? 0);
  const ordenB = Number(b.tipoActividad?.orden ?? 0);
  return ordenA - ordenB;
}

function toTipoActividadFallback(
  item: TipoActividadModalidad,
  index: number,
): TipoActividad {
  return {
    id: item.id,
    idPadre: null,
    nombre: item.nombre,
    descripcion: item.nombre,
    orden: String(index),
    codigo: item.codigo,
    componente: item.componente,
  };
}

function resolveUiConfig(
  formType: ActivityFormType,
  codigo: string,
): ActivityUiConfig {
  const base = FORM_TYPE_UI_CONFIG[formType];
  const override = CODE_UI_OVERRIDES[codigo];

  return {
    ...base,
    ...override,
    formType,
  };
}

/**
 * Construye las tarjetas visibles a partir de los tipos de actividad
 * permitidos por modalidad. El formType sale de `componente`.
 */
export function buildVisibleActivityItems(
  modalityTypes: TipoActividadModalidad[],
  activityTypes: TipoActividad[],
): ActivityVisibleItem[] {
  const items: ActivityVisibleItem[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < modalityTypes.length; index += 1) {
    const modalityType = modalityTypes[index];
    if (!isActiveModalityActivity(modalityType)) {
      continue;
    }
    if (!isActivityFormType(modalityType.componente)) {
      continue;
    }
    if (seen.has(modalityType.codigo)) {
      continue;
    }

    seen.add(modalityType.codigo);
    const catalogType = activityTypes.find(
      (type) => type.codigo === modalityType.codigo,
    );
    const ui = resolveUiConfig(
      modalityType.componente,
      modalityType.codigo,
    );

    items.push({
      codigo: modalityType.codigo,
      ...ui,
      tipoActividad:
        catalogType ?? toTipoActividadFallback(modalityType, index),
    });
  }

  return items.sort(compareActivityOrden);
}

export function buildCareerActivityItems(
  activityTypes: TipoActividad[],
): ActivityVisibleItem[] {
  const items: ActivityVisibleItem[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < activityTypes.length; index += 1) {
    const activityType = activityTypes[index];
    if (!isActivityFormType(activityType.componente)) {
      continue;
    }
    if (seen.has(activityType.codigo)) {
      continue;
    }
    seen.add(activityType.codigo);
    items.push({
      codigo: activityType.codigo,
      ...resolveUiConfig(activityType.componente, activityType.codigo),
      tipoActividad: activityType,
    });
  }

  return items.sort(compareActivityOrden);
}

export function createBooleanMap(
  codigos: readonly string[],
): Record<string, boolean> {
  const state: Record<string, boolean> = {};
  for (let index = 0; index < codigos.length; index += 1) {
    state[codigos[index]] = false;
  }
  return state;
}

export function createInitialExpandedCategories(
  codigos: readonly string[] = [],
): Record<string, boolean> {
  return createBooleanMap(codigos);
}

export function createInitialAddFormOpen(
  codigos: readonly string[] = [],
): Record<string, boolean> {
  return createBooleanMap(codigos);
}

export function resolveInitialExpandedCategories(
  visibleCodigos: readonly string[],
  projectRowsByCodigo: Record<string, readonly unknown[]>,
): Record<string, boolean> {
  const state = createBooleanMap(visibleCodigos);
  const projectCodigos = Object.keys(projectRowsByCodigo);

  for (let index = 0; index < projectCodigos.length; index += 1) {
    const codigo = projectCodigos[index];
    if (!(codigo in state)) {
      continue;
    }
    state[codigo] = (projectRowsByCodigo[codigo]?.length ?? 0) > 0;
  }

  return state;
}

export type DirectActivityFormFieldKey =
  | 'idCriterio'
  | 'idUnidadRegional'
  | 'idPrograma'
  | 'codigoMateria'
  | 'idGrupo'
  | 'semestre'
  | 'creditos'
  | 'cupoMaximo'
  | 'horasPresenciales'
  | 'total';

export interface DirectActivityFieldConfig {
  key: DirectActivityFormFieldKey;
  label: string;
  control: 'select' | 'number';
  placeholder?: string;
  readonly?: boolean;
}

export const DIRECT_ACTIVITY_CASCADE_FIELDS: DirectActivityFieldConfig[] = [
  {
    key: 'idCriterio',
    label: 'Criterio',
    control: 'select',
    placeholder: 'Seleccione criterio',
  },
  {
    key: 'idUnidadRegional',
    label: 'Unidad',
    control: 'select',
    placeholder: 'Seleccione unidad',
  },
  {
    key: 'idPrograma',
    label: 'Programa',
    control: 'select',
    placeholder: 'Seleccione programa',
  },
  {
    key: 'codigoMateria',
    label: 'Núcleo temático',
    control: 'select',
    placeholder: 'Seleccione materia',
  },
  {
    key: 'idGrupo',
    label: 'Grupo',
    control: 'select',
    placeholder: 'Seleccione grupo',
  },
];

export const DIRECT_ACTIVITY_READONLY_FIELDS: DirectActivityFieldConfig[] = [
  {
    key: 'semestre',
    label: 'Semestre',
    control: 'number',
    readonly: true,
  },
  {
    key: 'creditos',
    label: 'Créditos',
    control: 'number',
    readonly: true,
  },
  {
    key: 'cupoMaximo',
    label: 'Cupo máximo',
    control: 'number',
    readonly: true,
  },
  {
    key: 'horasPresenciales',
    label: 'Horas trabajo presencial',
    control: 'number',
    readonly: true,
  },
  {
    key: 'total',
    label: 'Total',
    control: 'number',
    readonly: true,
  },
];

export type CriteriaActivityFormFieldKey =
  | 'idCriterio'
  | 'horasDedicacion';

export interface CriteriaActivityFieldConfig {
  key: CriteriaActivityFormFieldKey;
  label: string;
  control: 'select' | 'number';
  placeholder?: string;
}

export const CRITERIA_ACTIVITY_FIELDS: CriteriaActivityFieldConfig[] = [
  {
    key: 'idCriterio',
    label: 'Criterio',
    control: 'select',
    placeholder: 'Seleccione criterio',
  },
  {
    key: 'horasDedicacion',
    label: 'Horas de dedicación',
    control: 'number',
    placeholder: '0',
  },
];

export const PROJECT_ACTIVITY_DESCRIPTION_LABEL = 'Descripción del proyecto';

export const PROJECT_ACTIVITY_CRITERION_LABEL = 'Criterio';

export const PROJECT_ACTIVITY_HOURS_LABEL = 'Horas de dedicación';
