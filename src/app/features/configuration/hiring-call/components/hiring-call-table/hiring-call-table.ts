import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { Button } from '../../../../../shared/ui/button/button';
import { DataTable } from '../../../../../shared/ui/data-table/data-table';
import {
  DataTableColumn,
  DataTableSearchEvent,
  DataTableToolbarActionEvent,
} from '../../../../../shared/ui/data-table/table.types';
import { CoordinationItem } from '../../../professor-preload/model/coordination.model';

@Component({
  selector: 'app-hiring-call-table',
  imports: [Button, DataTable],
  templateUrl: './hiring-call-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HiringCallTable {
  readonly coordinations = input<CoordinationItem[]>([]);
  readonly emptyMessage = input('No hay coordinaciones para mostrar.');
  readonly selectedCoordinationIds = model<string[]>([]);
  readonly isStarting = input(false);
  readonly actionLabel = input('Iniciar');
  readonly loadingActionLabel = input('Iniciando...');

  readonly refreshCoordinations = output<void>();
  readonly startHiring = output<CoordinationItem>();

  readonly rowIdentity = (row: CoordinationItem): string => String(row.id);

  readonly columns: DataTableColumn<CoordinationItem>[] = [
    {
      id: 'unidadRegional',
      header: 'Unidad',
      cell: (row) => row.unidadRegional || '-',
      formatAsSentence: true,
    },
    {
      id: 'unidadArea',
      header: 'Facultad',
      cell: (row) => row.unidadArea || '-',
      formatAsSentence: true,
    },
    {
      id: 'descripcion',
      header: 'Coordinación',
      cell: (row) => row.descripcion || row.nombre || '-',
      formatAsSentence: true,
    },
    {
      id: 'esAcademica',
      header: 'Es académica',
      cell: (row) => row.esAcademica || '-',
    },
    {
      id: 'metodologia',
      header: 'Metodología',
      cell: (row) => row.metodologia || '-',
      formatAsSentence: true,
    },
    {
      id: 'modalidad',
      header: 'Modalidad',
      cell: (row) => row.modalidad || '-',
      formatAsSentence: true,
    },
    {
      id: 'nivelEducativo',
      header: 'Nivel educativo',
      cell: (row) => row.nivelEducativo || '-',
      formatAsSentence: true,
    },
    {
      id: 'periodoUniversidad',
      header: 'Periodo universidad',
      cell: (row) => row.periodoUniversidad || '-',
    },
    {
      id: 'estadoCarga',
      header: 'Estado carga',
      cell: (row) => row.estadoCarga || '-',
      formatAsSentence: true,
    },
  ];

  onToolbarAction(
    event: DataTableToolbarActionEvent<CoordinationItem>,
  ): void {
    if (event.actionId === 'refresh') {
      this.refreshCoordinations.emit();
    }
  }

  onSearchRecords(_event: DataTableSearchEvent<CoordinationItem>): void {}

  onSelectedCoordinationIdsChange(keys: Array<string | number>): void {
    const nextKeys = keys.length ? [String(keys[keys.length - 1])] : [];
    this.selectedCoordinationIds.set(nextKeys);
  }

  onStartHiring(): void {
    const selectedId = this.selectedCoordinationIds()[0];
    if (!selectedId || this.isStarting()) {
      return;
    }

    const coordination = this.coordinations().find(
      (item) => String(item.id) === selectedId,
    );

    if (coordination) {
      this.startHiring.emit(coordination);
    }
  }
}
