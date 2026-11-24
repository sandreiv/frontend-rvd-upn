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
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import { Select } from '../../../../../shared/components/form/select/select';
import { Button } from '../../../../../shared/ui/button/button';
import {
  NOVEDAD_ACCION_OPTIONS,
  NOVEDAD_FORPLANTA_OPTIONS,
  NovedadFormData,
  NovedadItem,
} from '../../model/novedades.model';

type NovedadFormGroup =
  FormGroup<{
    tipo: FormControl<string | null>;
    descripcion: FormControl<string | null>;
    accion: FormControl<string | null>;
    componente: FormControl<string | null>;
    forPlanta: FormControl<string | null>;
  }>;

@Component({
  selector: 'app-novedad-form',
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
    Select,
    Button,
  ],
  templateUrl: './novedad-form.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class NovedadForm
  implements OnChanges {

  item =
    input<NovedadItem | null>(null);

  isSaving = input(false);

  @Output()
  cancel =
    new EventEmitter<void>();

  @Output()
  saveItem =
    new EventEmitter<NovedadFormData>();

  readonly accionOptions =
    NOVEDAD_ACCION_OPTIONS;

  readonly forPlantaOptions =
    NOVEDAD_FORPLANTA_OPTIONS;

  readonly form: NovedadFormGroup =
    new FormGroup({
      tipo:
        new FormControl<string | null>(
          null,
          {
            validators: [
              Validators.required,
              Validators.maxLength(150),
            ],
          },
        ),

      descripcion:
        new FormControl<string | null>(
          null,
          {
            validators: [
              Validators.required,
              Validators.maxLength(250),
            ],
          },
        ),

      accion:
        new FormControl<string | null>(
          null,
          {
            validators: [
              Validators.required,
            ],
          },
        ),

      componente:
        new FormControl<string | null>(
          null,
          {
            validators: [
              Validators.required,
              Validators.maxLength(100),
            ],
          },
        ),

      forPlanta:
        new FormControl<string | null>(
          '0',
          {
            validators: [
              Validators.required,
            ],
          },
        ),
    });

  ngOnChanges(
    changes: SimpleChanges,
  ): void {

    if (changes['item']) {
      this.patchForm();
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (
      this.form.invalid ||
      this.isSaving()
    ) {
      return;
    }

    const raw =
      this.form.getRawValue();

    this.saveItem.emit({
      tipo:
        raw.tipo?.trim() ?? '',

      descripcion:
        raw.descripcion?.trim() ?? '',

      accion:
        raw.accion ?? '',

      componente:
        raw.componente?.trim() ?? '',

      forPlanta:
        raw.forPlanta === '1'
          ? '1'
          : '0',
    });
  }

  private patchForm(): void {
    const item = this.item();

    this.form.reset({
      tipo:
        item?.tipo ?? null,

      descripcion:
        item?.descripcion ?? null,

      accion:
        item?.accion?.trim() ?? null,

      componente:
        item?.componente ?? null,

      forPlanta:
        item?.forPlanta === '1'
          ? '1'
          : '0',
    });
  }
}
