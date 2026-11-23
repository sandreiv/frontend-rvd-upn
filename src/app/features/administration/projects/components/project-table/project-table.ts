/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Adaptación para esquema general con Tipo de Actividades y Coordinación
 * 10/11/2026 - Leonel Antonio Perez Rios - Migración a TreeTable para soportar proyectos y subproyectos jerárquicamente
 * 10/11/2026 - Leonel Antonio Perez Rios - Limpieza de código, orden de columnas y estandarización a subproyectos
 */
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  input,
  model,
} from '@angular/core';
import { TreeTable } from '../../../../../shared/ui/tree-table/tree-table';
import {
  TreeTableActionEvent,
  TreeTableColumn,
  TreeTableRowAction,
} from '../../../../../shared/ui/tree-table/tree-table.types';
import {
  ProjectItem,
  resolveProjectLookupName,
} from '../../model/projects.model';

@Component({
  selector: 'app-project-table',
  imports: [TreeTable],
  templateUrl: './project-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTable {
  projects = input<ProjectItem[]>([]);
  selectedProjectIds = model<string[]>([]);
  isGestionable = input(true);
  emptyMessage = input('No hay proyectos registrados.');
  searchPlaceholder = input('Buscar proyecto...');

  @Output() refreshProjects = new EventEmitter<void>();
  @Output() addProject = new EventEmitter<void>();
  @Output() addSubproject = new EventEmitter<ProjectItem>();
  @Output() editProject = new EventEmitter<ProjectItem>();
  @Output() deleteProject = new EventEmitter<ProjectItem>();
  @Output() deleteAll = new EventEmitter<number[]>();
  @Output() viewPersons = new EventEmitter<ProjectItem>();

  readonly rowIdentity = (row: ProjectItem): string | number => row.id;
  readonly rowParentIdentity = (row: ProjectItem): string | number | null =>
    row.idProyectoPadre ?? null;

  readonly columns: TreeTableColumn<ProjectItem>[] = [
    {
      id: 'nombre',
      header: 'Nombre',
      allowHtml: true,
      cell: (row) => this.formatNombre(row),
    },
    {
      id: 'tipoActividad',
      header: 'Tipo actividad',
      cell: (row) => resolveProjectLookupName(row.tipoActividad),
      formatAsSentence: true,
    },
    {
      id: 'coordinacion',
      header: 'Departamento',
      cell: (row) => resolveProjectLookupName(row.coordinacion),
      formatAsSentence: true,
    },
    {
      id: 'proyectoGrupo',
      header: 'Grupo Convocatoria',
      cell: (row) => row.proyectoGrupoNombre || '-',
      formatAsSentence: true,
    },
    {
      id: 'actaConsejo',
      header: 'Acta de Consejo',
      cell: (row) => {
        const num = row.numeroActa || row.actaConsejo || '';
        const fecha = row.fechaActa ? ` (${row.fechaActa.substring(0, 10)})` : '';
        return (num + fecha) || '-';
      },
    },
    {
      id: 'activo',
      header: 'Activo',
      allowHtml: true,
      cell: (row) => this.formatStatusBadge(row.activo),
    },
  ];

  readonly rowActions = computed<TreeTableRowAction<ProjectItem>[]>(() => {
    const actions: TreeTableRowAction<ProjectItem>[] = [
      {
        id: 'persons',
        label: this.isGestionable() ? 'Participantes' : 'Ver participantes',
        icon: 'user',
      },
    ];

    if (this.isGestionable()) {
      actions.push(
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
      );
    } else {
      actions.push({
        id: 'edit',
        label: 'Ver detalle',
        icon: 'eye',
      });
    }

    return actions;
  });

  onAction(event: TreeTableActionEvent<ProjectItem>): void {
    if (event.actionId === 'add-subproject') {
      this.addSubproject.emit(event.row);
    } else if (event.actionId === 'persons') {
      this.viewPersons.emit(event.row);
    } else if (event.actionId === 'edit') {
      this.editProject.emit(event.row);
    } else if (event.actionId === 'delete') {
      this.deleteProject.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedProjectIds.set(keys.map((k) => String(k)));
  }

  private formatNombre(row: ProjectItem): string {
    const nombre = row.nombre || '-';
    const codigo = row.codigo ? row.codigo.trim() : '';

    const codigoHtml = codigo
      ? `<span class="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-700 ring-1 ring-inset ring-gray-500/15 dark:bg-white/5 dark:text-gray-300 dark:ring-white/10 mr-1.5 align-middle">${codigo}</span>`
      : '';

    const totalDocentes = Number(row.totalDocentes ?? 0);
    const totalEstudiantes = Number(row.totalEstudiantes ?? 0);

    const badges: string[] = [];

    if (totalDocentes > 0) {
      const label = totalDocentes === 1 ? '1 docente' : `${totalDocentes} docentes`;
      badges.push(`
        <span class="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30">
          <svg class="h-3 w-3 text-blue-600 dark:text-blue-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10 8a3 3 0 100-6 3 3 0 000 6zM3.465 14.493a1.23 1.23 0 00.41 1.412A9.957 9.957 0 0010 18c2.31 0 4.438-.784 6.131-2.1.43-.333.604-.903.408-1.41a7.002 7.002 0 00-13.074.003z"/>
          </svg>
          ${label}
        </span>
      `);
    }

    if (totalEstudiantes > 0) {
      const label = totalEstudiantes === 1 ? '1 estudiante' : `${totalEstudiantes} estudiantes`;
      badges.push(`
        <span class="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/30">
          <svg class="h-3 w-3 text-purple-600 dark:text-purple-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z"/>
          </svg>
          ${label}
        </span>
      `);
    }

    const subline = badges.length > 0
      ? `<div class="mt-1 flex flex-wrap items-center gap-1.5">${badges.join('')}</div>`
      : '';

    return `
      <div>
        <span>${codigoHtml}<span class="align-middle">${nombre}</span></span>
        ${subline}
      </div>
    `;
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
