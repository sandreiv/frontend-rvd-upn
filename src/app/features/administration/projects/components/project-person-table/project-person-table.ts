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
  ProjectPersonItem,
  resolveProjectLookupName,
} from '../../model/projects.model';

@Component({
  selector: 'app-project-person-table',
  imports: [DataTable],
  templateUrl: './project-person-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPersonTable {
  persons = input<ProjectPersonItem[]>([]);
  selectedPersonIds = model<string[]>([]);

  @Output() refreshPersons = new EventEmitter<void>();
  @Output() addPerson = new EventEmitter<void>();
  @Output() editPerson = new EventEmitter<ProjectPersonItem>();
  @Output() deletePerson = new EventEmitter<ProjectPersonItem>();
  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (row: ProjectPersonItem): string => String(row.id);

  readonly columns: DataTableColumn<ProjectPersonItem>[] = [
    {
      id: 'nombreCompleto',
      header: 'Nombre completo',
      cell: (row) => row.nombreCompleto || '-',
      formatAsSentence: true,
    },
    {
      id: 'tipoActividad',
      header: 'Tipo actividad',
      cell: (row) => resolveProjectLookupName(row.tipoActividad),
      formatAsSentence: true,
    },
    {
      id: 'tipo',
      header: 'Tipo',
      cell: (row) => row.tipo || '-',
    },
    {
      id: 'horas',
      header: 'Horas',
      cell: (row) => row.horas || '-',
    },
    {
      id: 'observacion',
      header: 'Observación',
      cell: (row) => row.observacion || '-',
      formatAsSentence: true,
    },
    {
      id: 'esActivo',
      header: 'Es activo',
      cell: (row) => this.formatYesNo(row.esActivo),
    },
  ];

  readonly rowActions: DataTableRowAction<ProjectPersonItem>[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      className: 'text-red-500',
    },
  ];

  onToolbarAction(
    event: DataTableToolbarActionEvent<ProjectPersonItem>,
  ): void {
    if (event.actionId === 'refresh') {
      this.refreshPersons.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addPerson.emit();
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

  onRowAction(event: DataTableActionEvent<ProjectPersonItem>): void {
    if (event.actionId === 'edit') {
      this.editPerson.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deletePerson.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedPersonIds.set(keys.map((key) => String(key)));
  }

  private formatYesNo(value: string | null): string {
    const normalized = String(value ?? '').trim().toUpperCase();

    return normalized === '1' || normalized === 'S' || normalized === 'SI' || normalized === 'TRUE'
      ? 'Sí'
      : 'No';
  }
}
