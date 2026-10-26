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
import { ProjectTypeItem } from '../../model/project-types.model';

@Component({
  selector: 'app-project-types-table',
  imports: [DataTable],
  templateUrl: './project-types-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTypesTable {
  projectTypes = input<ProjectTypeItem[]>([]);
  selectedProjectTypeIds = model<string[]>([]);

  @Output() refreshProjectTypes = new EventEmitter<void>();
  @Output() addProjectType = new EventEmitter<void>();
  @Output() editProjectType = new EventEmitter<ProjectTypeItem>();
  @Output() deleteProjectType = new EventEmitter<ProjectTypeItem>();
  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (row: ProjectTypeItem): string => String(row.id);

  readonly columns: DataTableColumn<ProjectTypeItem>[] = [
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
      id: 'minimoParticipantes',
      header: 'Mín. participantes',
      cell: (row) => row.minimoParticipantes || '-',
    },
    {
      id: 'maximoParticipantes',
      header: 'Máx. participantes',
      cell: (row) => row.maximoParticipantes || '-',

    },
    {
      id: 'montoMaximo',
      header: 'Monto máximo',
      cell: (row) => row.montoMaximo || '-',
      formatAsCurrency: true,
    },
    {
      id: 'minimoProductos',
      header: 'Mín. productos',
      cell: (row) => row.minimoProductos || '-',
    },
    {
      id: 'minimoConocimientoTi',
      header: 'Mín. conocimiento TI',
      cell: (row) => row.minimoConocimientoTi || '-',
    },
    {
      id: 'tipo',
      header: 'Tipo',
      cell: (row) => row.tipo || '-',
    },
  ];

  readonly rowActions: DataTableRowAction<ProjectTypeItem>[] = [
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

  onToolbarAction(event: DataTableToolbarActionEvent<ProjectTypeItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshProjectTypes.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addProjectType.emit();
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

  onRowAction(event: DataTableActionEvent<ProjectTypeItem>): void {
    if (event.actionId === 'edit') {
      this.editProjectType.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deleteProjectType.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedProjectTypeIds.set(keys.map((key) => String(key)));
  }
}
