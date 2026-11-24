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
import { NovedadItem } from '../../model/novedades.model';

@Component({
  selector: 'app-novedad-table',
  imports: [DataTable],
  templateUrl: './novedad-table.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class NovedadTable {
  items = input<NovedadItem[]>([]);
  selectedIds = model<string[]>([]);

  @Output()
  refreshItems =
    new EventEmitter<void>();

  @Output()
  addItem =
    new EventEmitter<void>();

  @Output()
  editItem =
    new EventEmitter<NovedadItem>();

  @Output()
  deleteItem =
    new EventEmitter<NovedadItem>();

  @Output()
  deleteAll =
    new EventEmitter<number[]>();

  readonly rowIdentity = (
    row: NovedadItem,
  ): string => String(row.id);

  readonly columns:
    DataTableColumn<NovedadItem>[] = [
      {
        id: 'tipo',
        header: 'Tipo de novedad',
        cell: (row) =>
          row.tipo ?? '-',
      },
      {
        id: 'descripcion',
        header: 'Descripción',
        cell: (row) =>
          row.descripcion ?? '-',
      },
    ];

  readonly rowActions:
    DataTableRowAction<NovedadItem>[] = [
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
      DataTableToolbarActionEvent<NovedadItem>,
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
      DataTableActionEvent<NovedadItem>,
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
}
