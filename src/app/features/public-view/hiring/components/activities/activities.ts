import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

import { CollapsibleSection } from '../../../../../shared/components/form/collapsible-section/collapsible-section';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { AppIconName } from '../../../../../shared/ui/icon/icons';

import {
  PublicActivityDetail,
  PublicActivitySummary,
} from '../../model/hiring.model';

type ActivityTableKind =
  | 'direct'
  | 'simple';

interface DirectActivityRow {
  id: string;
  actividad: string;
  unidad: string;
  programa: string;
  materia: string;
  grupo: string;
  horas: number;
}

interface SimpleActivityRow {
  id: string;
  actividad: string;
  horas: number;
}

interface ActivityTable {
  id: string;
  codigo: string;
  title: string;
  totalHoras: number;

  kind: ActivityTableKind;

  icon: AppIconName;
  iconBgClass: string;
  iconColorClass: string;

  directRows: DirectActivityRow[];
  simpleRows: SimpleActivityRow[];
}

const ACTIVITY_UI: Record<
  string,
  {
    icon: AppIconName;
    iconBgClass: string;
    iconColorClass: string;
  }
> = {
  FAD: {
    icon: 'bookOpen',
    iconBgClass:
      'bg-gray-100 dark:bg-gray-800',
    iconColorClass:
      'text-gray-600 dark:text-gray-300',
  },

  FAI: {
    icon: 'brain',
    iconBgClass:
      'bg-purple-50 dark:bg-purple-500/10',
    iconColorClass:
      'text-purple-600 dark:text-purple-400',
  },

  AC: {
    icon: 'briefcase',
    iconBgClass:
      'bg-warning-50 dark:bg-warning-500/10',
    iconColorClass:
      'text-warning-600 dark:text-warning-400',
  },

  CTEI: {
    icon: 'beaker',
    iconBgClass:
      'bg-success-50 dark:bg-success-500/10',
    iconColorClass:
      'text-success-600 dark:text-success-400',
  },

  ISU: {
    icon: 'heart',
    iconBgClass:
      'bg-error-50 dark:bg-error-500/10',
    iconColorClass:
      'text-error-500 dark:text-error-400',
  },
};

const DEFAULT_ACTIVITY_UI = {
  icon: 'academicCap' as AppIconName,
  iconBgClass:
    'bg-brand-50 dark:bg-brand-500/10',
  iconColorClass:
    'text-brand-600 dark:text-brand-400',
};

@Component({
  selector: 'app-public-activities',

  imports: [
    CollapsibleSection,
    Icon,
  ],

  templateUrl: './activities.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class Activities {

  readonly activities =
    input<PublicActivitySummary[]>([]);

  readonly observation =
    input<string | null>(null);  

  readonly loading =
    input(false);

  readonly error =
    input(false);

  readonly expanded =
    input(false);

  readonly expandedChange =
    output<boolean>();

  readonly tables =
    computed<ActivityTable[]>(() =>
      this.buildTables(
        this.activities(),
      ),
    );

  readonly totalHours =
    computed(() =>
      this.activities().reduce(
        (total, item) =>
          total +
          Number(
            item.totalHoras ?? 0,
          ),
        0,
      ),
    );

  onExpandedChange(
    expanded: boolean,
  ): void {
    this.expandedChange.emit(
      expanded,
    );
  }

  hoursLabel(
    hours: number,
  ): string {
    return `${hours ?? 0} h`;
  }

  private buildTables(
    items: PublicActivitySummary[],
  ): ActivityTable[] {

    const groups =
      new Map<
        string,
        PublicActivitySummary[]
      >();

    for (const item of items) {

      const codigo =
        item.codigo
          ?.trim()
          .toUpperCase() ||
        'OTRO';

      const current =
        groups.get(codigo);

      if (current) {
        current.push(item);
      } else {
        groups.set(
          codigo,
          [item],
        );
      }
    }

    const tables:
      ActivityTable[] = [];

    let index = 0;

    for (
      const [
        codigo,
        groupItems,
      ] of groups
    ) {

      const first =
        groupItems[0];

      const ui =
        ACTIVITY_UI[codigo] ??
        DEFAULT_ACTIVITY_UI;

      const direct =
        codigo === 'FAD';

      tables.push({
        id: `${codigo}-${index}`,

        codigo,

        title:
          first.tipo?.trim() ||
          codigo,

        totalHoras:
          groupItems.reduce(
            (total, item) =>
              total +
              Number(
                item.totalHoras ??
                  0,
              ),
            0,
          ),

        kind:
          direct
            ? 'direct'
            : 'simple',

        icon: ui.icon,

        iconBgClass:
          ui.iconBgClass,

        iconColorClass:
          ui.iconColorClass,

        directRows:
          direct
            ? this.buildDirectRows(
                groupItems,
              )
            : [],

        simpleRows:
          direct
            ? []
            : this.buildSimpleRows(
                groupItems,
              ),
      });

      index += 1;
    }

    return tables;
  }

  private buildDirectRows(
    items:
      PublicActivitySummary[],
  ): DirectActivityRow[] {

    const rows:
      DirectActivityRow[] = [];

    items.forEach(
      (item, itemIndex) => {

        const details =
          item.detalles ?? [];

        if (!details.length) {
          rows.push({
            id:
              `${item.codigo}-${itemIndex}`,

            actividad:
              item.nombre?.trim() ||
              item.tipo?.trim() ||
              '-',

            unidad: '-',
            programa: '-',
            materia: '-',
            grupo: '-',

            horas:
              Number(
                item.totalHoras ??
                  0,
              ),
          });

          return;
        }

        details.forEach(
          (
            detail,
            detailIndex,
          ) => {
            rows.push(
              this.toDirectRow(
                item,
                detail,
                itemIndex,
                detailIndex,
              ),
            );
          },
        );
      },
    );

    return rows;
  }

  private toDirectRow(
    item: PublicActivitySummary,
    detail: PublicActivityDetail,
    itemIndex: number,
    detailIndex: number,
  ): DirectActivityRow {

    return {
      id:
        `${item.codigo}-${itemIndex}-${detailIndex}`,

      actividad:
        item.nombre?.trim() ||
        item.tipo?.trim() ||
        '-',

      unidad:
        detail.unidad?.trim() ||
        '-',

      programa:
        detail.programa?.trim() ||
        '-',

      materia:
        detail.materia?.trim() ||
        '-',

      grupo:
        detail.grupo?.trim() ||
        '-',

      horas:
        Number(
          detail.horas ?? 0,
        ),
    };
  }

  private buildSimpleRows(
    items:
      PublicActivitySummary[],
  ): SimpleActivityRow[] {

    return items.map(
      (item, index) => ({
        id:
          `${item.codigo}-${index}`,

        actividad:
          item.nombre?.trim() ||
          item.tipo?.trim() ||
          '-',

        horas:
          Number(
            item.totalHoras ??
              0,
          ),
      }),
    );
  }
}