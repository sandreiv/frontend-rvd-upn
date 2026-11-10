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
      id: 'tipoActividad',
      header: 'Tipo actividad',
      cell: (row) => resolveProjectLookupName(row.tipoActividad),
      formatAsSentence: true,
    },
    {
      id: 'coordinacion',
      header: 'Coordinación',
      cell: (row) => resolveProjectLookupName(row.coordinacion),
      formatAsSentence: true,
    },
    {
      id: 'actaConsejo',
      header: 'Acta de Consejo',
      cell: (row) => row.actaConsejo || '-',
    },
    {
      id: 'totalDocentes',
      header: 'Docentes',
      cell: (row) => String(row.totalDocentes ?? 0),
    },
  ];

  readonly rowActions = computed<TreeTableRowAction<ProjectItem>[]>(() => [
    {
      id: 'add-subproject',
      label: 'Agregar subproyecto',
      icon: 'plus',
      visible: (row: ProjectItem) => !row.idProyectoPadre,
    },
    {
      id: 'persons',
      label: 'Participantes',
      icon: 'user',
    },
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
  ]);

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
}
