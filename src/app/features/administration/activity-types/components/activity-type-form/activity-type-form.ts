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
import { TreeSelect } from '../../../../../shared/components/form/tree-select/tree-select';
import {
  ACTIVITY_TYPE_COMPONENTE_OPTIONS,
  ActivityTypeFormData,
  ActivityTypeItem,
} from '../../model/activity-types.model';

type ActivityTypeFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  componente: FormControl<string | null>;
  orden: FormControl<string>;
  idDependencia: FormControl<string | null>;
  docenciaDirecta: FormControl<boolean>;
  horasPorSemestre: FormControl<boolean>;
  aplicaProyectos: FormControl<boolean>;
  minimoHoras: FormControl<number | null>;
  maximoHoras: FormControl<number | null>;
  estado: FormControl<boolean>;
}>;

const hoursRangeValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const minimo = Number(control.get('minimoHoras')?.value);
  const maximo = Number(control.get('maximoHoras')?.value);

  if (!Number.isFinite(minimo) || !Number.isFinite(maximo)) {
    return null;
  }

  return maximo < minimo ? { hoursRange: true } : null;
};

/**
 * Obtiene recursivamente todos los identificadores de los nodos descendientes (hijos, nietos, etc.)
 */
function getDescendantIds(
  items: ActivityTypeItem[],
  rootId: number,
): Set<number> {
  const descendantIds = new Set<number>();
  const queue = [rootId];

  while (queue.length > 0) {
    const parentId = queue.shift()!;
    for (const item of items) {
      if (item.idPadre === parentId && !descendantIds.has(item.id)) {
        descendantIds.add(item.id);
        queue.push(item.id);
      }
    }
  }

  return descendantIds;
}

function parseBooleanState(value: unknown): boolean {
  if (value == null || value === '') {
    return true;
  }
  const normalized = String(value).trim().toUpperCase();
  return normalized === '1' || normalized === 'ACTIVO' || normalized === 'A';
}

@Component({
  selector: 'app-activity-type-form',
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
    Select,
    TreeSelect,
    Checkbox,
    Button,
  ],
  templateUrl: './activity-type-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTypeForm implements OnChanges {
  readonly activityType = input<ActivityTypeItem | null>(null);
  readonly allActivityTypes = input<ActivityTypeItem[]>([]);
  readonly isSaving = input(false);
  readonly title = input('Nuevo tipo de actividad');
  readonly editTitle = input('Editar tipo de actividad');
  readonly description = input(
    'Registra o modifica la información del tipo de actividad.',
  );
  readonly parentMinHoras = input<number | null>(null);
  readonly parentMaxHoras = input<number | null>(null);
  readonly siblingsMaxHoursSum = input(0);

  @Output() readonly cancel = new EventEmitter<void>();
  @Output() readonly saveActivityType = new EventEmitter<ActivityTypeFormData>();

  readonly componenteOptions: Option[] = ACTIVITY_TYPE_COMPONENTE_OPTIONS;

  readonly dependencyTreeItems = computed(() => {
    const currentItem = this.activityType();
    const currentId = currentItem?.id ?? null;
    const all = this.allActivityTypes();

    const blockedIds =
      currentId != null
        ? getDescendantIds(all, currentId).add(currentId)
        : new Set<number>();

    return all.map((item) => {
      const isCurrent = currentId != null && item.id === currentId;
      const isDescendant =
        currentId != null && blockedIds.has(item.id) && !isCurrent;
      const isBlocked = isCurrent || isDescendant;

      let nombre = item.orden ? `${item.orden}. ${item.nombre}` : item.nombre;
      if (isCurrent) {
        nombre += ' (Actividad actual)';
      } else if (isDescendant) {
        nombre += ' (Subactividad)';
      }

      return {
        id: String(item.id),
        idPadre: item.idPadre ? String(item.idPadre) : null,
        nombre,
        disabled: isBlocked,
        esSeleccionable: !isBlocked,
      };
    });
  });

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
      componente: new FormControl<string | null>(null, {
        validators: [Validators.required],
      }),
      orden: new FormControl('', {
        nonNullable: true,
      }),
      idDependencia: new FormControl<string | null>(''),
      docenciaDirecta: new FormControl(false, {
        nonNullable: true,
      }),
      horasPorSemestre: new FormControl(false, {
        nonNullable: true,
      }),
      aplicaProyectos: new FormControl(false, {
        nonNullable: true,
      }),
      minimoHoras: new FormControl<number | null>(null, {
        validators: [Validators.min(0)],
      }),
      maximoHoras: new FormControl<number | null>(null, {
        validators: [Validators.min(0)],
      }),
      estado: new FormControl(true, {
        nonNullable: true,
      }),
    },
    { validators: [this.childParentRangeValidator()] },
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activityType'] || changes['parentMinHoras'] || changes['parentMaxHoras'] || changes['siblingsMaxHoursSum']) {
      this.patchForm();
      this.form.updateValueAndValidity({
        emitEvent: false,
      });
    }
  }

  get hoursRangeInvalid(): boolean {
    return (
      this.form.hasError('hoursRange') &&
      ((this.form.controls.minimoHoras.touched && this.form.controls.maximoHoras.touched) ||
        this.form.controls.minimoHoras.dirty ||
        this.form.controls.maximoHoras.dirty)
    );
  }

  get childMinAboveParentMax(): boolean {
    return (
      this.form.hasError('childMinAboveParentMax') &&
      (this.form.controls.minimoHoras.touched || this.form.controls.minimoHoras.dirty)
    );
  }

  get childMaxAboveParentMax(): boolean {
    return (
      this.form.hasError('childMaxAboveParentMax') &&
      (this.form.controls.maximoHoras.touched || this.form.controls.maximoHoras.dirty)
    );
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const raw = this.form.getRawValue();

    const min =
      raw.minimoHoras != null && String(raw.minimoHoras).trim() !== ''
        ? (Number(raw.minimoHoras) > 0 ? Number(raw.minimoHoras) : null)
        : null;
    const max =
      raw.maximoHoras != null && String(raw.maximoHoras).trim() !== ''
        ? (Number(raw.maximoHoras) > 0 ? Number(raw.maximoHoras) : null)
        : null;

    this.saveActivityType.emit({
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim(),
      componente: raw.componente,
      orden: raw.orden.trim() || null,
      idDependencia: raw.idDependencia ? Number(raw.idDependencia) : null,
      docenciaDirecta: raw.docenciaDirecta ? '1' : '0',
      horasPorSemestre: raw.horasPorSemestre ? '1' : '0',
      aplicaProyectos: raw.aplicaProyectos ? '1' : '0',
      minimoHoras: min,
      maximoHoras: max,
      estado: raw.estado ? '1' : '0',
    });
  }

  private childParentRangeValidator(): ValidatorFn {
    return (formGroup: AbstractControl): ValidationErrors | null => {
      const minControl = formGroup.get('minimoHoras');
      const maxControl = formGroup.get('maximoHoras');

      const minRaw = minControl?.value;
      const maxRaw = maxControl?.value;

      const minVal =
        minRaw != null && String(minRaw).trim() !== '' ? Number(minRaw) : null;
      const maxVal =
        maxRaw != null && String(maxRaw).trim() !== '' ? Number(maxRaw) : null;

      const pMax = this.parentMaxHoras();

      const errors: Record<string, any> = {};

      if (minVal != null && Number.isFinite(minVal) && minVal > 0) {
        if (pMax != null && pMax > 0 && minVal > pMax) {
          errors['childMinAboveParentMax'] = { parentMax: pMax, value: minVal };
        }
      }

      if (maxVal != null && Number.isFinite(maxVal) && maxVal > 0) {
        if (pMax != null && pMax > 0 && maxVal > pMax) {
          errors['childMaxAboveParentMax'] = { parentMax: pMax, value: maxVal };
        }
      }

      if (
        minVal != null &&
        maxVal != null &&
        Number.isFinite(minVal) &&
        Number.isFinite(maxVal) &&
        minVal > 0 &&
        maxVal > 0
      ) {
        if (maxVal < minVal) {
          errors['hoursRange'] = true;
        }
      }

      return Object.keys(errors).length > 0 ? errors : null;
    };
  }

  private patchForm(): void {
    const item = this.activityType();

    const min =
      item?.minimoHoras != null && Number(item.minimoHoras) > 0
        ? Number(item.minimoHoras)
        : null;
    const max =
      item?.maximoHoras != null && Number(item.maximoHoras) > 0
        ? Number(item.maximoHoras)
        : null;

    this.form.reset({
      nombre: item?.nombre ?? '',
      descripcion: item?.descripcion ?? '',
      componente: item?.componente ?? '',
      orden: item?.orden ?? '',
      idDependencia: item?.idDependencia ? String(item.idDependencia) : '',
      docenciaDirecta: item?.docenciaDirecta === '1',
      horasPorSemestre: item?.horasPorSemestre === '1',
      aplicaProyectos: item?.aplicaProyectos === '1',
      minimoHoras: min,
      maximoHoras: max,
      estado: parseBooleanState(item?.estado),
    });
  }
}
