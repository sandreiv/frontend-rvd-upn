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
import { NoveltyItem } from '../../model/novelties.model';

@Component({
  selector: 'app-novelties-table',
  imports: [DataTable],
  templateUrl: './novelties-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoveltiesTable {
  novelties = input<NoveltyItem[]>([]);
  selectedNoveltyIds = model<string[]>([]);

  @Output()
  refreshNovelties = new EventEmitter<void>();

  @Output()
  addNovelty = new EventEmitter<void>();

  @Output()
  editNovelty = new EventEmitter<NoveltyItem>();

  @Output()
  deleteNovelty = new EventEmitter<NoveltyItem>();

  @Output()
  deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (
    row: NoveltyItem,
  ): string => String(row.id);

  readonly columns: DataTableColumn<NoveltyItem>[] = [
    {
      id: 'tipo',
      header: 'Tipo de novedad',
      cell: (row) => row.tipo || '-',
      formatAsSentence: true,
    },
    {
      id: 'descripcion',
      header: 'Descripción',
      cell: (row) => row.descripcion || '-',
      formatAsSentence: true,
    },
    {
      id: 'accion',
      header: 'Acción',
      cell: (row) => row.accion || '-',
      formatAsSentence: true,
    },
  ];

  readonly rowActions:
    DataTableRowAction<NoveltyItem>[] = [
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
    event: DataTableToolbarActionEvent<NoveltyItem>,
  ): void {
    if (event.actionId === 'refresh') {
      this.refreshNovelties.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addNovelty.emit();
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

  onRowAction(
    event: DataTableActionEvent<NoveltyItem>,
  ): void {
    if (event.actionId === 'edit') {
      this.editNovelty.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deleteNovelty.emit(event.row);
    }
  }

  onSelectedIdsChange(
    keys: Array<string | number>,
  ): void {
    this.selectedNoveltyIds.set(
      keys.map((key) => String(key)),
    );
  }
}