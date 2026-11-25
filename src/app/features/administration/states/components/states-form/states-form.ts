import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnChanges,
  Output,
  SimpleChanges,
  input,
} from '@angular/core';

import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { Label } from '../../../../../shared/components/form/label/label';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Button } from '../../../../../shared/ui/button/button';

import {
  StateFormData,
  StateItem,
} from '../../model/states.model';

@Component({
  selector: 'app-states-form',
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
    Button,
  ],
  templateUrl: './states-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatesForm implements OnChanges {

  state = input<StateItem | null>(null);

  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();

  @Output() saveState =
    new EventEmitter<StateFormData>();

  readonly form = new FormGroup({

    nombre: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
      ],
    }),

    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
      ],
    }),

    tipo: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(30),
      ],
    }),

    orden: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(30),
      ],
    }),

  });

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['state']) {
      this.patchForm();
    }
  }

  private patchForm(): void {

    const item = this.state();

    this.form.reset({
      nombre: item?.nombre ?? '',
      descripcion: item?.descripcion ?? '',
      tipo: item?.tipo ?? '',
      orden: item?.orden ?? '',
    });
  }

  onSubmit(): void {

    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: StateFormData = {
      nombre: this.form.controls.nombre.value.trim(),
      descripcion: this.form.controls.descripcion.value.trim(),
      tipo: this.form.controls.tipo.value.trim(),
      orden: this.form.controls.orden.value.trim(),
    };

    this.saveState.emit(payload);
  }
}