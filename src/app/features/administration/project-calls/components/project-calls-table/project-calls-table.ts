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
import { ProjectCallItem } from '../../model/project-calls.model';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderConvocatoriasBadges(item: ProjectCallItem): string {
  const convs = item.convocatorias ?? [];
  if (convs.length === 0) {
    return '<span class="text-xs italic text-gray-400 dark:text-gray-500">Sin convocatorias</span>';
  }

  const limit = 2;
  const visible = convs.slice(0, limit);
  const remaining = convs.slice(limit);

  const badges = visible.map((c) => {
    const periodBadge = c.periodo
      ? ` <span class="font-semibold text-[10px] opacity-80">(${escapeHtml(c.periodo)})</span>`
      : '';
    const fullTitle = escapeHtml(
      c.periodo ? `${c.nombre} (${c.periodo})` : c.nombre,
    );
    return `<span class="inline-flex max-w-[220px] items-center rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 text-xs font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300" title="${fullTitle}"><span class="truncate">${escapeHtml(c.nombre)}</span>${periodBadge}</span>`;
  });

  if (remaining.length > 0) {
    const remainingTitle = escapeHtml(
      remaining
        .map((c) => (c.periodo ? `${c.nombre} (${c.periodo})` : c.nombre))
        .join('\n'),
    );
    badges.push(
      `<span class="inline-flex cursor-help items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300" title="${remainingTitle}">+${remaining.length} más</span>`,
    );
  }

  return `<div class="flex flex-wrap items-center gap-1.5">${badges.join('')}</div>`;
}

function renderEstadoBadge(estado: string): string {
  if (estado === '1') {
    return '<span class="inline-flex items-center rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:border-green-500/30 dark:bg-green-500/10 dark:text-green-400">Activo</span>';
  }
  return '<span class="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">Inactivo</span>';
}

@Component({
  selector: 'app-project-calls-table',
  imports: [DataTable],
  templateUrl: './project-calls-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCallsTable {
  projectCalls = input<ProjectCallItem[]>([]);
  selectedProjectCallIds = model<string[]>([]);

  @Output() refreshProjectCalls = new EventEmitter<void>();
  @Output() addProjectCall = new EventEmitter<void>();
  @Output() editProjectCall = new EventEmitter<ProjectCallItem>();
  @Output() deleteProjectCall = new EventEmitter<ProjectCallItem>();
  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (row: ProjectCallItem): string => String(row.id);

  readonly columns: DataTableColumn<ProjectCallItem>[] = [
    {
      id: 'nombre',
      header: 'Nombre del Grupo',
      cell: (row) => row.nombre || '-',
      formatAsSentence: true,
    },
    {
      id: 'descripcion',
      header: 'Descripción',
      cell: (row) => row.descripcion || '-',
      formatAsSentence: true,
    },
    {
      id: 'convocatorias',
      header: 'Convocatorias vinculadas',
      allowHtml: true,
      cell: (row) => renderConvocatoriasBadges(row),
    },
    {
      id: 'estado',
      header: 'Estado',
      allowHtml: true,
      cell: (row) => renderEstadoBadge(row.estado),
    },
  ];

  readonly rowActions: DataTableRowAction<ProjectCallItem>[] = [
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

  onToolbarAction(event: DataTableToolbarActionEvent<ProjectCallItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshProjectCalls.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addProjectCall.emit();
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

  onRowAction(event: DataTableActionEvent<ProjectCallItem>): void {
    if (event.actionId === 'edit') {
      this.editProjectCall.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deleteProjectCall.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedProjectCallIds.set(keys.map((key) => String(key)));
  }
}
