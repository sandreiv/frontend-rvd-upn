import { forNext } from '../../../../core/utils/for-next.function';
import { AppIconName } from '../../../../shared/ui/icon/icons';

/** Nodo de GET /configuration/load/list-activity-types. */
export interface ActivityTypeNode {
  id: number;
  nombre: string | null;
  descripcion: string | null;
  orden: string | null;
  estado: string | null;
  minimoHoras: string | null;
  maximoHoras: string | null;
  idDependencia: number | null;
  docenciaDirecta: string | null;
  componente: string | null;
  horasPorSemestre: string | null;
  hijos: ActivityTypeNode[];
}

export interface ActivityLookup {
  id: number;
  nombre: string | null;
}

/** Ítem de GET /configuration/load/list-activity-restrictions. */
export interface ActivityRestrictionItem {
  id: number;
  tipoActividad: ActivityLookup | null;
}

export type ActivityParentView = 'direct' | 'research' | 'extension' | 'management';

export interface VisibleActivityParent {
  view: ActivityParentView;
  activity: ActivityTypeNode;
  icon: AppIconName;
  iconBgClass: string;
  iconColorClass: string;
}

interface ActivityParentPresentation {
  view: ActivityParentView;
  icon: AppIconName;
  iconBgClass: string;
  iconColorClass: string;
}

const PARENT_BY_COMPONENTE: Record<string, ActivityParentPresentation> = {
  DOCENCIADIRECTA: {
    view: 'direct',
    icon: 'academicCap',
    iconBgClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconColorClass: 'text-brand-600 dark:text-brand-400',
  },
  INVESTIGACION: {
    view: 'research',
    icon: 'beaker',
    iconBgClass: 'bg-warning-50 dark:bg-warning-500/10',
    iconColorClass: 'text-warning-600 dark:text-warning-400',
  },
  EXTENSION: {
    view: 'extension',
    icon: 'lightBulb',
    iconBgClass: 'bg-success-50 dark:bg-success-500/10',
    iconColorClass: 'text-success-600 dark:text-success-400',
  },
  GESTIONINSTITUCIONAL: {
    view: 'management',
    icon: 'briefcase',
    iconBgClass: 'bg-gray-100 dark:bg-gray-800',
    iconColorClass: 'text-gray-700 dark:text-gray-200',
  },
};

const EMPTY_CHILDREN_LABEL = 'Sin actividades hijas para mostrar.';

/**
 * Padres visibles para el tipo de vinculación.
 * Oculta inactivos y los TIAC_ID que vengan en las restricciones.
 * Si un nodo se queda sin hijos, también se oculta.
 */
export function visibleActivityParents(
  tree: ActivityTypeNode[] | null | undefined,
  restrictions: ActivityRestrictionItem[] | null | undefined,
): VisibleActivityParent[] {
  const restrictedIds = restrictionIds(restrictions);
  const visible: VisibleActivityParent[] = [];

  forNext(tree, (node) => {
    const activity = pruneActivityNode(node, restrictedIds);
    if (!activity) {
      return;
    }

    const presentation = parentPresentation(activity.componente);
    if (!presentation) {
      return;
    }

    visible.push({ ...presentation, activity });
  });

  return visible;
}

export function activityEmptyLabel(activity: ActivityTypeNode): string {
  const description = activity.descripcion?.trim() ?? '';
  const name = activity.nombre?.trim() ?? '';

  if (description && description !== name) {
    return description;
  }

  return EMPTY_CHILDREN_LABEL;
}

function parentPresentation(
  componente: string | null | undefined,
): ActivityParentPresentation | null {
  const key = (componente ?? '').trim().toUpperCase();
  return PARENT_BY_COMPONENTE[key] ?? null;
}

function restrictionIds(restrictions: ActivityRestrictionItem[] | null | undefined): Set<number> {
  const ids = new Set<number>();

  forNext(restrictions, (item) => {
    const id = item.tipoActividad?.id;
    if (id != null) {
      ids.add(id);
    }
  });

  return ids;
}

function pruneActivityNode(
  node: ActivityTypeNode,
  restrictedIds: Set<number>,
): ActivityTypeNode | null {
  if (restrictedIds.has(node.id) || !isActiveActivity(node.estado)) {
    return null;
  }

  const sourceChildren = node.hijos ?? [];
  const hijos: ActivityTypeNode[] = [];

  forNext(sourceChildren, (child) => {
    const pruned = pruneActivityNode(child, restrictedIds);
    if (pruned) {
      hijos.push(pruned);
    }
  });

  if (sourceChildren.length > 0 && hijos.length === 0) {
    return null;
  }

  return { ...node, hijos };
}

function isActiveActivity(estado: string | null | undefined): boolean {
  const value = (estado ?? '').trim().toUpperCase();
  return value === '' || value === '1' || value === 'ACTIVO';
}
