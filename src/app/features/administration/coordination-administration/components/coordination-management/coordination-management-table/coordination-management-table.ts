import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  input,
  model,
} from '@angular/core';
import { DataTable } from '../../../../../../shared/ui/data-table/data-table';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableToolbarActionEvent,
} from '../../../../../../shared/ui/data-table/table.types';
import { CoordinationManagementItem } from '../../../model/coordination-administration.model';

@Component({
  selector: 'app-coordination-management-table',
  imports: [DataTable],
  templateUrl: './coordination-management-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinationManagementTable {
  coordinations = input<CoordinationManagementItem[]>([]);
  selectedCoordinationIds = model<string[]>([]);

  emptyMessage = input('No hay coordinaciones registradas.');
  searchPlaceholder = input('Buscar coordinación...');
  showChildrenAction = input(true);

  @Output() refreshCoordinations = new EventEmitter<void>();
  @Output() addCoordination = new EventEmitter<void>();
  @Output() viewChildren = new EventEmitter<CoordinationManagementItem>();
  @Output() configureInternal = new EventEmitter<CoordinationManagementItem>();
  @Output() editCoordination = new EventEmitter<CoordinationManagementItem>();
  @Output() deleteCoordination = new EventEmitter<CoordinationManagementItem>();
  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (row: CoordinationManagementItem): string => String(row.id);

  readonly columns: DataTableColumn<CoordinationManagementItem>[] = [
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
      id: 'unidadRegional',
      header: 'Unidad regional',
      cell: (row) => row.unidadRegional || '-',
      formatAsSentence: true,
    },
    {
      id: 'unidad',
      header: 'Unidad',
      cell: (row) => row.unidad || '-',
      formatAsSentence: true,
    },
    {
      id: 'unidadPadre',
      header: 'Unidad padre',
      cell: (row) => row.unidadPadre || '-',
      formatAsSentence: true,
    },
    {
      id: 'modalidad',
      header: 'Modalidad',
      cell: (row) => row.modalidad || '-',
      formatAsSentence: true,
    },
    {
      id: 'metodologia',
      header: 'Metodología',
      cell: (row) => row.metodologia || '-',
      formatAsSentence: true,
    },
    {
      id: 'centroCosto',
      header: 'Centro costo',
      cell: (row) => row.centroCosto || '-',
      formatAsSentence: true,
    },
    {
      id: 'esAcademica',
      header: 'Es académica',
      cell: (row) => this.formatYesNo(row.esAcademica),
    },
  ];

  readonly rowActions = computed<DataTableRowAction<CoordinationManagementItem>[]>(() => {
    const actions: DataTableRowAction<CoordinationManagementItem>[] = [];

    if (this.showChildrenAction()) {
      actions.push({
        id: 'children',
        label: 'Agregar/ver coordinaciones hijas',
        icon: 'bookOpen',
      });
    }

    actions.push(
      {
        id: 'internal',
        label: 'Configuración interna',
        icon: 'adjustmentsHorizontal',
      },
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
    );

    return actions;
  });

  onToolbarAction(event: DataTableToolbarActionEvent<CoordinationManagementItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshCoordinations.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addCoordination.emit();
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

  onRowAction(event: DataTableActionEvent<CoordinationManagementItem>): void {
    if (event.actionId === 'children') {
      this.viewChildren.emit(event.row);
      return;
    }

    if (event.actionId === 'internal') {
      this.configureInternal.emit(event.row);
      return;
    }

    if (event.actionId === 'edit') {
      this.editCoordination.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deleteCoordination.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedCoordinationIds.set(keys.map((key) => String(key)));
  }

  private formatYesNo(value: string | null): string {
    const normalized = String(value ?? '').trim().toUpperCase();

    return normalized === '1' || normalized === 'S' || normalized === 'SI' || normalized === 'TRUE'
      ? 'Sí'
      : 'No';
  }
}