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
  ProfileItem,
  ProfileStatesFormData,
} from '../../model/profiles.model';

import { StateItem } from '../../../states/model/states.model';

@Component({
  selector: 'app-profile-states-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Button,
    Label,
    Select,
  ],
  templateUrl: './profile-states-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileStatesForm implements OnChanges {

  /**
   * Perfil seleccionado.
   */
  profile = input.required<ProfileItem>();

  /**
   * Catálogo general de estados.
   */
  states = input<StateItem[]>([]);

  /**
   * Estados relacionados previamente.
   */
  initialStates = input<StateItem[]>([]);

  isSaving = input(false);

  isLoading = input(false);

  canSave = input(false);

  errorMessage = input('');

  @Output() cancel = new EventEmitter<void>();

  @Output() saveStates =
    new EventEmitter<ProfileStatesFormData>();

  /**
   * Control del selector.
   */
  readonly stateControl = new FormControl('', {
    nonNullable: true,
  });

  /**
   * Estados seleccionados temporalmente.
   */
  readonly selectedStates = signal<StateItem[]>([]);

  /**
   * Estados disponibles.
   *
   * Excluye los estados que ya fueron seleccionados.
   */
  readonly stateOptions = computed<Option[]>(() => {

    const selectedIds = new Set(

      this.selectedStates().map(
        (state) => state.id,
      ),

    );

    return this.states()

      .filter(
        (state) => !selectedIds.has(state.id),
      )

      .map((state) => ({

        value: String(state.id),

        label: state.nombre,

      }));
  });

  /**
   * Precargar los estados existentes.
   */
  ngOnChanges(changes: SimpleChanges): void {

    if (
      changes['initialStates'] ||
      changes['profile']
    ) {

      const uniqueStates = new Map<number, StateItem>();

      for (const state of this.initialStates()) {

        uniqueStates.set(state.id, state);
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
   * Agregar un estado.
   */
  onStateSelected(value: string): void {

    if (
      this.isSaving() ||
      this.isLoading() ||
      !this.canSave()
    ) {

      return;
    }

    const id = Number(value);

    if (!Number.isSafeInteger(id) || id <= 0) {

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
   * Retirar un estado de la selección.
   */
  removeState(id: number): void {

    if (
      this.isSaving() ||
      this.isLoading() ||
      !this.canSave()
    ) {

      return;
    }

    this.selectedStates.update(

      (current) => current.filter(
        (state) => state.id !== id,
      ),

    );
  }

  /**
   * Guardar los estados seleccionados.
   */
  onSubmit(): void {

    if (
      this.isSaving() ||
      this.isLoading() ||
      !this.canSave()
    ) {

      return;
    }

    const payload: ProfileStatesFormData = {

      estadosIds: this.selectedStates().map(
        (state) => state.id,
      ),

    };

    this.saveStates.emit(payload);
  }

}