import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  input,
  model,
  Output,
} from '@angular/core';
import { Button } from '../../../../../shared/ui/button/button';
import { DataTable } from '../../../../../shared/ui/data-table/data-table';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableSearchEvent,
  DataTableToolbarActionEvent,
} from '../../../../../shared/ui/data-table/table.types';
import { CoordinationItem, isAvalDesarrolloCarga } from '../../model/coordination.model';

@Component({
  selector: 'app-coordination-table',
  imports: [Button, DataTable],
  templateUrl: './coordination-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinationTable {
  coordinations = input<CoordinationItem[]>([]);
  emptyMessage = input('No hay coordinaciones para mostrar.');
  selectedCoordinationIds = model<string[]>([]);
  isStartingPreassignment = input(false);
  
  actionLabel = input('Iniciar preasignación');
  loadingActionLabel = input('Iniciando...');

  fromCDP = input(false);
  enableSelection = input(true);
  showActionButton = input(true);
  enableRowActions = input(false);
  enableAlterationAction = input(false);

  @Output() refreshCoordination = new EventEmitter<void>();
  @Output() startPreassignment = new EventEmitter<CoordinationItem>();
  @Output() openObservations = new EventEmitter<CoordinationItem>();
  @Output() openAlteration = new EventEmitter<CoordinationItem>();

  readonly rowIdentity = (row: CoordinationItem): string => String(row.id);

  readonly columns = computed<DataTableColumn<CoordinationItem>[]>(() => {
    const columns: DataTableColumn<CoordinationItem>[] = [
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
        id: 'periodoUniversidad',
        header: 'Periodo universidad',
        cell: (row) => row.periodoUniversidad || '-',
      },
    ]

    if (!this.fromCDP()) {
      columns.push(
        {
          id: 'nivelEducativo',
          header: 'Nivel educativo',
          cell: (row) => row.nivelEducativo || '-',
          formatAsSentence: true,
        },
        {
          id: 'estadoCarga',
          header: 'Estado carga',
          cell: (row) => row.estadoCarga || '-',
          formatAsSentence: true,
        },
      );
    }

    return columns;
  })

  readonly rowActions = computed((): DataTableRowAction<CoordinationItem>[] => {
    const actions: DataTableRowAction<CoordinationItem>[] = [];

    if (this.enableAlterationAction()) {
      actions.push({
        id: 'fillAlterations',
        label: 'Diligenciar novedades',
        icon: 'documentPlus',
        disabled: (row) => !isAvalDesarrolloCarga(row.estadoCarga),
        tooltip: (row) =>
          isAvalDesarrolloCarga(row.estadoCarga)
            ? ''
            : 'Solo disponible cuando el estado de carga es Aval desarrollo.',
      });
    }

    if (this.enableRowActions()) {
      actions.push({
        id: 'showRequests',
        label: 'Mostrar solicitudes CDP',
        icon: 'eye',
      });
    }

    return actions;
  });

  onTableAction(event: DataTableActionEvent<CoordinationItem>): void {
    if (event.actionId === 'showRequests') {
      this.openObservations.emit(event.row);
      return;
    }

    if (event.actionId === 'fillAlterations') {
      this.openAlteration.emit(event.row);
    }
  }

  onToolbarAction(event: DataTableToolbarActionEvent<CoordinationItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshCoordination.emit();
    }
  }

  onSearchRecords(_event: DataTableSearchEvent<CoordinationItem>): void {}

  onSelectedCoordinationIdsChange(keys: Array<string | number>): void {
    const nextKeys = keys.length
      ? [String(keys[keys.length - 1])]
      : [];

    this.selectedCoordinationIds.set(nextKeys);
  }

  onStartPreassignment(): void {
    const selectedId = this.selectedCoordinationIds()[0];
    if (!selectedId) {
      return;
    }

    const coordination = this.coordinations().find(
      (item) => String(item.id) === selectedId,
    );

    if (coordination) {
      this.startPreassignment.emit(coordination);
    }
  }
}
