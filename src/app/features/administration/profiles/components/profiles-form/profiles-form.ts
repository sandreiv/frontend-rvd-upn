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
  ProfileFormData,
  ProfileItem,
} from '../../model/profiles.model';

import { Checkbox } from '../../../../../shared/components/form/input/checkbox';

@Component({
  selector: 'app-profiles-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
    Checkbox,
    Button,
  ],
  templateUrl: './profiles-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilesForm implements OnChanges {

  profile = input<ProfileItem | null>(null);

  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();

  @Output() saveProfile =
    new EventEmitter<ProfileFormData>();

  /**
   * Formulario reactivo.
   */
  readonly form = new FormGroup({

    nombre: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(150),
      ],
    }),

    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.required,
        Validators.pattern(/\S/),
        Validators.maxLength(150),
      ],
    }),

    proceso: new FormControl(
        { value: '', disabled: true },
        {
            nonNullable: true,
            validators: [
            Validators.maxLength(500),
            ],
        },
    ),

    esProceso: new FormControl(false, {
        nonNullable: true,
    }),

    codigo: new FormControl('', {
      nonNullable: true,
      validators: [
        Validators.maxLength(30),
      ],
    }),

  });

  ngOnChanges(changes: SimpleChanges): void {

    if (changes['profile']) {

      this.patchForm();
    }
  }

  /**
   * Cargar la información del perfil cuando
   * se ingresa en modo edición.
   */
  private patchForm(): void {

    const item = this.profile();

    const esProceso = item?.esProceso === '1';

    this.form.reset({

        nombre: item?.nombre ?? '',

        descripcion: item?.descripcion ?? '',

        proceso: {
        value: item?.proceso ?? '',
        disabled: !esProceso,
        },

        esProceso: esProceso,

        codigo: item?.codigo ?? '',

    });

   }

  /**
   * Validar y emitir los datos del formulario.
   */
  onSubmit(): void {

    if (this.form.invalid || this.isSaving()) {

      this.form.markAllAsTouched();

      return;
    }

    const payload: ProfileFormData = {

      nombre:
        this.form.controls.nombre.value.trim(),

      descripcion:
        this.form.controls.descripcion.value.trim(),

      proceso:
        this.form.controls.esProceso.value
            ? this.form.controls.proceso.value.trim()
            : '',

      esProceso:
        this.form.controls.esProceso.value ? '1' : '0',

      codigo:
        this.form.controls.codigo.value.trim(),

    };

    this.saveProfile.emit(payload);
  }
  
  /**
     * Habilitar o deshabilitar el campo Proceso.
     */
   onEsProcesoChange(checked: boolean): void {

    this.form.controls.esProceso.setValue(checked);

    if (checked) {

        this.form.controls.proceso.enable({
        emitEvent: false,
        });

    } else {

        this.form.controls.proceso.disable({
        emitEvent: false,
        });

    }

  }

}