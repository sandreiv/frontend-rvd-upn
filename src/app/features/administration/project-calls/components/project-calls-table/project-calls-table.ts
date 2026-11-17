import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnInit,
  Output,
  TemplateRef,
  ViewChild,
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
import { Badge } from '../../../../../shared/ui/badge/badge';
import { TooltipDirective } from '../../../../../shared/ui/tooltip/tooltip.directive';
import { ProjectCallItem } from '../../model/project-calls.model';

@Component({
  selector: 'app-project-calls-table',
  imports: [DataTable, Badge, TooltipDirective],
  templateUrl: './project-calls-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCallsTable implements OnInit {
  @ViewChild('convocatoriasTpl', { static: true })
  convocatoriasTpl!: TemplateRef<unknown>;

  @ViewChild('estadoTpl', { static: true })
  estadoTpl!: TemplateRef<unknown>;

  projectCalls = input<ProjectCallItem[]>([]);
  selectedProjectCallIds = model<string[]>([]);

  @Output() refreshProjectCalls = new EventEmitter<void>();
  @Output() addProjectCall = new EventEmitter<void>();
  @Output() editProjectCall = new EventEmitter<ProjectCallItem>();
  @Output() deleteProjectCall = new EventEmitter<ProjectCallItem>();
  @Output() deleteAll = new EventEmitter<number[]>();

  columns: DataTableColumn<ProjectCallItem>[] = [];

  readonly rowIdentity = (row: ProjectCallItem): string => String(row.id);

  ngOnInit(): void {
    this.columns = [
      {
        id: 'nombre',
        header: 'Nombre del Grupo',
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
        id: 'convocatorias',
        header: 'Convocatorias vinculadas',
        cell: (row) => String(row.convocatorias?.length ?? 0),
        cellTemplate: this.convocatoriasTpl,
      },
      {
        id: 'estado',
        header: 'Estado',
        cell: (row) => (row.estado === '1' ? 'Activo' : 'Inactivo'),
        cellTemplate: this.estadoTpl,
      },
    ];
  }

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
