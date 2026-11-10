import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  input,
  model,
} from '@angular/core';
import { TreeTable } from '../../../../../shared/ui/tree-table/tree-table';
import {
  TreeTableActionEvent,
  TreeTableColumn,
  TreeTableRowAction,
} from '../../../../../shared/ui/tree-table/tree-table.types';
import {
  ActivityTypeItem,
  TIPO_ACTIVIDAD_COMPONENTE_LABELS,
} from '../../model/activity-types.model';
import { formatSentenceValue } from '../../../../../shared/utils/normalized-text.util';

@Component({
  selector: 'app-activity-type-table',
  imports: [TreeTable],
  templateUrl: './activity-type-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTypeTable {
  activityTypes = input<ActivityTypeItem[]>([]);
  selectedActivityTypeIds = model<string[]>([]);
  emptyMessage = input('No hay tipos de actividades registrados.');
  searchPlaceholder = input('Buscar tipo de actividad...');

  @Output() addActivityType = new EventEmitter<void>();
  @Output() addChildActivityType = new EventEmitter<ActivityTypeItem>();
  @Output() editActivityType = new EventEmitter<ActivityTypeItem>();
  @Output() deleteActivityType = new EventEmitter<ActivityTypeItem>();
  @Output() deleteAll = new EventEmitter<number[]>();
  @Output() refreshActivityTypes = new EventEmitter<void>();

  readonly columns: TreeTableColumn<ActivityTypeItem>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      cell: (row) => {
        const nombre = formatSentenceValue(row.nombre);
        return row.orden ? `${row.orden}. ${nombre}` : nombre;
      },
    },
    {
      id: 'descripcion',
      header: 'Descripción',
      cell: (row) => row.descripcion || '-',
      formatAsSentence: true,
    },
    {
      id: 'componente',
      header: 'Componente',
      cell: (row) => this.formatComponente(row.componente),
    },
    {
      id: 'minimoHoras',
      header: 'Mínimo horas',
      cell: (row) => row.minimoHoras ?? '-',
    },
    {
      id: 'maximoHoras',
      header: 'Máximo horas',
      cell: (row) => row.maximoHoras ?? '-',
    },
    {
      id: 'estado',
      header: 'Estado',
      allowHtml: true,
      cell: (row) => this.formatStatusBadge(row.estado),
    },
  ];

  readonly rowActions = computed<TreeTableRowAction<ActivityTypeItem>[]>(() => [
    {
      id: 'add-child',
      label: 'Agregar actividad hija',
      icon: 'plus',
    },
    {
      id: 'edit',
      label: 'Editar',
      icon: 'pencil',
    },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      className: 'text-red-500',
    },
  ]);

  onAction(event: TreeTableActionEvent<ActivityTypeItem>): void {
    if (event.actionId === 'add-child') {
      this.addChildActivityType.emit(event.row);
    } else if (event.actionId === 'edit') {
      this.editActivityType.emit(event.row);
    } else if (event.actionId === 'delete') {
      this.deleteActivityType.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedActivityTypeIds.set(keys.map((k) => String(k)));
  }

  private formatStatusBadge(value: string): string {
    const normalized = String(value ?? '').trim().toUpperCase();
    const isActive =
      normalized === '1' || normalized === 'ACTIVO' || normalized === 'A';

    if (isActive) {
      return `
        <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Activo
        </span>
      `;
    }

    return `
      <span class="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 border border-rose-200/80 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
        <span class="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
        Inactivo
      </span>
    `;
  }

  private formatComponente(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    return TIPO_ACTIVIDAD_COMPONENTE_LABELS[value] ?? value;
  }
}
