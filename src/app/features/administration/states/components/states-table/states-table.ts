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

import { StateItem } from '../../model/states.model';

@Component({
  selector: 'app-states-table',
  imports: [DataTable],
  templateUrl: './states-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatesTable {

  states = input<StateItem[]>([]);

  selectedStateIds = model<string[]>([]);

  @Output() refreshStates = new EventEmitter<void>();

  @Output() addState = new EventEmitter<void>();

  @Output() editState = new EventEmitter<StateItem>();

  @Output() nextStates = new EventEmitter<StateItem>();

  @Output() deleteState = new EventEmitter<StateItem>();

  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (
    row: StateItem,
  ): string => String(row.id);

  readonly columns: DataTableColumn<StateItem>[] = [
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
  ];

  readonly rowActions: DataTableRowAction<StateItem>[] = [
    {
        id: 'edit',
        label: 'Editar',
        icon: 'pencil',
    },
    {
        id: 'nextStates',
        label: 'Estado siguiente',
        icon: 'paperAirplane',
    },
    {
        id: 'delete',
        label: 'Eliminar',
        icon: 'delete',
        className: 'text-red-500',
    },
  ];

  onToolbarAction(
    event: DataTableToolbarActionEvent<StateItem>,
  ): void {

    if (event.actionId === 'refresh') {
      this.refreshStates.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addState.emit();
      return;
    }

    if (event.actionId === 'deleteAll') {

      this.deleteAll.emit(
        event.selectedIds
          .map((id) => Number(id))
          .filter(
            (id) => Number.isFinite(id) && id > 0,
          ),
      );
    }
  }

onRowAction(
  event: DataTableActionEvent<StateItem>,
): void {

  if (event.actionId === 'edit') {
    this.editState.emit(event.row);
    return;
  }

  if (event.actionId === 'nextStates') {
    this.nextStates.emit(event.row);
    return;
  }

  if (event.actionId === 'delete') {
    this.deleteState.emit(event.row);
  }
}

  onSelectedIdsChange(
    keys: Array<string | number>,
  ): void {
    this.selectedStateIds.set(
      keys.map((key) => String(key)),
    );
  }
}