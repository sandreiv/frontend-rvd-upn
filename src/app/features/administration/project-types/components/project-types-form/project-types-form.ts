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
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Button } from '../../../../../shared/ui/button/button';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import { Option, Select } from '../../../../../shared/components/form/select/select';
import {
  formatCurrencyInput,
  parseCurrencyToNumber,
} from '../../../../../shared/utils/currency.util';
import {
  PROJECT_TYPE_OPTIONS,
  ProjectTypeFormData,
  ProjectTypeItem,
} from '../../model/project-types.model';

type ProjectTypeFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  minimoParticipantes: FormControl<number | null>;
  maximoParticipantes: FormControl<number | null>;
  montoMaximo: FormControl<string>;
  minimoProductos: FormControl<number | null>;
  minimoConocimientoTi: FormControl<string>;
  tipo: FormControl<string>;
}>;

const participantsRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const minimo = Number(control.get('minimoParticipantes')?.value);
  const maximo = Number(control.get('maximoParticipantes')?.value);

  if (!Number.isFinite(minimo) || !Number.isFinite(maximo)) {
    return null;
  }

  return maximo < minimo ? { participantsRange: true } : null;
};

const currencyRequiredValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const numeric = parseCurrencyToNumber(control.value);
  return numeric == null ? { required: true } : null;
};

@Component({
  selector: 'app-project-types-form',
  imports: [ReactiveFormsModule, Label, InputField, Select, Button],
  templateUrl: './project-types-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTypesForm implements OnChanges {
  projectType = input<ProjectTypeItem | null>(null);
  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveProjectType = new EventEmitter<ProjectTypeFormData>();

  readonly typeOptions: Option[] = PROJECT_TYPE_OPTIONS;

  readonly form: ProjectTypeFormGroup = new FormGroup(
    {
      nombre: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(100)],
      }),
      descripcion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.maxLength(255)],
      }),
      minimoParticipantes: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      maximoParticipantes: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      montoMaximo: new FormControl('', {
        nonNullable: true,
        validators: [currencyRequiredValidator],
      }),
      minimoProductos: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      minimoConocimientoTi: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      tipo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: [participantsRangeValidator] },
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectType']) {
      this.patchForm();
    }
  }

  get participantsRangeInvalid(): boolean {
    return (
      this.form.hasError('participantsRange') &&
      (this.form.controls.maximoParticipantes.touched ||
        this.form.controls.maximoParticipantes.dirty)
    );
  }

  onMontoMaximoFocus(): void {
    const numeric = parseCurrencyToNumber(
      this.form.controls.montoMaximo.value,
    );
    this.form.controls.montoMaximo.setValue(
      numeric == null ? '' : String(numeric),
      { emitEvent: false },
    );
  }

  onMontoMaximoBlur(): void {
    const formatted = formatCurrencyInput(
      this.form.controls.montoMaximo.value,
    );
    this.form.controls.montoMaximo.setValue(formatted, { emitEvent: false });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    this.onMontoMaximoBlur();

    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const raw = this.form.getRawValue();
    const montoMaximo = parseCurrencyToNumber(raw.montoMaximo);

    this.saveProjectType.emit({
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim(),
      minimoParticipantes: String(raw.minimoParticipantes),
      maximoParticipantes: String(raw.maximoParticipantes),
      montoMaximo: String(montoMaximo ?? 0),
      minimoProductos: String(raw.minimoProductos),
      minimoConocimientoTi: raw.minimoConocimientoTi.trim(),
      tipo: raw.tipo,
    });
  }

  private patchForm(): void {
    const item = this.projectType();

    this.form.reset({
      nombre: item?.nombre ?? '',
      descripcion: item?.descripcion ?? '',
      minimoParticipantes: this.toNumberOrNull(item?.minimoParticipantes),
      maximoParticipantes: this.toNumberOrNull(item?.maximoParticipantes),
      montoMaximo: formatCurrencyInput(item?.montoMaximo),
      minimoProductos: this.toNumberOrNull(item?.minimoProductos),
      minimoConocimientoTi: item?.minimoConocimientoTi ?? '',
      tipo: item?.tipo != null ? String(item.tipo) : '',
    });
  }

  private toNumberOrNull(value: string | null | undefined): number | null {
    if (value == null || value === '') {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
}
