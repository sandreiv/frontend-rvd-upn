import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
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
  ProjectItem,
  resolveProjectLookupName,
  toDateOnly,
} from '../../model/projects.model';

@Component({
  selector: 'app-project-table',
  imports: [DataTable],
  templateUrl: './project-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTable {
  projects = input<ProjectItem[]>([]);
  selectedProjectIds = model<string[]>([]);
  emptyMessage = input('No hay proyectos registrados.');
  searchPlaceholder = input('Buscar proyecto...');
  showNestedActions = input(true);

  @Output() refreshProjects = new EventEmitter<void>();
  @Output() addProject = new EventEmitter<void>();
  @Output() editProject = new EventEmitter<ProjectItem>();
  @Output() deleteProject = new EventEmitter<ProjectItem>();
  @Output() deleteAll = new EventEmitter<number[]>();
  @Output() viewPersons = new EventEmitter<ProjectItem>();
  @Output() viewProducts = new EventEmitter<ProjectItem>();

  readonly rowIdentity = (row: ProjectItem): string => String(row.id);

  readonly columns: DataTableColumn<ProjectItem>[] = [
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
      id: 'fechaInicio',
      header: 'Fecha inicio',
      cell: (row) => toDateOnly(row.fechaInicio) || '-',
      formatAsDate: true,
    },
    {
      id: 'fechaFin',
      header: 'Fecha fin',
      cell: (row) => toDateOnly(row.fechaFin) || '-',
      formatAsDate: true,
    },
    {
      id: 'monto',
      header: 'Monto',
      cell: (row) => row.monto || '-',
      formatAsCurrency: true,
    },
    {
      id: 'convocatoria',
      header: 'Convocatoria',
      cell: (row) => resolveProjectLookupName(row.convocatoriaProyectos),
      formatAsSentence: true,
    },
    {
      id: 'tipoProyecto',
      header: 'Tipo proyecto',
      cell: (row) => resolveProjectLookupName(row.tipoProyecto),
      formatAsSentence: true,
    },
  ];

  readonly rowActions = computed<DataTableRowAction<ProjectItem>[]>(() => {
    const actions: DataTableRowAction<ProjectItem>[] = [
      { id: 'edit', label: 'Editar', icon: 'pencil' },
      {
        id: 'delete',
        label: 'Eliminar',
        icon: 'delete',
        className: 'text-red-500',
      },
    ];

    if (this.showNestedActions()) {
      actions.push(
        { id: 'persons', label: 'Agregar persona', icon: 'user' },
        {
          id: 'products',
          label: 'Agregar/ver productos',
          icon: 'documentPlus',
        },
      );
    }

    return actions;
  });

  onToolbarAction(event: DataTableToolbarActionEvent<ProjectItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshProjects.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addProject.emit();
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

  onRowAction(event: DataTableActionEvent<ProjectItem>): void {
    if (event.actionId === 'edit') {
      this.editProject.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deleteProject.emit(event.row);
      return;
    }

    if (event.actionId === 'persons') {
      this.viewPersons.emit(event.row);
      return;
    }

    if (event.actionId === 'products') {
      this.viewProducts.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedProjectIds.set(keys.map((key) => String(key)));
  }
}
