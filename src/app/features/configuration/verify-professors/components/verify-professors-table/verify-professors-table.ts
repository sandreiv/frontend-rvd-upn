import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
} from '@angular/core';
import { DataTable } from '../../../../../shared/ui/data-table/data-table';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableToolbarActionEvent,
} from '../../../../../shared/ui/data-table/table.types';
import {
  VerifyProfessorItem,
  formatVerifyProfessorStatus,
} from '../../model/verify-professors.model';

@Component({
  selector: 'app-verify-professors-table',
  imports: [DataTable],
  templateUrl: './verify-professors-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyProfessorsTable {
  professors = input<VerifyProfessorItem[]>([]);
  emptyMessage = input('No hay docentes para verificar.');

  @Output() refreshProfessors = new EventEmitter<void>();
  @Output() viewSummary = new EventEmitter<VerifyProfessorItem>();

  readonly rowIdentity = (row: VerifyProfessorItem): string =>
    String(row.idCargaDocente);

  readonly columns: DataTableColumn<VerifyProfessorItem>[] = [
    {
      id: 'nombreCompleto',
      header: 'Docente',
      cell: (row) => row.nombreCompleto || '-',
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
      id: 'valorContrato',
      header: 'Valor contrato',
      cell: (row) =>
        row.valorContrato == null ? '-' : String(row.valorContrato),
      formatAsCurrency: true,
    },
    {
      id: 'estado',
      header: 'Estado',
      cell: (row) => formatVerifyProfessorStatus(row.estado),
    },
    {
      id: 'actividades',
      header: 'Actividades',
      cell: (row) => (row.tieneDetalleActividades ? 'Sí' : 'No'),
    },
  ];

  readonly rowActions: DataTableRowAction<VerifyProfessorItem>[] = [
    {
      id: 'summary',
      label: 'Ver resumen',
      icon: 'file',
    },
  ];

  onToolbarAction(
    event: DataTableToolbarActionEvent<VerifyProfessorItem>,
  ): void {
    if (event.actionId === 'refresh') {
      this.refreshProfessors.emit();
    }
  }

  onRowAction(event: DataTableActionEvent<VerifyProfessorItem>): void {
    if (event.actionId === 'summary') {
      this.viewSummary.emit(event.row);
    }
  }
}
