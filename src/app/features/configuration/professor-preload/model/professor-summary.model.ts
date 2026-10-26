import { AppIconName } from '../../../../shared/ui/icon/icons';
import { formatCurrencyCOP } from './professor-form.config';

export type ProfessorSummarySectionId =
  | 'detalle-actividades'
  | 'centro-costo'
  | 'valores-contratacion'
  | 'observaciones';

export interface ProfessorSummarySectionConfig {
  id: ProfessorSummarySectionId;
  title: string;
  icon: AppIconName;
  iconBgClass: string;
  iconColorClass: string;
}

/** Respuesta de GET /professor-load-summary/{idCargaDocente} */
export interface ProfessorLoadSummaryApi {
  idCargaDocente: number;
  valorContratacion: ValorContratacionSummaryApi | null;
  horasActividades: HorasActividadSummaryApi[];
  centrosCosto: CentroCostoSummaryApi[];
  observaciones: HistorialCargaDocenteObservacionApi[];
}

export interface ValorContratacionSummaryApi {
  valorVacaciones: number;
  valorCesantias: number;
  valorIntereses: number;
  valorPrimaLegal: number;
  totalPrestaciones: number;
  valorContrato: number;
  totalContrato: number;
}

export interface HorasActividadSummaryApi {
  tipo: string;
  codigo: string;
  nombre: string;
  totalHoras: number;
  detalles: HorasActividadDetalleApi[] | null;
}

export interface HorasActividadDetalleApi {
  unidad: string | null;
  programa: string | null;
  materia: string | null;
  grupo: string | null;
  horas: number;
}

export interface CentroCostoSummaryApi {
  idCentroCosto: number;
  nombre: string;
  numeroActividades: number;
  totalHoras: number;
  porcentaje: number;
  valorAsignado: number;
}

export interface ContractValueRow {
  id: string;
  concepto: string;
  valor: string;
  highlighted?: boolean;
}

export interface CostCenterRow {
  id: string;
  nombre: string;
  numeroActividades: number;
  totalHoras: number;
  porcentaje: string;
  valorAsignado: string;
}

export type ActivitySummaryTableKind = 'direct' | 'simple';

export interface ActivityDirectSummaryRow {
  id: string;
  actividad: string;
  unidad: string;
  programa: string;
  materia: string;
  grupo: string;
  horas: number;
}

export interface ActivitySimpleSummaryRow {
  id: string;
  actividad: string;
  horas: number;
}

export interface ActivitySummaryTable {
  id: string;
  codigo: string;
  title: string;
  totalHoras: number;
  kind: ActivitySummaryTableKind;
  icon: AppIconName;
  iconBgClass: string;
  iconColorClass: string;
  directRows: ActivityDirectSummaryRow[];
  simpleRows: ActivitySimpleSummaryRow[];
}

export interface HistorialCargaDocenteObservacionApi {
  idHistorial: number;
  idPersonaGeneral: number | null;
  nombrePersonaGeneral: string | null;
  rolPersonaGeneral: string | null;
  observacion: string;
  fecha: string | null;
  estado: string | null;
}

export const PROFESSOR_SUMMARY_SECTIONS: ProfessorSummarySectionConfig[] = [
  {
    id: 'valores-contratacion',
    title: 'Valores de contratación',
    icon: 'identification',
    iconBgClass: 'bg-success-50 dark:bg-success-500/10',
    iconColorClass: 'text-success-600 dark:text-success-400',
  },
  {
    id: 'detalle-actividades',
    title: 'Detalle actividades',
    icon: 'academicCap',
    iconBgClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconColorClass: 'text-brand-600 dark:text-brand-400',
  },
  {
    id: 'centro-costo',
    title: 'Centro costo',
    icon: 'briefcase',
    iconBgClass: 'bg-warning-50 dark:bg-warning-500/10',
    iconColorClass: 'text-warning-600 dark:text-warning-400',
  },
  {
    id: 'observaciones',
    title: 'Observaciones',
    icon: 'chatBubbleBottomCenterText',
    iconBgClass: 'bg-error-50 dark:bg-error-500/10',
    iconColorClass: 'text-error-500 dark:text-error-400',
  },
];

export function createInitialExpandedSections(): Record<
  ProfessorSummarySectionId,
  boolean
> {
  return {
    'valores-contratacion': false,
    'detalle-actividades': false,
    'centro-costo': false,
    observaciones: false,
  };
}

export const EMPTY_PROFESSOR_LOAD_SUMMARY: ProfessorLoadSummaryApi = {
  idCargaDocente: 0,
  valorContratacion: null,
  horasActividades: [],
  centrosCosto: [],
  observaciones: [],
};

const CONTRACT_VALUE_LABELS: Array<{
  key: keyof ValorContratacionSummaryApi;
  label: string;
  highlighted?: boolean;
}> = [
  { key: 'valorVacaciones', label: 'Vacaciones' },
  { key: 'valorCesantias', label: 'Cesantías' },
  { key: 'valorIntereses', label: 'Intereses' },
  { key: 'valorPrimaLegal', label: 'Prima legal' },
  { key: 'totalPrestaciones', label: 'T. Prestaciones' },
  { key: 'valorContrato', label: 'Contrato' },
  {
    key: 'totalContrato',
    label: 'T. Contrato',
    highlighted: true,
  },
];

const ACTIVITY_CODE_UI: Record<
  string,
  {
    icon: AppIconName;
    iconBgClass: string;
    iconColorClass: string;
  }
> = {
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

const DEFAULT_ACTIVITY_UI = {
  icon: 'academicCap' as AppIconName,
  iconBgClass: 'bg-brand-50 dark:bg-brand-500/10',
  iconColorClass: 'text-brand-600 dark:text-brand-400',
};

export function mapContractValueRows(
  value: ValorContratacionSummaryApi | null | undefined,
): ContractValueRow[] {
  if (!value) {
    return [];
  }

  return CONTRACT_VALUE_LABELS.map((item) => ({
    id: item.key,
    concepto: item.label,
    valor: formatCurrencyCOP(value[item.key]),
    highlighted: item.highlighted === true,
  }));
}

export function mapCostCenterRows(
  items: CentroCostoSummaryApi[] | null | undefined,
): CostCenterRow[] {
  if (!items?.length) {
    return [];
  }

  return items.map((item) => ({
    id: String(item.idCentroCosto),
    nombre: item.nombre?.trim() || '-',
    numeroActividades: item.numeroActividades ?? 0,
    totalHoras: item.totalHoras ?? 0,
    porcentaje: formatPercentage(item.porcentaje),
    valorAsignado: formatCurrencyCOP(item.valorAsignado),
  }));
}

export function mapActivitySummaryTables(
  items: HorasActividadSummaryApi[] | null | undefined,
): ActivitySummaryTable[] {
  if (!items?.length) {
    return [];
  }

  const groups = groupActivitiesByCodigo(items);
  const tables: ActivitySummaryTable[] = [];

  for (let index = 0; index < groups.length; index += 1) {
    const group = groups[index];
    const codigo = group.codigo;
    const ui = ACTIVITY_CODE_UI[codigo] ?? DEFAULT_ACTIVITY_UI;
    const kind = resolveActivityTableKind(group.items);
    const totalHoras = sumActivityHours(group.items);

    tables.push({
      id: `${codigo}-${index}`,
      codigo,
      title: group.title,
      totalHoras,
      kind,
      icon: ui.icon,
      iconBgClass: ui.iconBgClass,
      iconColorClass: ui.iconColorClass,
      directRows:
        kind === 'direct' ? buildDirectRows(group.items) : [],
      simpleRows:
        kind === 'simple' ? buildSimpleRows(group.items) : [],
    });
  }

  return tables;
}

function groupActivitiesByCodigo(
  items: HorasActividadSummaryApi[],
): Array<{
  codigo: string;
  title: string;
  items: HorasActividadSummaryApi[];
}> {
  const order: string[] = [];
  const map = new Map<
    string,
    {
      codigo: string;
      title: string;
      items: HorasActividadSummaryApi[];
    }
  >();

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const codigo = item.codigo?.trim().toUpperCase() || 'OTRO';
    const existing = map.get(codigo);

    if (existing) {
      existing.items.push(item);
      continue;
    }

    order.push(codigo);
    map.set(codigo, {
      codigo,
      title: item.tipo?.trim() || codigo,
      items: [item],
    });
  }

  return order.map((codigo) => map.get(codigo)!);
}

function resolveActivityTableKind(
  items: HorasActividadSummaryApi[],
): ActivitySummaryTableKind {
  for (let index = 0; index < items.length; index += 1) {
    const details = items[index].detalles;
    if (!details?.length) {
      continue;
    }

    for (let detailIndex = 0; detailIndex < details.length; detailIndex += 1) {
      if (hasAcademicDetail(details[detailIndex])) {
        return 'direct';
      }
    }
  }

  return 'simple';
}

function hasAcademicDetail(detail: HorasActividadDetalleApi): boolean {
  return Boolean(
    detail.unidad?.trim() ||
      detail.programa?.trim() ||
      detail.materia?.trim() ||
      detail.grupo?.trim(),
  );
}

function buildDirectRows(
  items: HorasActividadSummaryApi[],
): ActivityDirectSummaryRow[] {
  const rows: ActivityDirectSummaryRow[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const actividad = item.nombre?.trim() || item.tipo || '-';
    const details = item.detalles;

    if (!details?.length) {
      rows.push({
        id: `${item.codigo}-item-${index}`,
        actividad,
        unidad: '-',
        programa: '-',
        materia: '-',
        grupo: '-',
        horas: item.totalHoras ?? 0,
      });
      continue;
    }

    for (let detailIndex = 0; detailIndex < details.length; detailIndex += 1) {
      const detail = details[detailIndex];
      rows.push({
        id: `${item.codigo}-${index}-${detailIndex}`,
        actividad,
        unidad: displayText(detail.unidad),
        programa: displayText(detail.programa),
        materia: displayText(detail.materia),
        grupo: displayText(detail.grupo),
        horas: detail.horas ?? 0,
      });
    }
  }

  return rows;
}

function buildSimpleRows(
  items: HorasActividadSummaryApi[],
): ActivitySimpleSummaryRow[] {
  const rows: ActivitySimpleSummaryRow[] = [];

  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    const actividad = item.nombre?.trim() || item.tipo || '-';
    const details = item.detalles;

    if (!details?.length) {
      rows.push({
        id: `${item.codigo}-item-${index}`,
        actividad,
        horas: item.totalHoras ?? 0,
      });
      continue;
    }

    for (let detailIndex = 0; detailIndex < details.length; detailIndex += 1) {
      const detail = details[detailIndex];
      rows.push({
        id: `${item.codigo}-${index}-${detailIndex}`,
        actividad,
        horas: detail.horas ?? item.totalHoras ?? 0,
      });
    }
  }

  return rows;
}

function sumActivityHours(items: HorasActividadSummaryApi[]): number {
  let total = 0;
  for (let index = 0; index < items.length; index += 1) {
    total += items[index].totalHoras ?? 0;
  }
  return total;
}

function displayText(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed : '-';
}

function formatPercentage(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '0%';
  }
  return `${value}%`;
}
