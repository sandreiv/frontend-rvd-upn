/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Ajuste de columnas para participantes y roles en esquema general
 * 10/11/2026 - Leonel Antonio Perez Rios - Remoción de columna rol inexistente en BD
 * 10/11/2026 - Leonel Antonio Perez Rios - Inclusión de badge para la columna de estado y refactorización limpia
 */
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  input,
  model,
} from '@angular/core';
import { DataTable } from '../../../../../shared/ui/data-table/data-table';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableToolbarActionEvent,
} from '../../../../../shared/ui/data-table/table.types';
import { ProjectPersonItem } from '../../model/projects.model';

@Component({
  selector: 'app-project-person-table',
  imports: [DataTable],
  templateUrl: './project-person-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPersonTable {
  persons = input<ProjectPersonItem[]>([]);
  selectedPersonIds = model<string[]>([]);

  @Output() refreshPersons = new EventEmitter<void>();
  @Output() addPerson = new EventEmitter<void>();
  @Output() editPerson = new EventEmitter<ProjectPersonItem>();
  @Output() deletePerson = new EventEmitter<ProjectPersonItem>();
  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (row: ProjectPersonItem): string => String(row.id);

  readonly columns: DataTableColumn<ProjectPersonItem>[] = [
    {
      id: 'nombreCompleto',
      header: 'Nombre completo',
      cell: (row) => row.nombreCompleto || '-',
      formatAsSentence: true,
    },
    {
      id: 'documento',
      header: 'Documento',
      cell: (row) => row.documento || '-',
    },
    {
      id: 'horas',
      header: 'Horas',
      cell: (row) => row.horas || '-',
    },
    {
      id: 'observacion',
      header: 'Observación',
      cell: (row) => row.observacion || '-',
      formatAsSentence: true,
    },
    {
      id: 'estado',
      header: 'Estado',
      allowHtml: true,
      cell: (row) => this.formatStatusBadge(row.esActivo || row.estado),
    },
  ];

  readonly rowActions: DataTableRowAction<ProjectPersonItem>[] = [
    { id: 'edit', label: 'Editar', icon: 'pencil' },
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      className: 'text-red-500',
    },
  ];

  onToolbarAction(event: DataTableToolbarActionEvent<ProjectPersonItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshPersons.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addPerson.emit();
      return;
    }

    if (event.actionId === 'deleteAll') {
      const numericIds = event.selectedIds
        .map((id) => Number(id))
        .filter((id) => Number.isFinite(id));
      this.deleteAll.emit(numericIds);
    }
  }

  onRowAction(event: DataTableActionEvent<ProjectPersonItem>): void {
    if (event.actionId === 'edit') {
      this.editPerson.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deletePerson.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedPersonIds.set(keys.map((key) => String(key)));
  }

  private formatStatusBadge(value: string | null | undefined): string {
    const normalized = String(value ?? '').trim().toUpperCase();
    const isActive =
      normalized === '1' ||
      normalized === 'S' ||
      normalized === 'SI' ||
      normalized === 'ACTIVO' ||
      normalized === 'TRUE';

    if (isActive) {
      return `
        <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Activo
        </span>
      `;
    }

    return `
      <span class="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 border border-rose-200/80 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
        <span class="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
        Inactivo
      </span>
    `;
  }
}
