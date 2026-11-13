import { forNext } from '../../../../core/utils/for-next.function';

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

/**
 * Árbol visible para el tipo de vinculación.
 * Oculta inactivos y los TIAC_ID que vengan en las restricciones.
 * Un padre que se queda sin hijos también se oculta.
 * Una raíz que nació sin hijos se conserva: es título y tarjeta.
 */
export function visibleActivityTree(
  tree: ActivityTypeNode[] | null | undefined,
  restrictions: ActivityRestrictionItem[] | null | undefined,
): ActivityTypeNode[] {
  const restrictedIds = restrictionIds(restrictions);
  const visible: ActivityTypeNode[] = [];

  forNext(tree, (node) => {
    const activity = pruneActivityNode(node, restrictedIds);
    if (activity) {
      visible.push(activity);
    }
  });

  return visible;
}

/** Clave de formulario. Actividades con la misma clave comparten componente. */
export function activityComponentKey(componente: string | null | undefined): string {
  return (componente ?? '').trim().toUpperCase();
}

/**
 * Raíces del árbol que contienen alguna de las actividades indicadas.
 * El orden es el del árbol visible.
 */
export function activityRootIds(
  roots: ActivityTypeNode[] | null | undefined,
  activityIds: number[],
): number[] {
  const wanted = new Set(activityIds);
  const rootIds: number[] = [];

  forNext(roots, (root) => {
    if (nodeContainsActivity(root, wanted)) {
      rootIds.push(root.id);
    }
  });

  return rootIds;
}

function nodeContainsActivity(node: ActivityTypeNode, activityIds: Set<number>): boolean {
  if (activityIds.has(node.id)) {
    return true;
  }

  let found = false;
  forNext(node.hijos, (child) => {
    if (!found && nodeContainsActivity(child, activityIds)) {
      found = true;
    }
  });

  return found;
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
