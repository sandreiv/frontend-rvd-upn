import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { DataTable } from '../../../../../shared/ui/data-table/data-table';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableSearchEvent,
  DataTableToolbarActionEvent,
} from '../../../../../shared/ui/data-table/table.types';
import {
  isHiringContratacion,
  labelContratacion,
  PreloadCallItem,
} from '../../model/preload-call.model';

@Component({
  selector: 'app-preload-call-table',
  imports: [DataTable],
  templateUrl: './preload-call-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreloadCallTable {
  readonly preloadCalls = input<PreloadCallItem[]>([]);
  readonly selectedPreloadCallIds = input<string[]>([]);
  readonly emptyMessage = input('No hay convocatorias de precarga.');
  readonly showLinkCallAction = input(false);

  readonly addPreloadCall = output<void>();
  readonly editPreloadCall = output<PreloadCallItem>();
  readonly deletePreloadCall = output<PreloadCallItem>();
  readonly refreshPreloadCall = output<void>();
  readonly deleteAllPreloadCall = output<string[]>();
  readonly selectedPreloadCallIdsChange = output<string[]>();
  readonly restrictCoordination = output<PreloadCallItem>();
  readonly linkPreloadCall = output<PreloadCallItem>();
  readonly linkPreassignment = output<PreloadCallItem>();

  readonly rowIdentity = (row: PreloadCallItem): string => String(row.id);

  readonly columns: DataTableColumn<PreloadCallItem>[] = [
    {
      id: 'descripcion',
      header: 'Descripción',
      cell: (row) => row.descripcion || '-',
      formatAsSentence: true,
    },
    {
      id: 'contratacion',
      header: 'Tipo',
      cell: (row) => labelContratacion(row.contratacion),
    },
    {
      id: 'periodoUniversidad',
      header: 'Periodo universidad',
      cell: (row) => row.periodoUniversidad || '-',
      formatAsSentence: true,
    },
    {
      id: 'nivelEducativo',
      header: 'Nivel educativo',
      cell: (row) => row.nivelEducativo || '-',
      formatAsSentence: true,
    },
    {
      id: 'fechaInicio',
      header: 'Fecha inicio',
      cell: (row) => row.fechaInicio || '-',
      formatAsDate: true,
    },
    {
      id: 'fechaFin',
      header: 'Fecha fin',
      cell: (row) => row.fechaFin || '-',
      formatAsDate: true,
    },
    {
      id: 'nombreCompleto',
      header: 'Aprobado por',
      cell: (row) => row.nombreCompleto || '-',
    },
  ];

  readonly rowActions = computed((): DataTableRowAction<PreloadCallItem>[] => {
    const actions: DataTableRowAction<PreloadCallItem>[] = [
      {
        id: 'edit',
        label: 'Editar',
        icon: 'pencil',
      },
    ];

    if (this.showLinkCallAction()) {
      actions.push({
        id: 'linkCall',
        label: 'Enlazar convocatoria',
        icon: 'paperClip',
        visible: (row) => !isHiringContratacion(row.contratacion),
      });
    }

    actions.push({
      id: 'linkPreassignment',
      label: 'Relacionar preasignación',
      icon: 'paperClip',
      visible: (row) => isHiringContratacion(row.contratacion),
    });

    actions.push(
      {
        id: 'restrictCoordination',
        label: 'Restringir coordinación',
        icon: 'lock',
        visible: (row) => row.estado === '0',
      },
      {
        id: 'delete',
        label: 'Eliminar',
        className:
          'text-error-600 border-error-300 hover:bg-error-50 text-red-500',
        icon: 'delete',
      },
    );

    return actions;
  });

  onTableAction(event: DataTableActionEvent<PreloadCallItem>): void {
    if (event.actionId === 'edit') {
      this.editPreloadCall.emit(event.row);
      return;
    }

    if (event.actionId === 'linkCall') {
      this.linkPreloadCall.emit(event.row);
      return;
    }

    if (event.actionId === 'linkPreassignment') {
      this.linkPreassignment.emit(event.row);
      return;
    }

    if (event.actionId === 'restrictCoordination') {
      this.restrictCoordination.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deletePreloadCall.emit(event.row);
    }
  }

  onToolbarAction(event: DataTableToolbarActionEvent<PreloadCallItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshPreloadCall.emit();
      return;
    }

    if (event.actionId === 'deleteAll') {
      this.deleteAllPreloadCall.emit(event.selectedRowKeys.map(String));
      return;
    }

    if (event.actionId === 'add') {
      this.addPreloadCall.emit();
    }
  }

  onSearchRecords(_event: DataTableSearchEvent<PreloadCallItem>): void {}

  onSelectedPreloadCallIdsChange(keys: Array<string | number>): void {
    this.selectedPreloadCallIdsChange.emit(keys.map(String));
  }
}
