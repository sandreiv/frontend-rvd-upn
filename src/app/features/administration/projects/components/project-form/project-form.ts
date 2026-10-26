import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  computed,
  inject,
  input,
  signal,
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  firstValueFrom,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { Button } from '../../../../../shared/ui/button/button';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import {
  Option,
  Select,
} from '../../../../../shared/components/form/select/select';
import { DateRangePicker } from '../../../../../shared/components/form/date-range-picker/date-range-picker';
import {
  TypeaheadOption,
  TypeaheadSelect,
} from '../../../../../shared/components/form/typeahead-select/typeahead-select';
import {
  formatCurrencyInput,
  formatCurrencyValue,
  parseCurrencyToNumber,
} from '../../../../../shared/utils/currency.util';
import { ProjectCallsService } from '../../../project-calls/data/project-calls.service';
import { ProjectTypesService } from '../../../project-types/data/project-types.service';
import { ProjectTypeItem } from '../../../project-types/model/project-types.model';
import { PreloadCallService } from '../../../../configuration/preload-call/data/preload-call.service';
import {
  ProjectFormData,
  ProjectItem,
  resolveProjectTypeLimits,
  toDateOnly,
} from '../../model/projects.model';

interface CoordinationOption {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

type ProjectFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  monto: FormControl<string>;
  fechaInicio: FormControl<string>;
  fechaFin: FormControl<string>;
  idConvocatoriaProyectos: FormControl<string>;
  idTipoProyecto: FormControl<string>;
  idCoordinacion: FormControl<string>;
}>;

@Component({
  selector: 'app-project-form',
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
    Select,
    Button,
    DateRangePicker,
    TypeaheadSelect,
  ],
  templateUrl: './project-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectForm implements OnInit, OnChanges {
  private readonly projectCallsService = inject(ProjectCallsService);
  private readonly projectTypesService = inject(ProjectTypesService);
  private readonly preloadCallService = inject(PreloadCallService);
  private readonly searchTerm$ = new Subject<string>();

  project = input<ProjectItem | null>(null);
  isSaving = input(false);
  title = input('Nuevo proyecto');
  editTitle = input('Editar proyecto');
  description = input('Registra la información básica del proyecto.');
  parentProjectId = input<number | null>(null);
  parentProjectCallId = input<number | null>(null);
  parentProjectTypeId = input<number | null>(null);
  parentCoordinationId = input<number | null>(null);
  parentCoordinationName = input('');
  parentStartDate = input<string | null>(null);
  parentEndDate = input<string | null>(null);

  readonly isProductMode = computed(
    () => this.parentProjectId() != null,
  );

  @Output() cancel = new EventEmitter<void>();
  @Output() saveProject = new EventEmitter<ProjectFormData>();

  readonly convocatoriaOptions = signal<Option[]>([]);
  readonly tipoProyectoOptions = signal<Option[]>([]);
  readonly projectTypes = signal<ProjectTypeItem[]>([]);
  readonly selectedProjectType = signal<ProjectTypeItem | null>(null);
  readonly filteredCoordinations = signal<CoordinationOption[]>([]);

  readonly selectedTypeLimits = computed(() =>
    resolveProjectTypeLimits(this.selectedProjectType()),
  );

  readonly montoMaximoLabel = computed(() => {
    const max = this.selectedTypeLimits().montoMaximo;
    if (max == null) {
      return '';
    }
    return formatCurrencyValue(max);
  });

  readonly form: ProjectFormGroup = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(500)],
    }),
    monto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, this.montoMaximoValidator()],
    }),
    fechaInicio: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    fechaFin: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idConvocatoriaProyectos: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idTipoProyecto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idCoordinacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) =>
          this.preloadCallService
            .searchCoordination(term)
            .pipe(catchError(() => of([] as CoordinationOption[]))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((rows) => this.filteredCoordinations.set(rows.slice(0, 20)));

    this.form.controls.idTipoProyecto.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((id) => this.onTipoProyectoChange(id));

    this.form.controls.monto.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.form.controls.monto.updateValueAndValidity({
          emitEvent: false,
        });
      });
  }

  async ngOnInit(): Promise<void> {
    await this.loadSelectOptions();
    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['project'] ||
      changes['parentProjectId'] ||
      changes['parentProjectCallId'] ||
      changes['parentProjectTypeId'] ||
      changes['parentCoordinationId'] ||
      changes['parentCoordinationName'] ||
      changes['parentStartDate'] ||
      changes['parentEndDate'] 
    ) {
      this.patchForm();
    }
  }

  get montoMaximoInvalid(): boolean {
    const control = this.form.controls.monto;
    return (
      control.hasError('montoMaximo') && (control.touched || control.dirty)
    );
  }

  readonly coordinationOptionAdapter = (item: unknown): TypeaheadOption => {
    const option = item as CoordinationOption;
    return {
      value: String(option.id),
      label: option.nombre,
      data: option,
    };
  };

  onSearchCoordination(term: string): void {
    if (this.isProductMode()) {
      return;
    }

    const normalized = term.trim();

    if (normalized.length < 2) {
      this.filteredCoordinations.set([]);
      return;
    }

    this.searchTerm$.next(normalized);
  }

  onMontoFocus(): void {
    const numeric = parseCurrencyToNumber(this.form.controls.monto.value);
    this.form.controls.monto.setValue(
      numeric == null ? '' : String(numeric),
      { emitEvent: false },
    );
  }

  onMontoBlur(): void {
    this.form.controls.monto.setValue(
      formatCurrencyInput(this.form.controls.monto.value),
      { emitEvent: false },
    );
    this.form.controls.monto.updateValueAndValidity({ emitEvent: false });
  }

  onSubmit(): void {
    this.form.markAllAsTouched();
    this.onMontoBlur();

    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const raw = this.form.getRawValue();
    const monto = parseCurrencyToNumber(raw.monto);
    const parentId = this.parentProjectId();

    this.saveProject.emit({
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim(),
      monto: String(monto ?? 0),
      fechaInicio: raw.fechaInicio,
      fechaFin: raw.fechaFin,
      idConvocatoriaProyectos: Number(raw.idConvocatoriaProyectos),
      idTipoProyecto: Number(raw.idTipoProyecto),
      idCoordinacion: Number(raw.idCoordinacion),
      idProyectoPadre: parentId,
    });
  }

  private montoMaximoValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const monto = parseCurrencyToNumber(control.value);
      const max = this.selectedTypeLimits().montoMaximo;

      if (monto == null || max == null) {
        return null;
      }

      return monto > max ? { montoMaximo: { max, actual: monto } } : null;
    };
  }

  private onTipoProyectoChange(id: string): void {
    const type =
      this.projectTypes().find((item) => String(item.id) === id) ?? null;
    this.selectedProjectType.set(type);
    this.form.controls.monto.updateValueAndValidity({ emitEvent: false });
  }

  private async loadSelectOptions(): Promise<void> {
    try {
      const [calls, types] = await Promise.all([
        firstValueFrom(this.projectCallsService.listProjectCalls()),
        firstValueFrom(this.projectTypesService.listProjectTypes()),
      ]);

      this.projectTypes.set(types ?? []);
      this.convocatoriaOptions.set(
        (calls ?? []).map((item) => ({
          value: String(item.id),
          label: item.nombre?.trim() || String(item.id),
        })),
      );
      this.tipoProyectoOptions.set(
        (types ?? []).map((item) => ({
          value: String(item.id),
          label: item.nombre?.trim() || String(item.id),
        })),
      );
    } catch (error) {
      console.error(error);
      this.projectTypes.set([]);
      this.convocatoriaOptions.set([]);
      this.tipoProyectoOptions.set([]);
    }
  }

  private ensureSelectedCoordination(
    idCoordinacion: number | null | undefined,
    nombreCoordinacion: string | null | undefined,
  ): void {
    if (idCoordinacion == null) {
      return;
    }

    const id = String(idCoordinacion);
    const rows = this.filteredCoordinations();

    if (rows.some((row) => String(row.id) === id)) {
      return;
    }

    this.filteredCoordinations.set([
      ...rows,
      {
        id: idCoordinacion,
        nombre: nombreCoordinacion?.trim() || id,
      },
    ]);
  }

  private patchForm(): void {
    const item = this.project();
    const productMode = this.isProductMode();

    const projectCallId = productMode
      ? this.parentProjectCallId()
      : item?.idConvocatoriaProyectos;

    const projectTypeId = productMode
      ? this.parentProjectTypeId()
      : item?.idTipoProyecto;

    const coordinationId = productMode
      ? this.parentCoordinationId()
      : item?.idCoordinacion;
      
    const startDate = productMode
      ? this.parentStartDate()
      : item?.fechaInicio;

    const endDate = productMode
      ? this.parentEndDate()
      : item?.fechaFin;  



    console.log('DEBUG FECHAS PRODUCTO', {
  productMode,
  parentStartDate: this.parentStartDate(),
  parentEndDate: this.parentEndDate(),
  startDate,
  endDate,
  startDateNormalized: toDateOnly(startDate),
  endDateNormalized: toDateOnly(endDate),
});






    const coordinationName = productMode
      ? this.parentCoordinationName()
      : item?.coordinacion?.nombre;

    const tipoId =
      projectTypeId != null
        ? String(projectTypeId)
        : '';

    this.ensureSelectedCoordination(
      coordinationId,
      coordinationName,
    );

    this.form.reset({
      nombre: item?.nombre ?? '',
      descripcion: item?.descripcion ?? '',
      monto: formatCurrencyInput(item?.monto),
      fechaInicio: toDateOnly(startDate),
      fechaFin: toDateOnly(endDate),

      idConvocatoriaProyectos:
        projectCallId != null
          ? String(projectCallId)
          : '',

      idTipoProyecto: tipoId,

      idCoordinacion:
        coordinationId != null
          ? String(coordinationId)
          : '',
    });

    this.onTipoProyectoChange(tipoId);
  }
}
