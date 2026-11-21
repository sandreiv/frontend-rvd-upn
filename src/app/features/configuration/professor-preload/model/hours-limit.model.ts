import { forNext } from '../../../../core/utils/for-next.function';
import { ActivityTypeNode } from './professor-activities.model';
import { ProfessorLoadDetailItem } from './professor-load-detail.model';

/** Horas que se van a agregar en un guardado, agrupadas por tipo de actividad. */
export interface HoursAddition {
  idTipoActividad: number;
  horas: number;
}

/** Tope que impediría guardar el detalle. */
export interface HoursLimitViolation {
  alcance: 'vinculacion' | 'actividad';
  nombre: string;
  maximo: number;
  total: number;
}

/**
 * Revisa el máximo de la vinculación y, de cada hoja hacia la raíz, el máximo
 * de los tipos de actividad. Igualar un máximo es válido. Un nodo sin
 * maximoHoras no pone tope propio; sus horas siguen contando en el ancestro
 * que sí lo tenga.
 */
export function findHoursLimitViolation(params: {
  tree: ActivityTypeNode[] | null | undefined;
  linkageLimit: number | null;
  saved: ProfessorLoadDetailItem[] | null | undefined;
  additions: HoursAddition[];
}): HoursLimitViolation | null {
  const buckets = hoursByActivity(params.saved);
  forNext(params.additions, (addition) => {
    if (!Number.isFinite(addition.horas) || addition.horas <= 0) {
      return;
    }

    const current = buckets.byType.get(addition.idTipoActividad) ?? 0;
    buckets.byType.set(addition.idTipoActividad, roundHours(current + addition.horas));
  });

  const total = totalHours(buckets);
  if (params.linkageLimit != null && total > params.linkageLimit) {
    return {
      alcance: 'vinculacion',
      nombre: 'Vinculación',
      maximo: params.linkageLimit,
      total,
    };
  }

  let violation: HoursLimitViolation | null = null;
  forNext(params.tree, (node) => {
    if (violation) {
      return;
    }

    violation = activityViolation(node, buckets.byType);
  });

  return violation;
}

/**
 * Rango de horas del tipo de actividad.
 * Si el nodo no trae mínimo o máximo, usa el del primer ancestro que sí lo tenga.
 */
export function activityHoursRangeLabel(
  node: ActivityTypeNode,
  tree: ActivityTypeNode[] | null | undefined,
): string | null {
  const minimo = nearestHoursLimit(node, tree, 'minimoHoras');
  const maximo = nearestHoursLimit(node, tree, 'maximoHoras');
  if (minimo == null && maximo == null) {
    return null;
  }

  if (minimo != null && maximo != null) {
    if (minimo === maximo) {
      return `${formatHours(minimo)} h`;
    }

    return `${formatHours(minimo)} – ${formatHours(maximo)} h`;
  }

  if (maximo != null) {
    return `Hasta ${formatHours(maximo)} h`;
  }

  return `Desde ${formatHours(minimo ?? 0)} h`;
}

/** Texto del aviso cuando un guardado supera un máximo. */
export function hoursLimitMessage(violation: HoursLimitViolation): string {
  const maximo = formatHours(violation.maximo);
  const total = formatHours(violation.total);
  if (violation.alcance === 'vinculacion') {
    return `El total de horas supera el máximo de la vinculación (${maximo} h). Quedaría en ${total} h.`;
  }

  return `${violation.nombre} supera su máximo de ${maximo} h. Quedaría en ${total} h.`;
}

function activityViolation(
  node: ActivityTypeNode,
  byType: Map<number, number>,
): HoursLimitViolation | null {
  let childViolation: HoursLimitViolation | null = null;
  forNext(node.hijos, (child) => {
    if (childViolation) {
      return;
    }

    childViolation = activityViolation(child, byType);
  });
  if (childViolation) {
    return childViolation;
  }

  const maximo = parseLimit(node.maximoHoras);
  if (maximo == null) {
    return null;
  }

  const total = subtreeHours(node, byType);
  if (total <= maximo) {
    return null;
  }

  return {
    alcance: 'actividad',
    nombre: node.nombre?.trim() || 'Actividad',
    maximo,
    total,
  };
}

function subtreeHours(node: ActivityTypeNode, byType: Map<number, number>): number {
  let total = byType.get(node.id) ?? 0;
  forNext(node.hijos, (child) => {
    total = roundHours(total + subtreeHours(child, byType));
  });
  return total;
}

function hoursByActivity(details: ProfessorLoadDetailItem[] | null | undefined): {
  byType: Map<number, number>;
  untyped: number;
} {
  const byType = new Map<number, number>();
  let untyped = 0;
  forNext(details, (detail) => {
    forNext(detail.detalles, (item) => {
      const hours = parseLimit(item.horas);
      if (hours == null || hours <= 0) {
        return;
      }

      const typeId = item.tipoActividad?.id;
      if (typeId == null) {
        untyped = roundHours(untyped + hours);
        return;
      }

      const current = byType.get(typeId) ?? 0;
      byType.set(typeId, roundHours(current + hours));
    });
  });
  return { byType, untyped };
}

function totalHours(buckets: { byType: Map<number, number>; untyped: number }): number {
  let total = buckets.untyped;
  forNext([...buckets.byType.values()], (hours) => {
    total = roundHours(total + hours);
  });
  return total;
}

function nearestHoursLimit(
  node: ActivityTypeNode,
  tree: ActivityTypeNode[] | null | undefined,
  field: 'minimoHoras' | 'maximoHoras',
): number | null {
  const own = parseLimit(node[field]);
  if (own != null) {
    return own;
  }

  const parent = findParent(node.id, tree, null);
  if (!parent) {
    return null;
  }

  return nearestHoursLimit(parent, tree, field);
}

function findParent(
  id: number,
  nodes: ActivityTypeNode[] | null | undefined,
  parent: ActivityTypeNode | null,
): ActivityTypeNode | null {
  let found: ActivityTypeNode | null = null;
  forNext(nodes, (node) => {
    if (found) {
      return;
    }

    if (node.id === id) {
      found = parent;
      return;
    }

    found = findParent(id, node.hijos, node);
  });
  return found;
}

function parseLimit(value: string | null | undefined): number | null {
  const raw = value?.trim() ?? '';
  if (!raw) {
    return null;
  }

  const parsed = Number(raw.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

function formatHours(value: number): string {
  const rounded = roundHours(value);
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}
