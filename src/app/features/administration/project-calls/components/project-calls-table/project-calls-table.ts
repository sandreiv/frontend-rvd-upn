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
  ProjectCallItem,
  resolveProjectCallConvocatoriaLabel,
} from '../../model/project-calls.model';

@Component({
  selector: 'app-project-calls-table',
  imports: [DataTable],
  templateUrl: './project-calls-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCallsTable {
  projectCalls = input<ProjectCallItem[]>([]);
  selectedProjectCallIds = model<string[]>([]);

  @Output() refreshProjectCalls = new EventEmitter<void>();
  @Output() addProjectCall = new EventEmitter<void>();
  @Output() editProjectCall = new EventEmitter<ProjectCallItem>();
  @Output() deleteProjectCall = new EventEmitter<ProjectCallItem>();
  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (row: ProjectCallItem): string => String(row.id);

  readonly columns: DataTableColumn<ProjectCallItem>[] = [
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
      id: 'convocatoria',
      header: 'Convocatoria',
      cell: (row) => resolveProjectCallConvocatoriaLabel(row),
      formatAsSentence: true,
    },
  ];

  readonly rowActions: DataTableRowAction<ProjectCallItem>[] = [
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

  onToolbarAction(event: DataTableToolbarActionEvent<ProjectCallItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshProjectCalls.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addProjectCall.emit();
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

  onRowAction(event: DataTableActionEvent<ProjectCallItem>): void {
    if (event.actionId === 'edit') {
      this.editProjectCall.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deleteProjectCall.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedProjectCallIds.set(keys.map((key) => String(key)));
  }
}
