import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
  model,
} from '@angular/core';
import { DataTable } from '../../../../../shared/ui/data-table/data-table';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableToolbarActionEvent,
} from '../../../../../shared/ui/data-table/table.types';
import {
  VinculacionActividadItem,
  formatEstado,
} from '../../model/vinculacion-actividades.model';

@Component({
  selector: 'app-vinculacion-actividades-table',
  imports: [DataTable],
  templateUrl:
    './vinculacion-actividades-table.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class VinculacionActividadesTable {
  items = input<VinculacionActividadItem[]>([]);
  selectedIds = model<string[]>([]);

  @Output()
  refreshItems =
    new EventEmitter<void>();

  @Output()
  addItem =
    new EventEmitter<void>();

  @Output()
  editItem =
    new EventEmitter<VinculacionActividadItem>();

  @Output()
  deleteItem =
    new EventEmitter<VinculacionActividadItem>();

  @Output()
  deleteAll =
    new EventEmitter<number[]>();

  readonly rowIdentity = (
    row: VinculacionActividadItem,
  ): string => String(row.id);

  readonly columns:
    DataTableColumn<VinculacionActividadItem>[] = [
      {
        id: 'tipoVinculacion',
        header: 'Tipo de vinculación',
        cell: (row) =>
          row.tipoVinculacion ?? '-',
      },
      {
        id: 'tipoActividad',
        header: 'Actividad',
        cell: (row) =>
          row.tipoActividad ?? '-',
      },
      {
        id: 'minimoHoras',
        header: 'Mín. horas',
        cell: (row) =>
          this.formatHoras(
            row.minimoHoras,
          ),
      },
      {
        id: 'maximoHoras',
        header: 'Máx. horas',
        cell: (row) =>
          this.formatHoras(
            row.maximoHoras,
          ),
      },
      {
        id: 'estado',
        header: 'Estado',
        cell: (row) =>
          formatEstado(
            row.estado,
          ),
      },
    ];

  readonly rowActions:
    DataTableRowAction<VinculacionActividadItem>[] = [
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
    ];

  onToolbarAction(
    event:
      DataTableToolbarActionEvent<VinculacionActividadItem>,
  ): void {

    if (event.actionId === 'refresh') {
      this.refreshItems.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addItem.emit();
      return;
    }

    if (event.actionId === 'deleteAll') {
      this.deleteAll.emit(
        event.selectedIds
          .map((id) => Number(id))
          .filter((id) =>
            Number.isFinite(id),
          ),
      );
    }
  }

  onRowAction(
    event:
      DataTableActionEvent<VinculacionActividadItem>,
  ): void {

    if (event.actionId === 'edit') {
      this.editItem.emit(
        event.row,
      );
      return;
    }

    if (event.actionId === 'delete') {
      this.deleteItem.emit(
        event.row,
      );
    }
  }

  onSelectedIdsChange(
    keys: Array<string | number>,
  ): void {
    this.selectedIds.set(
      keys.map((key) =>
        String(key),
      ),
    );
  }

  private formatHoras(
    value: string | null | undefined,
  ): string {
    return value == null || value === ''
      ? '-'
      : value;
  }
}
