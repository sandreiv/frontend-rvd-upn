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
  PointsValidityFormData,
  PointsValidityItem,
} from '../../model/points-validity.model';

type PointsValidityFormGroup =
  FormGroup<{
    anio: FormControl<number | null>;
    valorPunto:
      FormControl<number | null>;
  }>;

@Component({
  selector: 'app-points-validity-form',
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
    Button,
  ],
  templateUrl:
    './points-validity-form.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class PointsValidityForm
  implements OnChanges {

  item =
    input<PointsValidityItem | null>(
      null,
    );

  isSaving = input(false);

  @Output()
  cancel =
    new EventEmitter<void>();

  @Output()
  saveItem =
    new EventEmitter<PointsValidityFormData>();

  readonly form:
    PointsValidityFormGroup =
      new FormGroup({
        anio:
          new FormControl<number | null>(
            null,
            {
              validators: [
                Validators.required,
                Validators.min(1),
              ],
            },
          ),

        valorPunto:
          new FormControl<number | null>(
            null,
            {
              validators: [
                Validators.required,
                Validators.min(0.01),
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
      anio:
        Number(raw.anio),

      valorPunto:
        String(raw.valorPunto),
    });
  }

  private patchForm(): void {
    const item = this.item();

    const valorPunto =
      item?.valorPunto != null
        ? Number(item.valorPunto)
        : null;

    this.form.reset({
      anio:
        item?.anio ?? null,

      valorPunto:
        Number.isFinite(valorPunto)
          ? valorPunto
          : null,
    });
  }
}