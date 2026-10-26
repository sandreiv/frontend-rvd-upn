/**
 * Aplicación: rvd
 * Archivo: load-restriction-table.ts
 * Ruta: src/app/features/administration/load-restriction/components/load-restriction-table
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Fecha de creación: 22/07/2026
 * Modificaciones:
 * 22/07/2026 - Joel Daniel Arias Duarte - Creación inicial para listar modalidades con acción de restricción de carga.
 */
import { ChangeDetectionStrategy, Component, EventEmitter, Output, input } from '@angular/core';
import { DataTable } from '../../../../../shared/ui/data-table/data-table';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableToolbarActionEvent,
} from '../../../../../shared/ui/data-table/table.types';
import {
  formatLoadRestrictionStatus,
  LoadRestrictionModalityItem,
} from '../../model/load-restriction.model';

@Component({
  selector: 'app-load-restriction-table',
  imports: [DataTable],
  templateUrl: './load-restriction-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadRestrictionTable {
  modalities = input<LoadRestrictionModalityItem[]>([]);

  @Output() refreshModalities = new EventEmitter<void>();
  @Output() configureLoadRestriction = new EventEmitter<LoadRestrictionModalityItem>();

  readonly rowIdentity = (row: LoadRestrictionModalityItem): string => String(row.id);

  readonly columns: DataTableColumn<LoadRestrictionModalityItem>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      cell: (row) => row.nombre || '-',
      formatAsSentence: true,
    },
    {
      id: 'sigla',
      header: 'Sigla',
      cell: (row) => row.sigla || '-',
    },
    {
      id: 'estado',
      header: 'Estado',
      cell: (row) => formatLoadRestrictionStatus(row.estado),
    },
  ];

  readonly rowActions: DataTableRowAction<LoadRestrictionModalityItem>[] = [
    {
      id: 'load-restriction',
      label: 'Restricción de carga',
      icon: 'lock',
    },
  ];

  /**
   * Atiende las acciones del toolbar.
   * En esta pantalla el botón agregar se mantiene deshabilitado,
   * por lo tanto solo se procesa refrescar.
   */
  onToolbarAction(event: DataTableToolbarActionEvent<LoadRestrictionModalityItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshModalities.emit();
    }
  }

  /**
   * Atiende la acción de fila para abrir la configuración de restricción de carga.
   *
   * @param event Acción seleccionada desde el menú de la fila.
   */
  onRowAction(event: DataTableActionEvent<LoadRestrictionModalityItem>): void {
    if (event.actionId === 'load-restriction') {
      this.configureLoadRestriction.emit(event.row);
    }
  }
}