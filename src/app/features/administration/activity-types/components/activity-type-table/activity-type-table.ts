import { ChangeDetectionStrategy, Component, EventEmitter, Output, computed, input, model } from '@angular/core';
import { DataTable } from '../../../../../shared/ui/data-table/data-table';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableToolbarActionEvent,
} from '../../../../../shared/ui/data-table/table.types';
import { ActivityTypeItem } from '../../model/activity-types.model';

@Component({
  selector: 'app-activity-type-table',
  imports: [DataTable],
  templateUrl: './activity-type-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTypeTable {
  activityTypes = input<ActivityTypeItem[]>([]);
  selectedActivityTypeIds = model<string[]>([]);
  emptyMessage = input('No hay tipos de actividades registrados.');
  searchPlaceholder = input('Buscar tipo de actividad...');
  showChildrenAction = input(true);

  @Output() viewChildren = new EventEmitter<ActivityTypeItem>();
  @Output() refreshActivityTypes = new EventEmitter<void>();
  @Output() addActivityType = new EventEmitter<void>();
  @Output() editActivityType = new EventEmitter<ActivityTypeItem>();
  @Output() deleteActivityType = new EventEmitter<ActivityTypeItem>();
  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (row: ActivityTypeItem): string => String(row.id);

  readonly columns: DataTableColumn<ActivityTypeItem>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      cell: (row) => row.nombre || '-',
      formatAsSentence: true,
    },
    {
      id: 'descripcion',
      header: 'Descripción',
      cell: (row) => row.descripcion || '-',
      formatAsSentence: true,
    },
    {
      id: 'codigo',
      header: 'Código',
      cell: (row) => row.codigo || '-',
    },
    {
      id: 'ptd',
      header: 'Plan de trabajo digital',
      cell: (row) => this.formatPtd(row.ptd),
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
      id: 'orden',
      header: 'Orden',
      cell: (row) => row.orden ?? '-',
    },
    {
      id: 'estado',
      header: 'Estado',
      cell: (row) => this.formatStatus(row.estado),
    },
  ];

  readonly rowActions = computed<DataTableRowAction<ActivityTypeItem>[]>(() => {
    const actions: DataTableRowAction<ActivityTypeItem>[] = [];

    if (this.showChildrenAction()) {
        actions.push({
        id: 'children',
        label: 'Agregar/ver actividades hijas',
        icon: 'bookOpen',
        });
    }

    actions.push(
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
    );

    return actions;
  });

  onToolbarAction(event: DataTableToolbarActionEvent<ActivityTypeItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshActivityTypes.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addActivityType.emit();
      return;
    }

    if (event.actionId === 'deleteAll') {
      this.deleteAll.emit(
        event.selectedIds
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id)),
      );
    }
  }

  onRowAction(event: DataTableActionEvent<ActivityTypeItem>): void {
    if (event.actionId === 'children') {
        this.viewChildren.emit(event.row);
        return;
    }

    if (event.actionId === 'edit') {
      this.editActivityType.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deleteActivityType.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedActivityTypeIds.set(keys.map((key) => String(key)));
  }

  private formatStatus(value: string): string {
    const normalized = String(value ?? '').trim().toUpperCase();

    return normalized === '1' || normalized === 'ACTIVO' || normalized === 'A'
      ? 'Activo'
      : 'Inactivo';
  }

  private formatPtd(
    value: string | null,
  ): string {
    return value === '1' ? 'Sí' : 'No';
  }

}