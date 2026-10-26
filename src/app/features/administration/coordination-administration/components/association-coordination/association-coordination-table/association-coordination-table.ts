import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, model } from '@angular/core';
import { DataTable } from '../../../../../../shared/ui/data-table/data-table';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableToolbarActionEvent,
} from '../../../../../../shared/ui/data-table/table.types';
import { CoordinationAssociationItem } from '../../../model/coordination-administration.model';

@Component({
  selector: 'app-association-coordination-table',
  imports: [DataTable],
  templateUrl: './association-coordination-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationCoordinationTable {
  associations = input<CoordinationAssociationItem[]>([]);
  selectedAssociationIds = model<string[]>([]);

  canAdd = input(true);
  emptyMessage = input('No hay asociaciones registradass.');

  @Output() refreshAssociations = new EventEmitter<void>();
  @Output() addAssociation = new EventEmitter<void>();
  @Output() editAssociation = new EventEmitter<CoordinationAssociationItem>();
  @Output() deleteAssociation = new EventEmitter<CoordinationAssociationItem>();
  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (row: CoordinationAssociationItem): string => String(row.id);

  readonly columns: DataTableColumn<CoordinationAssociationItem>[] = [
    {
      id: 'coordinacion',
      header: 'Coordinación',
      cell: (row) => row.coordinacion || '-',
      formatAsSentence: true,
    },
    {
      id: 'programa',
      header: 'Programa',
      cell: (row) => row.programa || '-',
      formatAsSentence: true,
    },
    {
      id: 'materia',
      header: 'Materia',
      cell: (row) => row.materia || row.codigoMateria || '-',
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

  readonly rowActions: DataTableRowAction<CoordinationAssociationItem>[] = [
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

  onToolbarAction(event: DataTableToolbarActionEvent<CoordinationAssociationItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshAssociations.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addAssociation.emit();
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

  onRowAction(event: DataTableActionEvent<CoordinationAssociationItem>): void {
    if (event.actionId === 'edit') {
      this.editAssociation.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deleteAssociation.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedAssociationIds.set(keys.map((key) => String(key)));
  }

  private formatStatus(value: string): string {
    const normalized = String(value ?? '').trim().toUpperCase();

    return normalized === '1' || normalized === 'ACTIVO' || normalized === 'A'
      ? 'Activo'
      : 'Inactivo';
  }
}