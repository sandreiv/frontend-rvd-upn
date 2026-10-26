import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
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
import { Checkbox } from '../../../../../shared/components/form/input/checkbox';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import { Option, Select } from '../../../../../shared/components/form/select/select';
import {
  ACTIVITY_TYPE_CODE_OPTIONS,
  ACTIVITY_TYPE_COMPONENTE_OPTIONS,
  ActivityTypeFormData,
  ActivityTypeItem,
} from '../../model/activity-types.model';

type ActivityTypeFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  codigo: FormControl<string>;
  componente: FormControl<string | null>;
  minimoHoras: FormControl<number | null>;
  maximoHoras: FormControl<number | null>;
  ptd: FormControl<boolean>;
  estado: FormControl<boolean>;
}>;

const hoursRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  if (control.get('ptd')?.value === true) {
    return null;
  }

  const minimo = Number(control.get('minimoHoras')?.value);
  const maximo = Number(control.get('maximoHoras')?.value);

  if (!Number.isFinite(minimo) || !Number.isFinite(maximo)) {
    return null;
  }

  return maximo <= minimo ? { hoursRange: true } : null;
};

@Component({
  selector: 'app-activity-type-form',
  imports: [ReactiveFormsModule, Label, InputField, Select, Checkbox, Button],
  templateUrl: './activity-type-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTypeForm implements OnChanges {
  activityType = input<ActivityTypeItem | null>(null);
  isSaving = input(false);
  title = input('Nuevo tipo de actividad');
  editTitle = input('Editar tipo de actividad');
  description = input(
    'Registra actividades padre. El orden se calculará automáticamente.',
  );
  parentMinHoras = input<number | null>(null);
  parentMaxHoras = input<number | null>(null);
  siblingsMaxHoursSum = input(0);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveActivityType = new EventEmitter<ActivityTypeFormData>();

  readonly codeOptions: Option[] = ACTIVITY_TYPE_CODE_OPTIONS;
  readonly componenteOptions: Option[] = ACTIVITY_TYPE_COMPONENTE_OPTIONS;

  readonly remainingParentHours = computed(() => {
    const parentMax = this.parentMaxHoras();
    if (parentMax == null) {
      return null;
    }

    return Math.max(parentMax - this.siblingsMaxHoursSum(), 0);
  });

  readonly form: ActivityTypeFormGroup = new FormGroup(
    {
      nombre: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      descripcion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      codigo: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      componente: new FormControl<string | null>(null, {
        validators: [Validators.required],
      }),
      minimoHoras: new FormControl<number | null>(null, {
        validators: [Validators.required],
      }),
      maximoHoras: new FormControl<number | null>(null, {
        validators: [Validators.required, this.parentMaxHoursValidator()],
      }),
      ptd: new FormControl(false, {
        nonNullable: true,
      }),
      estado: new FormControl(true, {
        nonNullable: true,
      }),
    },
    { validators: [hoursRangeValidator] },
  );

  constructor() {
    this.form.controls.ptd.valueChanges.subscribe(() => this.updatePtdValidations());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['activityType'] ||
      changes['parentMaxHoras'] ||
      changes['siblingsMaxHoursSum']
    ) {
      this.patchForm();
      this.updatePtdValidations();
      this.form.controls.maximoHoras.updateValueAndValidity({
        emitEvent: false,
      });
    }
  }

  get hoursRangeInvalid(): boolean {
    return (
      this.form.hasError('hoursRange') &&
      (this.form.controls.maximoHoras.touched ||
        this.form.controls.maximoHoras.dirty)
    );
  }

  get parentMaxHoursInvalid(): boolean {
    const control = this.form.controls.maximoHoras;
    return (
      control.hasError('parentMaxHours') &&
      (control.touched || control.dirty)
    );
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const raw = this.form.getRawValue();
    const esPtd = raw.ptd;

    this.saveActivityType.emit({
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim(),
      codigo: raw.codigo,
      componente: esPtd ? null : raw.componente,
      minimoHoras: esPtd ? null : Number(raw.minimoHoras),
      maximoHoras: esPtd ? null : Number(raw.maximoHoras),
      ptd: raw.ptd ? '1' : '0',
      estado: raw.estado ? '1' : '0',
    });
  }

  private updatePtdValidations(): void {
    const { componente, minimoHoras, maximoHoras, ptd } = this.form.controls;

    if (ptd.value) {
      componente.clearValidators();
      minimoHoras.clearValidators();
      maximoHoras.clearValidators();
    } else {
      componente.setValidators([Validators.required]);
      minimoHoras.setValidators([Validators.required]);
      maximoHoras.setValidators([Validators.required, this.parentMaxHoursValidator()]);
    }

    componente.updateValueAndValidity({ emitEvent: false });
    minimoHoras.updateValueAndValidity({ emitEvent: false });
    maximoHoras.updateValueAndValidity({ emitEvent: false });

    this.form.updateValueAndValidity({ emitEvent: false });
  }

  private parentMaxHoursValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const parentMax = this.parentMaxHoras();
      if (parentMax == null) {
        return null;
      }

      const maximo = Number(control.value);
      if (!Number.isFinite(maximo)) {
        return null;
      }

      const total = this.siblingsMaxHoursSum() + maximo;
      return total > parentMax
        ? {
            parentMaxHours: {
              parentMax,
              remaining: Math.max(parentMax - this.siblingsMaxHoursSum(), 0),
              total,
            },
          }
        : null;
    };
  }

  private patchForm(): void {
    const item = this.activityType();

    this.form.reset({
      nombre: item?.nombre ?? '',
      descripcion: item?.descripcion ?? '',
      codigo: item?.codigo ?? '',
      componente: item?.componente ?? '',
      minimoHoras: item?.minimoHoras != null ? Number(item.minimoHoras) : null,
      maximoHoras: item?.maximoHoras != null ? Number(item.maximoHoras) : null,
      ptd: this.isPtdEnabled(item?.ptd),
      estado: this.isActive(item?.estado),
    });
  }

  private isActive(value: ActivityTypeItem['estado'] | undefined): boolean {
    if (value == null || value === '') {
      return true;
    }

    const normalized = String(value).trim().toUpperCase();

    return normalized === '1' || normalized === 'ACTIVO' || normalized === 'A';
  }

  private isPtdEnabled(
    value: ActivityTypeItem['ptd'] | undefined,
  ): boolean {
    if (value == null || value === '') {
      return false;
    }

    const normalized =
      String(value).trim().toUpperCase();

    return (
      normalized === '1' ||
      normalized === 'S' ||
      normalized === 'SI' ||
      normalized === 'SÍ' ||
      normalized === 'TRUE'
    );
  }
}
