import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';

import { DataTable } from '../../../../../shared/ui/data-table/data-table';
import {
  DataTableColumn,
  DataTableSearchEvent,
  DataTableToolbarActionEvent,
} from '../../../../../shared/ui/data-table/table.types';
import { PublicHiringRecord } from '../../model/hiring.model';

@Component({
  selector: 'app-public-hiring-table',
  imports: [DataTable],
  templateUrl: './hiring-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HiringTable {
  readonly records =
    input<PublicHiringRecord[]>([]);

  readonly emptyMessage = input(
    'No hay contrataciones para mostrar.',
  );

  readonly refreshRecords = output<void>();

  readonly selectedHiringKeys =
  model<string[]>([]);

  readonly startProcess =
  output<PublicHiringRecord>();

  readonly rowIdentity = (
    row: PublicHiringRecord,
  ): string =>
    `${row.idConvocatoriaContratacion}-${row.idCargaDocente}`;

  readonly columns: DataTableColumn<
    PublicHiringRecord
  >[] = [
    {
      id: 'convocatoria',
      header: 'Convocatoria',
      cell: (row) =>
        row.convocatoria || '-',
      formatAsSentence: true,
      sortable: true,
    },
    {
      id: 'nivelEducativo',
      header: 'Nivel educativo',
      cell: (row) =>
        row.nivelEducativo || '-',
      formatAsSentence: true,
      sortable: true,
    },
    {
      id: 'unidadRegional',
      header: 'Unidad',
      cell: (row) =>
        row.unidadRegional || '-',
      formatAsSentence: true,
      sortable: true,
    },
    {
      id: 'coordinacion',
      header: 'Coordinación',
      cell: (row) =>
        row.coordinacion || '-',
      formatAsSentence: true,
      sortable: true,
    },
    {
      id: 'modalidadContratacion',
      header: 'Modalidad de contratación',
      cell: (row) =>
        row.modalidadContratacion || '-',
      formatAsSentence: true,
      sortable: true,
    },
    {
      id: 'fechaInicio',
      header: 'Fecha inicio',
      cell: (row) =>
        row.fechaInicio || '-',
      formatAsDate: true,
      sortable: true,
    },
    {
      id: 'fechaFin',
      header: 'Fecha fin',
      cell: (row) =>
        row.fechaFin || '-',
      formatAsDate: true,
      sortable: true,
    },
    {
    id: 'estadoCategorizacion',
    header: 'Estado categorizado',
    cell: (row) =>
        row.estadoCategorizacion || '-',
    formatAsSentence: true,
    sortable: true,
    },
    {
      id: 'estadoPlanTrabajo',
      header: 'Plan de trabajo',
      cell: (row) =>
        row.estadoPlanTrabajo || '-',
      formatAsSentence: true,
      sortable: true,
    },
  ];

  onToolbarAction(
    event: DataTableToolbarActionEvent<
      PublicHiringRecord
    >,
  ): void {
    if (event.actionId === 'refresh') {
      this.refreshRecords.emit();
    }
  }

  onSearchRecords(
    _event: DataTableSearchEvent<
      PublicHiringRecord
    >,
  ): void {}

 
  onSelectedHiringKeysChange(
    keys: Array<string | number>,
  ): void {

   
    const previousKey =
      this.selectedHiringKeys()[0];

    const selectedKey = keys.length
      ? String(keys[keys.length - 1])
      : null;

    this.selectedHiringKeys.set(
      selectedKey ? [selectedKey] : [],
    );

    if (
      !selectedKey ||
      selectedKey === previousKey
    ) {
      return;
    }

    const record = this.records().find(
      (item) =>
        this.rowIdentity(item) === selectedKey,
    );

    if (record) {
      this.startProcess.emit(record);
    }
  }

}