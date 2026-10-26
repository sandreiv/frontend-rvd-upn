import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, model } from '@angular/core';
import { DataTable } from '../../../../../../shared/ui/data-table/data-table';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableToolbarActionEvent,
} from '../../../../../../shared/ui/data-table/table.types';
import { CostCenterAssignmentItem } from '../../../model/coordination-administration.model';

@Component({
  selector: 'app-cost-center-assignment-table',
  imports: [DataTable],
  templateUrl: './cost-center-assignment-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostCenterAssignmentTable {
  assignments = input<CostCenterAssignmentItem[]>([]);
  selectedAssignmentIds = model<string[]>([]);

  canAdd = input(true);
  emptyMessage = input('No hay centros de costo asignados.');

  @Output() refreshAssignments = new EventEmitter<void>();
  @Output() addAssignment = new EventEmitter<void>();
  @Output() editAssignment = new EventEmitter<CostCenterAssignmentItem>();
  @Output() deleteAssignment = new EventEmitter<CostCenterAssignmentItem>();
  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (row: CostCenterAssignmentItem): string => String(row.id);

  readonly columns: DataTableColumn<CostCenterAssignmentItem>[] = [
    {
      id: 'coordinacion',
      header: 'Coordinación',
      cell: (row) => row.coordinacion || '-',
      formatAsSentence: true,
    },
    {
      id: 'centroCosto',
      header: 'Centro costo',
      cell: (row) => row.centroCosto || '-',
      formatAsSentence: true,
    },
    {
      id: 'estado',
      header: 'Estado',
      cell: (row) => this.formatStatus(row.estado),
    },
  ];

  readonly rowActions: DataTableRowAction<CostCenterAssignmentItem>[] = [
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

  onToolbarAction(event: DataTableToolbarActionEvent<CostCenterAssignmentItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshAssignments.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addAssignment.emit();
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

  onRowAction(event: DataTableActionEvent<CostCenterAssignmentItem>): void {
    if (event.actionId === 'edit') {
      this.editAssignment.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deleteAssignment.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedAssignmentIds.set(keys.map((key) => String(key)));
  }

  private formatStatus(value: string): string {
    const normalized = String(value ?? '').trim().toUpperCase();

    return normalized === '1' || normalized === 'ACTIVO' || normalized === 'A'
      ? 'Activo'
      : 'Inactivo';
  }
}