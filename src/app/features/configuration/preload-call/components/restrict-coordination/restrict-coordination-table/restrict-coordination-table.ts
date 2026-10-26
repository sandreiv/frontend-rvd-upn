import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableSearchEvent,
  DataTableToolbarActionEvent,
} from '../../../../../../shared/ui/data-table/table.types';
import {
  PreloadCallItem,
  RestrictCoordinationFormData,
  RestrictCoordinationItem,
  RestrictCoordinationSaveEvent,
} from '../../../model/preload-call.model';
import { DataTable } from '../../../../../../shared/ui/data-table/data-table';
import { SectionFrame } from '../../../../../../shared/ui/section-frame/section-frame';
import { Button } from '../../../../../../shared/ui/button/button';
import { RestrictCoordinationForm } from '../restrict-coordination-form/restrict-coordination-form';

@Component({
  selector: 'app-restrict-coordination',
  imports: [DataTable, SectionFrame, Button, RestrictCoordinationForm],
  templateUrl: './restrict-coordination-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestrictCoordinationTable {
  readonly restrictCoordination = input<RestrictCoordinationItem[]>([]);
  readonly selectedRestrictCoordinationIds = input<string[]>([]);
  readonly preloadCall = input<PreloadCallItem | null>(null);
  readonly isSaving = input(false);

  readonly closeView = output<void>();
  readonly editRestrictCoordination = output<RestrictCoordinationItem>();
  readonly deleteRestrictCoordination = output<RestrictCoordinationItem>();
  readonly refreshRestrictCoordination = output<void>();
  readonly deleteAllRestrictCoordination = output<string[]>();
  readonly selectedRestrictCoordinationIdsChange = output<string[]>();
  readonly saveRestriction = output<RestrictCoordinationSaveEvent>();

  readonly showForm = signal(false);
  readonly editingRestriction = signal<RestrictCoordinationItem | null>(null);

  readonly rowIdentity = (row: RestrictCoordinationItem): string =>
    String(row.id);

  readonly columns: DataTableColumn<RestrictCoordinationItem>[] = [
    {
      id: 'coordinacion',
      header: 'Coordinación',
      cell: (row) => row.coordinacion?.nombre || '-',
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
      id: 'estado',
      header: 'Estado',
      cell: (row) => this.resolveEstadoLabel(row.estado),
    },
  ];

  readonly rowActions: DataTableRowAction<RestrictCoordinationItem>[] = [
    {
      id: 'edit',
      label: 'Editar',
      icon: 'pencil',
    },
    {
      id: 'delete',
      label: 'Eliminar',
      className:
        'text-error-600 border-error-300 hover:bg-error-50 text-red-500',
      icon: 'delete',
    },
  ];

  onTableAction(event: DataTableActionEvent<RestrictCoordinationItem>): void {
    if (event.actionId === 'edit') {
      this.openEditForm(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deleteRestrictCoordination.emit(event.row);
    }
  }

  onToolbarAction(
    event: DataTableToolbarActionEvent<RestrictCoordinationItem>,
  ): void {
    if (event.actionId === 'refresh') {
      this.refreshRestrictCoordination.emit();
      return;
    }

    if (event.actionId === 'deleteAll') {
      this.deleteAllRestrictCoordination.emit(
        event.selectedRowKeys.map(String),
      );
      return;
    }

    if (event.actionId === 'add') {
      this.openCreateForm();
    }
  }

  onSaveRestriction(payload: RestrictCoordinationFormData): void {
    this.saveRestriction.emit({
      id: this.editingRestriction()?.id ?? null,
      data: payload,
    });
  }

  closeRestrictionForm(): void {
    this.showForm.set(false);
    this.editingRestriction.set(null);
  }

  onSearchRecords(
    event: DataTableSearchEvent<RestrictCoordinationItem>,
  ): void {}

  onSelectedRestrictCoordinationIdsChange(
    keys: Array<string | number>,
  ): void {
    this.selectedRestrictCoordinationIdsChange.emit(keys.map(String));
  }

  private openCreateForm(): void {
    this.editingRestriction.set(null);
    this.showForm.set(true);
  }

  private openEditForm(row: RestrictCoordinationItem): void {
    this.editingRestriction.set(row);
    this.showForm.set(true);
    this.editRestrictCoordination.emit(row);
  }

  private resolveEstadoLabel(estado: string | null | undefined): string {
    const normalized = String(estado ?? '').trim().toUpperCase();

    if (normalized === '1' || normalized === 'ACTIVO') {
      return 'Activo';
    }

    if (
      normalized === '0' ||
      normalized === 'INACTIVO'
    ) {
      return 'Inactivo';
    }

    return estado || '-';
  }
}
