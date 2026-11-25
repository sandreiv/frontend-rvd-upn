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
import { Button } from '../../../../../shared/ui/button/button';
import {
  NOVEDAD_MAX_LENGTH,
  NovedadFormData,
  NovedadItem,
} from '../../model/novedades.model';

type NovedadFormGroup =
  FormGroup<{
    tipo: FormControl<string | null>;
    descripcion: FormControl<string | null>;
  }>;

@Component({
  selector: 'app-novedad-form',
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
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

  readonly maxLength =
    NOVEDAD_MAX_LENGTH;

  readonly form: NovedadFormGroup =
    new FormGroup({
      tipo:
        new FormControl<string | null>(
          null,
          {
            validators: [
              Validators.required,
              Validators.maxLength(
                NOVEDAD_MAX_LENGTH,
              ),
            ],
          },
        ),

      descripcion:
        new FormControl<string | null>(
          null,
          {
            validators: [
              Validators.required,
              Validators.maxLength(
                NOVEDAD_MAX_LENGTH,
              ),
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
    });
  }

  private patchForm(): void {
    const item = this.item();

    this.form.reset({
      tipo:
        item?.tipo ?? null,

      descripcion:
        item?.descripcion ?? null,
    });
  }
}
