import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  input,
  signal,
} from '@angular/core';

import {
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

import { Button } from '../../../../../shared/ui/button/button';

import { Label } from '../../../../../shared/components/form/label/label';

import {
  Option,
  Select,
} from '../../../../../shared/components/form/select/select';

import {
  NextStatesFormData,
  StateItem,
} from '../../model/states.model';

@Component({
  selector: 'app-next-states-form',
  imports: [
    ReactiveFormsModule,
    Button,
    Label,
    Select,
  ],
  templateUrl: './next-states-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NextStatesForm implements OnChanges {

  /**
   * Estado sobre el cual estamos configurando
   * sus estados siguientes.
   */
  originState = input.required<StateItem>();

  /**
   * Catálogo general de estados.
   */
  states = input<StateItem[]>([]);

  /**
   * Estados siguientes registrados previamente.
   */
  initialNextStates = input<StateItem[]>([]);

  isSaving = input(false);

  isLoading = input(false);

  canSave = input(false);

  errorMessage = input('');

  @Output() cancel = new EventEmitter<void>();

  @Output() saveNextStates =
    new EventEmitter<NextStatesFormData>();

  /**
   * Control utilizado por el selector.
   */
  readonly stateControl = new FormControl('', {
    nonNullable: true,
  });

  /**
   * Estados seleccionados temporalmente.
   */
  readonly selectedStates = signal<StateItem[]>([]);

  /**
   * Opciones disponibles dentro del selector.
   *
   * Excluye el estado de origen y aquellos
   * que ya fueron seleccionados.
   */
  readonly stateOptions = computed<Option[]>(() => {

    const originId = this.originState().id;

    const selectedIds = new Set(
      this.selectedStates().map((item) => item.id),
    );

    return this.states()
      .filter(
        (item) =>
          item.id !== originId &&
          !selectedIds.has(item.id),
      )
      .map((item) => ({
        value: String(item.id),
        label: item.nombre,
      }));
  });

  ngOnChanges(changes: SimpleChanges): void {

    if (
      changes['initialNextStates'] ||
      changes['originState']
    ) {

      const originId = this.originState().id;

      const uniqueStates = new Map<number, StateItem>();

      for (const item of this.initialNextStates()) {

        if (item.id !== originId) {
          uniqueStates.set(item.id, item);
        }
      }

      this.selectedStates.set(
        Array.from(uniqueStates.values()),
      );

      this.stateControl.setValue('', {
        emitEvent: false,
      });
    }
  }

  /**
   * Agrega un estado a la selección.
   */
  onStateSelected(value: string): void {

    if (this.isSaving() || this.isLoading()) {
      return;
    }

    const id = Number(value);

    if (!id || id === this.originState().id) {

      this.stateControl.setValue('');

      return;
    }

    const state = this.states().find(
      (item) => item.id === id,
    );

    if (!state) {

      this.stateControl.setValue('');

      return;
    }

    if (
      this.selectedStates().some(
        (item) => item.id === id,
      )
    ) {

      this.stateControl.setValue('');

      return;
    }

    this.selectedStates.update(
      (current) => [...current, state],
    );

    // Limpiar el selector para permitir
    // seleccionar otro estado.
    this.stateControl.setValue('');
  }

  /**
   * Retira un estado de la selección temporal.
   */
  removeState(id: number): void {

    if (this.isSaving() || this.isLoading()) {
      return;
    }

    this.selectedStates.update(
      (current) =>
        current.filter((item) => item.id !== id),
    );
  }

  /**
   * Envía la selección completa para guardar.
   */
  onSubmit(): void {

    if (
    this.isSaving() ||
    this.isLoading() ||
    !this.canSave()
    ) {
    return;
    }

    const payload: NextStatesFormData = {

      estadosDestinoIds: this.selectedStates()
        .map((item) => item.id),

    };

    this.saveNextStates.emit(payload);
  }
}