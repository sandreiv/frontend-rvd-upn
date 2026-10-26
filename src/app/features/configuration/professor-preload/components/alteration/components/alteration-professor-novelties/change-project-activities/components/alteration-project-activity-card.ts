import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { TipoActividad } from '../../../../../../model/professor-activities.model';
import { ProfessorProjectRow } from '../../../../../../model/professor-projects.model';
import { Tooltip } from '../../../../../../../../../shared/ui/tooltip/tooltip';
import { Checkbox } from '../../../../../../../../../shared/components/form/input/checkbox';
import { Button } from '../../../../../../../../../shared/ui/button/button';

@Component({
  selector: 'app-alteration-project-activity-card',
  imports: [Tooltip, Checkbox, Button],
  templateUrl: './alteration-project-activity-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlterationProjectActivityCard {

  tipoActividad = input<TipoActividad | null>(null);
  projectRows =input<ProfessorProjectRow[]>([]);
  associatedRows =input<ProfessorProjectRow[]>([]);
  isLoading = input(false);
  associationExpired = input(false);
  associationExpiredReason = input<string | null>(null);

  associatedRowsChange = output<ProfessorProjectRow[]>();

  private readonly selectedIds = signal<ReadonlySet<number>>(new Set(),);

  readonly hasSelection = computed(() => this.selectedIds().size > 0);
  readonly associatedIds = computed(() => new Set(
    this.associatedRows().map((row) => row.idPersonaProyecto))
  );
  readonly associationBlockedMessage = computed(() => {
    if (this.associationExpired()) {
      return (
        this.associationExpiredReason() ??
        'La fecha límite para asociar proyectos ya expiró.'
      );
    }

    return '';
  });

  isSelected(idPersonaProyecto: number): boolean {
    return this.selectedIds().has(
      idPersonaProyecto,
    );
  }

  isAssociated(idPersonaProyecto: number): boolean {
    return this.associatedIds().has(
      idPersonaProyecto,
    );
  }

  isCheckboxDisabled(row: ProfessorProjectRow): boolean {
    return (
      this.associationExpired() ||
      !row.esSeleccionable ||
      this.isAssociated(
        row.idPersonaProyecto,
      )
    );
  }

  onSelectionChange(row: ProfessorProjectRow, checked: boolean): void {
    if (this.associationExpired()) {
      return;
    }

    if (this.isCheckboxDisabled(row)) {
      return;
    }

    this.selectedIds.update(
      (current) => {
        const next = new Set(current);

        if (checked) {
          next.add(row.idPersonaProyecto);
        } else {
          next.delete(row.idPersonaProyecto);
        }

        return next;
      }
    );
  }

  onAssociateSelected(): void {
    if (this.associationExpired()) {
      return;
    }

    const selected =this.selectedIds();

    if (!selected.size) {
      return;
    }

    const associatedIds = this.associatedIds();

    const toAdd = this.projectRows().filter(
      (row) =>
        row.esSeleccionable &&
        selected.has(row.idPersonaProyecto) &&
        !associatedIds.has(row.idPersonaProyecto)
    );

    if (!toAdd.length) {
      this.selectedIds.set(new Set());
      return;
    }

    this.associatedRowsChange.emit([
      ...this.associatedRows(),
      ...toAdd,
    ]);

    this.selectedIds.set(new Set());
  }

  onDisassociate(row: ProfessorProjectRow): void {
    if (this.associationExpired()) {
      return;
    }

    this.removeAssociatedProject(row.idPersonaProyecto);
    return;
  }

  private removeAssociatedProject(idPersonaProyecto: number): void {
    this.associatedRowsChange.emit(
      this.associatedRows().filter(
        (row) => row.idPersonaProyecto !== idPersonaProyecto
      )
    );
  }

  rowPaddingClass(nivel: 0 | 1): string {
    return nivel === 1
      ? 'pl-8'
      : '';
  }

  hasHorasDedicacion(row: ProfessorProjectRow): boolean {
    return (row.horasDedicacion != null);
  }
}
