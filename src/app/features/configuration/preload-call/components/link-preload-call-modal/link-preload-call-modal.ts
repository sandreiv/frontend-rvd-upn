import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  untracked,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Label } from '../../../../../shared/components/form/label/label';
import {
  Option,
  Select,
} from '../../../../../shared/components/form/select/select';
import { Button } from '../../../../../shared/ui/button/button';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { PreloadCallItem } from '../../model/preload-call.model';

export type PreloadCallLinkKind = 'period1' | 'preassignment';

@Component({
  selector: 'app-link-preload-call-modal',
  imports: [ReactiveFormsModule, Modal, Label, Select, Button],
  templateUrl: './link-preload-call-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkPreloadCallModal {
  readonly isOpen = input(false);
  readonly preloadCall = input<PreloadCallItem | null>(null);
  readonly calls = input<PreloadCallItem[]>([]);
  readonly isLoadingOptions = input(false);
  readonly isSaving = input(false);
  readonly linkKind = input<PreloadCallLinkKind>('period1');

  readonly close = output<void>();
  readonly save = output<number>();
  readonly unlink = output<void>();

  readonly idRelacionControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly hasExistingLink = computed(
    () => this.preloadCall()?.idRelacion != null,
  );

  readonly callOptions = computed<Option[]>(() =>
    this.calls().map((item) => ({
      value: String(item.id),
      label: item.nombre || item.descripcion || `Convocatoria ${item.id}`,
    })),
  );

  readonly isPreassignmentLink = computed(
    () => this.linkKind() === 'preassignment',
  );

  readonly modalTitle = computed(() => {
    if (this.isPreassignmentLink()) {
      return this.hasExistingLink()
        ? 'Editar relación de preasignación'
        : 'Relacionar preasignación';
    }

    return this.hasExistingLink()
      ? 'Editar enlace de convocatoria'
      : 'Enlazar convocatoria';
  });

  readonly modalDescription = computed(() =>
    this.isPreassignmentLink()
      ? 'Seleccione una convocatoria de preasignación del mismo periodo para enlazarla con'
      : 'Seleccione una convocatoria del periodo 1 del mismo año para enlazarla con',
  );

  readonly selectLabel = computed(() =>
    this.isPreassignmentLink()
      ? 'Convocatoria de preasignación'
      : 'Convocatoria periodo 1',
  );

  readonly emptyText = computed(() =>
    this.isPreassignmentLink()
      ? 'No hay convocatorias de preasignación para este periodo'
      : 'No hay convocatorias del periodo 1 para este año',
  );

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        untracked(() => this.idRelacionControl.reset(''));
        return;
      }

      const idRelacion = this.preloadCall()?.idRelacion;
      untracked(() => {
        this.idRelacionControl.setValue(
          idRelacion != null ? String(idRelacion) : '',
        );
      });
    });
  }

  onSave(): void {
    if (this.isSaving()) {
      return;
    }

    this.idRelacionControl.markAsTouched();
    if (this.idRelacionControl.invalid) {
      return;
    }

    const idRelacion = Number(this.idRelacionControl.value);
    if (Number.isNaN(idRelacion) || idRelacion <= 0) {
      return;
    }

    this.save.emit(idRelacion);
  }

  onUnlink(): void {
    if (this.isSaving() || !this.hasExistingLink()) {
      return;
    }

    this.unlink.emit();
  }

  onClose(): void {
    if (this.isSaving()) {
      return;
    }

    this.close.emit();
  }
}
