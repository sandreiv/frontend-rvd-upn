import { forNext } from '../../../../core/utils/for-next.function';
import { AppIconName } from '../../../../shared/ui/icon/icons';
import { formatCurrencyCOP } from './professor-form.config';
import {
  NOVELTY_APPROVED_STATE,
  NOVELTY_PENDING_REVIEW_STATE,
  NOVELTY_REJECTED_STATE,
} from './professor-novelty-state';
import {
  ContractValueRow,
  PROFESSOR_SUMMARY_SECTIONS,
  ProfessorLoadSummaryApi,
  ProfessorSummarySectionId,
  ValorContratacionSummaryApi,
  mapContractValueRows,
} from './professor-summary.model';

export type NoveltySummarySectionId =
  | ProfessorSummarySectionId
  | 'historial-novedades';

export interface NoveltySummarySectionConfig {
  id: NoveltySummarySectionId;
  title: string;
  icon: AppIconName;
  iconBgClass: string;
  iconColorClass: string;
}

export interface NovedadCargaDocenteSummaryApi {
  idNovedad: number;
  tipo: string;
  descripcion: string;
  accion: string;
  componente: string | null;
  fecha: string | null;
  estadoNovedad: string | number | null;
  vigente: string | number | null;
}

export interface NoveltyValorContratacionSummaryApi
  extends ValorContratacionSummaryApi {
  salario?: number;
}

export interface ProfessorNoveltySummaryApi
  extends Omit<ProfessorLoadSummaryApi, 'valorContratacion'> {
  valorContratacion: NoveltyValorContratacionSummaryApi | null;
  novedades: NovedadCargaDocenteSummaryApi[];
}

export interface NoveltyHistoryRow {
  id: string;
  tipo: string;
  descripcion: string;
  fecha: string | null;
  estadoLabel: string;
  vigente: boolean;
}

export const NOVELTY_SUMMARY_SECTIONS: NoveltySummarySectionConfig[] = [
  ...PROFESSOR_SUMMARY_SECTIONS.filter(
    (section) => section.id !== 'observaciones',
  ),
  {
    id: 'historial-novedades',
    title: 'Historial de novedades',
    icon: 'newspaper',
    iconBgClass: 'bg-purple-50 dark:bg-purple-500/10',
    iconColorClass: 'text-purple-600 dark:text-purple-400',
  },
  ...PROFESSOR_SUMMARY_SECTIONS.filter(
    (section) => section.id === 'observaciones',
  ),
];

export function createInitialNoveltyExpandedSections(): Record<
  NoveltySummarySectionId,
  boolean
> {
  return {
    'valores-contratacion': false,
    'detalle-actividades': false,
    'centro-costo': false,
    observaciones: false,
    'historial-novedades': true,
  };
}

export const EMPTY_PROFESSOR_NOVELTY_SUMMARY: ProfessorNoveltySummaryApi =
  {
    idCargaDocente: 0,
    valorContratacion: null,
    horasActividades: [],
    centrosCosto: [],
    observaciones: [],
    novedades: [],
  };

export function mapNoveltyContractValueRows(
  value: NoveltyValorContratacionSummaryApi | null | undefined,
): ContractValueRow[] {
  const rows = mapContractValueRows(value);
  if (value?.salario == null) {
    return rows;
  }

  return [
    {
      id: 'salario',
      concepto: 'Salario',
      valor: formatCurrencyCOP(value.salario),
    },
    ...rows,
  ];
}

export function mapNoveltyHistoryRows(
  items: NovedadCargaDocenteSummaryApi[] | null | undefined,
): NoveltyHistoryRow[] {
  const rows: NoveltyHistoryRow[] = [];
  forNext(items, (item, index) => {
    rows.push({
      id: `${item.idNovedad}-${index}`,
      tipo: item.tipo?.trim() || '-',
      descripcion: item.descripcion?.trim() || '-',
      fecha: item.fecha,
      estadoLabel: noveltyStateLabel(item.estadoNovedad),
      vigente: isNoveltyCurrent(item.vigente),
    });
  });
  return rows;
}

function noveltyStateLabel(
  estado: string | number | null | undefined,
): string {
  switch (String(estado ?? '').trim()) {
    case NOVELTY_PENDING_REVIEW_STATE:
      return 'En revisión';

    case NOVELTY_APPROVED_STATE:
      return 'Aprobada';

    case NOVELTY_REJECTED_STATE:
      return 'Rechazada';

    default:
      return '-';
  }
}

function isNoveltyCurrent(
  vigente: string | number | null | undefined,
): boolean {
  return String(vigente ?? '').trim() === '1';
}
