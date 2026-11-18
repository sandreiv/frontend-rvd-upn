/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Fecha de creación: 18/11/2026
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
import { ProjectStudentItem } from '../../model/projects.model';

@Component({
  selector: 'app-project-student-table',
  imports: [DataTable],
  templateUrl: './project-student-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectStudentTable {
  students = input<ProjectStudentItem[]>([]);
  selectedStudentIds = model<string[]>([]);

  @Output() refreshStudents = new EventEmitter<void>();
  @Output() addStudent = new EventEmitter<void>();
  @Output() deleteStudent = new EventEmitter<ProjectStudentItem>();
  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (row: ProjectStudentItem): string => String(row.id);

  readonly columns: DataTableColumn<ProjectStudentItem>[] = [
    {
      id: 'nombreCompleto',
      header: 'Estudiante',
      cell: (row) => row.nombreCompleto || '-',
      formatAsSentence: true,
    },
    {
      id: 'documento',
      header: 'Documento',
      cell: (row) => row.documento || '-',
    },
    {
      id: 'nombrePrograma',
      header: 'Programa académico',
      cell: (row) => row.nombrePrograma || '-',
      formatAsSentence: true,
    },
  ];

  readonly rowActions: DataTableRowAction<ProjectStudentItem>[] = [
    {
      id: 'delete',
      label: 'Eliminar',
      icon: 'delete',
      className: 'text-red-500',
    },
  ];

  onToolbarAction(event: DataTableToolbarActionEvent<ProjectStudentItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshStudents.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addStudent.emit();
      return;
    }

    if (event.actionId === 'deleteAll') {
      const numericIds = event.selectedIds
        .map((id: string | number) => Number(id))
        .filter((id: number) => Number.isFinite(id));
      this.deleteAll.emit(numericIds);
    }
  }

  onRowAction(event: DataTableActionEvent<ProjectStudentItem>): void {
    if (event.actionId === 'delete') {
      this.deleteStudent.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedStudentIds.set(keys.map((key) => String(key)));
  }
}
