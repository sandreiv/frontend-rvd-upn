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
import { PreloadCallItem } from '../../model/preload-call.model';

@Component({
  selector: 'app-preload-call-table',
  imports: [DataTable],
  templateUrl: './preload-call-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreloadCallTable {
  readonly preloadCalls = input<PreloadCallItem[]>([]);
  readonly selectedPreloadCallIds = input<string[]>([]);
  readonly emptyMessage = input('No hay convocatorias registradas.');
  readonly showLinkCallAction = input(false);

  readonly addPreloadCall = output<void>();
  readonly editPreloadCall = output<PreloadCallItem>();
  readonly deletePreloadCall = output<PreloadCallItem>();
  readonly refreshPreloadCall = output<void>();
  readonly deleteAllPreloadCall = output<string[]>();
  readonly selectedPreloadCallIdsChange = output<string[]>();
  readonly linkPreloadCall = output<PreloadCallItem>();

  readonly rowIdentity = (row: PreloadCallItem): string => String(row.id);

  readonly columns: DataTableColumn<PreloadCallItem>[] = [
    {
      id: 'nombre',
      header: 'Convocatoria',
      allowHtml: true,
      cell: (row) => {
        const nombre = row.nombre || '-';
        const descripcion = row.descripcion?.trim();
        if (!descripcion || descripcion === nombre) {
          return `<div class="font-medium text-gray-900 dark:text-white">${nombre}</div>`;
        }
        return `
          <div class="flex flex-col gap-0.5 max-w-md">
            <span class="font-medium text-gray-900 dark:text-white">${nombre}</span>
            <span class="text-xs text-gray-500/80 dark:text-gray-400/80 line-clamp-2">${descripcion}</span>
          </div>
        `;
      },
    },
    {
      id: 'periodoUniversidad',
      header: 'Periodo',
      cell: (row) => row.periodoUniversidad || '-',
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
      id: 'esIntersemestral',
      header: 'Intersemestral',
      cell: (row) => (row.esIntersemestral === '1' ? 'Sí' : 'No'),
    },
    {
      id: 'estado',
      header: 'Estado',
      allowHtml: true,
      cell: (row) => {
        const isActive = row.estado === '1' || row.estado?.toUpperCase() === 'ACTIVO';
        if (isActive) {
          return `
            <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
              <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
              Activo
            </span>
          `;
        }
        return `
          <span class="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 border border-rose-200/80 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
            <span class="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
            Inactivo
          </span>
        `;
      },
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
        label: 'Relacionar convocatoria',
        icon: 'paperClip',
      });
    }

    actions.push({
      id: 'delete',
      label: 'Eliminar',
      className: 'text-error-600 border-error-300 hover:bg-error-50 text-red-500',
      icon: 'delete',
    });

    return actions;
  });

  onTableAction(event: DataTableActionEvent<PreloadCallItem>): void {
    if (event.actionId === 'edit') {
      this.editPreloadCall.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deletePreloadCall.emit(event.row);
      return;
    }

    if (event.actionId === 'linkCall') {
      this.linkPreloadCall.emit(event.row);
    }
  }

  onToolbarAction(event: DataTableToolbarActionEvent<PreloadCallItem>): void {
    if (event.actionId === 'add') {
      this.addPreloadCall.emit();
    }

    if (event.actionId === 'refresh') {
      this.refreshPreloadCall.emit();
    }

    if (event.actionId === 'deleteAll') {
      this.deleteAllPreloadCall.emit(this.selectedPreloadCallIds());
    }
  }

  onSearchRecords(_event: DataTableSearchEvent<PreloadCallItem>): void {}

  onSelectedPreloadCallIdsChange(keys: Array<string | number>): void {
    this.selectedPreloadCallIdsChange.emit(keys.map(String));
  }
}
