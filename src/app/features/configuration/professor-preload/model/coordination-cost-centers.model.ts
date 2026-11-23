import { forNext } from '../../../../core/utils/for-next.function';
import { formatSentenceValue } from '../../../../shared/utils/normalized-text.util';

/** Opción agrupada para el select de centros de costo. */
export interface CostCenterSelectOption {
  value: string;
  label: string;
  group?: string;
}

/** Centro de costo de GET /configuration/load/list-coordination-cost-centers. */
export interface CoordinationCostCenter {
  id: number;
  descripcion: string | null;
}

/** Programa de la coordinación con sus centros de costo. */
export interface CoordinationProgramCostCenters {
  id: number;
  nombre: string | null;
  centrosCosto: CoordinationCostCenter[];
}

/** Respuesta de GET /configuration/load/list-coordination-cost-centers. */
export interface CoordinationCostCenters {
  id: number;
  nombre: string | null;
  centrosCosto: CoordinationCostCenter[];
  programas: CoordinationProgramCostCenters[];
}

export const EMPTY_COORDINATION_COST_CENTERS: CoordinationCostCenters = {
  id: 0,
  nombre: null,
  centrosCosto: [],
  programas: [],
};

/**
 * Opciones del select: primero los centros de la coordinación y después
 * los de cada programa. Un mismo id se muestra una sola vez.
 */
export function coordinationCostCenterOptions(
  catalog: CoordinationCostCenters | null | undefined,
): CostCenterSelectOption[] {
  const options: CostCenterSelectOption[] = [];
  const seen = new Set<string>();
  const coordination = catalog?.nombre?.trim() || 'Coordinación';

  forNext(catalog?.centrosCosto, (center) => {
    pushCostCenter(options, seen, center, coordination);
  });

  forNext(catalog?.programas, (program) => {
    const group = program.nombre?.trim() || 'Programa';
    forNext(program.centrosCosto, (center) => {
      pushCostCenter(options, seen, center, group);
    });
  });

  return options;
}

/** Descripción del centro de costo indicado. */
export function coordinationCostCenterLabel(
  catalog: CoordinationCostCenters | null | undefined,
  id: number | null | undefined,
): string {
  if (id == null) {
    return '-';
  }

  let label = '';
  forNext(catalog?.centrosCosto, (center) => {
    if (!label && center.id === id) {
      label = center.descripcion?.trim() || '';
    }
  });
  forNext(catalog?.programas, (program) => {
    forNext(program.centrosCosto, (center) => {
      if (!label && center.id === id) {
        label = center.descripcion?.trim() || '';
      }
    });
  });

  return label ? formatSentenceValue(label) : '-';
}

function pushCostCenter(
  options: CostCenterSelectOption[],
  seen: Set<string>,
  center: CoordinationCostCenter,
  group: string,
): void {
  if (center.id == null) {
    return;
  }

  const value = String(center.id);
  if (seen.has(value)) {
    return;
  }

  seen.add(value);
  options.push({
    value,
    label: formatSentenceValue(center.descripcion),
    group: formatSentenceValue(group),
  });
}
