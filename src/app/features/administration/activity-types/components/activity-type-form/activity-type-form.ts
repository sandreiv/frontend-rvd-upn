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
      minimoHoras: new FormControl<number | null>(null, {
        validators: [Validators.required, Validators.min(0)],
      }),
      maximoHoras: new FormControl<number | null>(null, {
        validators: [
          Validators.required,
          Validators.min(0),
          this.parentMaxHoursValidator(),
        ],
      }),
      estado: new FormControl(true, {
        nonNullable: true,
      }),
    },
    { validators: [hoursRangeValidator] },
  );

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['activityType'] ||
      changes['parentMaxHoras'] ||
      changes['siblingsMaxHoursSum']
    ) {
      this.patchForm();
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

    this.saveActivityType.emit({
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim(),
      componente: raw.componente,
      orden: raw.orden.trim() || null,
      idDependencia: raw.idDependencia ? Number(raw.idDependencia) : null,
      docenciaDirecta: raw.docenciaDirecta ? '1' : '0',
      horasPorSemestre: raw.horasPorSemestre ? '1' : '0',
      minimoHoras: raw.minimoHoras != null ? Number(raw.minimoHoras) : null,
      maximoHoras: raw.maximoHoras != null ? Number(raw.maximoHoras) : null,
      estado: raw.estado ? '1' : '0',
    });
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
      componente: item?.componente ?? '',
      orden: item?.orden ?? '',
      idDependencia: item?.idDependencia ? String(item.idDependencia) : '',
      docenciaDirecta: item?.docenciaDirecta === '1',
      horasPorSemestre: item?.horasPorSemestre === '1',
      minimoHoras: item?.minimoHoras != null ? Number(item.minimoHoras) : null,
      maximoHoras: item?.maximoHoras != null ? Number(item.maximoHoras) : null,
      estado: parseBooleanState(item?.estado),
    });
  }
}
