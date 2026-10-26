import { ChangeDetectionStrategy, Component, EventEmitter, Output, input, model } from '@angular/core';
import { DataTable } from '../../../../../../shared/ui/data-table/data-table';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableToolbarActionEvent,
} from '../../../../../../shared/ui/data-table/table.types';
import {
  PersonCoordinationItem,
  PersonCoordinationKey,
} from '../../../model/coordination-administration.model';

@Component({
  selector: 'app-person-coordination-table',
  imports: [DataTable],
  templateUrl: './person-coordination-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonCoordinationTable {
  assignments = input<PersonCoordinationItem[]>([]);
  selectedAssignmentIds = model<string[]>([]);
  emptyMessage = input('No hay registros.');
  searchPlaceholder = input('Buscar...');

  canAdd = input(true);

  @Output() refreshAssignments = new EventEmitter<void>();
  @Output() addAssignment = new EventEmitter<void>();
  @Output() editAssignment = new EventEmitter<PersonCoordinationItem>();
  @Output() deleteAssignment = new EventEmitter<PersonCoordinationItem>();
  @Output() deleteAll = new EventEmitter<PersonCoordinationKey[]>();

  readonly rowIdentity = (row: PersonCoordinationItem): string =>
    this.keyToString(row.idPersonaGeneral, row.idCoordinacion);

  readonly columns: DataTableColumn<PersonCoordinationItem>[] = [
    {
      id: 'persona',
      header: 'Persona',
      cell: (row) => row.persona || '-',
      formatAsSentence: true,
    },
    {
      id: 'documentoIdentidad',
      header: 'Documento',
      cell: (row) => row.documentoIdentidad || '-',
    },
    {
      id: 'coordinacion',
      header: 'Coordinación',
      cell: (row) => row.coordinacion || '-',
      formatAsSentence: true,
    },
    {
      id: 'estado',
      header: 'Estado',
      cell: (row) => this.formatStatus(row.estado),
    },
  ];

  readonly rowActions: DataTableRowAction<PersonCoordinationItem>[] = [
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

  onToolbarAction(event: DataTableToolbarActionEvent<PersonCoordinationItem>): void {
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
          .map((key) => this.stringToKey(String(key)))
          .filter((key): key is PersonCoordinationKey => key != null),
      );
    }
  }

  onRowAction(event: DataTableActionEvent<PersonCoordinationItem>): void {
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

  private keyToString(idPersonaGeneral: number, idCoordinacion: number): string {
    return `${idPersonaGeneral}-${idCoordinacion}`;
  }

  private stringToKey(value: string): PersonCoordinationKey | null {
    const [idPersonaGeneral, idCoordinacion] = value.split('-').map(Number);

    if (!Number.isFinite(idPersonaGeneral) || !Number.isFinite(idCoordinacion)) {
      return null;
    }

    return { idPersonaGeneral, idCoordinacion };
  }

  private formatStatus(value: string): string {
    const normalized = String(value ?? '').trim().toUpperCase();

    return normalized === '1' || normalized === 'ACTIVO' || normalized === 'A'
      ? 'Activo'
      : 'Inactivo';
  }
}