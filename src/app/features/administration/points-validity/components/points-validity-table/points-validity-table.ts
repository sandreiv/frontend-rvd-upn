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
import { PointsValidityItem } from '../../model/points-validity.model';

@Component({
  selector: 'app-points-validity-table',
  imports: [DataTable],
  templateUrl: './points-validity-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PointsValidityTable {
  items = input<PointsValidityItem[]>([]);
  selectedIds = model<string[]>([]);

  @Output()
  refreshItems = new EventEmitter<void>();

  @Output()
  addItem = new EventEmitter<void>();

  @Output()
  editItem =
    new EventEmitter<PointsValidityItem>();

  @Output()
  deleteItem =
    new EventEmitter<PointsValidityItem>();

  @Output()
  deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (
    row: PointsValidityItem,
  ): string => String(row.id);

  readonly columns:
    DataTableColumn<PointsValidityItem>[] = [
      {
        id: 'anio',
        header: 'Año',
        cell: (row) =>
          row.anio != null
            ? String(row.anio)
            : '-',
      },
      {
        id: 'valorPunto',
        header: 'Valor punto',
        cell: (row) =>
          this.formatValue(
            row.valorPunto,
          ),
      },
    ];

  readonly rowActions:
    DataTableRowAction<PointsValidityItem>[] = [
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
      DataTableToolbarActionEvent<PointsValidityItem>,
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
      DataTableActionEvent<PointsValidityItem>,
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

  private formatValue(
    value: string | null | undefined,
  ): string {

    if (
      value == null ||
      value === ''
    ) {
      return '-';
    }

    const numeric =
      Number(value);

    if (!Number.isFinite(numeric)) {
      return value;
    }

    return new Intl.NumberFormat(
      'es-CO',
      {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    ).format(numeric);
  }
}