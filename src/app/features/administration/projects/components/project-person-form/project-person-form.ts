/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Adaptación para esquema general con Tipo de Actividades y Docentes
 * 10/11/2026 - Leonel Antonio Perez Rios - Búsqueda de personas conectada al servicio de proyectos y remoción de tipo de actividad
 * 10/11/2026 - Leonel Antonio Perez Rios - Limpieza de código, validación de horas y remoción de límites inexistentes
 * 13/11/2026 - Inclusión de función en el proyecto y selector de centro de costo
 */
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
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
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
import {
  TypeaheadOption,
  TypeaheadSelect,
} from '../../../../../shared/components/form/typeahead-select/typeahead-select';
import { ProjectsService } from '../../data/projects.service';
import { PersonaAutorizaConvocatoriaItem } from '../../../../configuration/preload-call/model/preload-call.model';
import {
  CostCenterOption,
  ParticipantFunctionOption,
  ProjectPersonFormData,
  ProjectPersonItem,
} from '../../model/projects.model';
import { Checkbox } from '../../../../../shared/components/form/input/checkbox';

const OBSERVACION_MAX_LENGTH = 255;
const SEARCH_DEBOUNCE_TIME = 300;
const MIN_SEARCH_CHARS = 2;
const MIN_HORAS = 1;
const MAX_HORAS = 40;
const MAX_SEARCH_RESULTS = 20;

type ProjectPersonFormGroup = FormGroup<{
  idPersonaGeneral: FormControl<string>;
  funcion: FormControl<string>;
  idCentroCosto: FormControl<string>;
  horas: FormControl<number | null>;
  observacion: FormControl<string>;
  esActivo: FormControl<boolean>;
}>;

@Component({
  selector: 'app-project-person-form',
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
    Button,
    Select,
    TypeaheadSelect,
    Checkbox,
  ],
  templateUrl: './project-person-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPersonForm implements OnInit, OnChanges {
  private readonly projectsService = inject(ProjectsService);
  private readonly searchTerm$ = new Subject<string>();

  person = input<ProjectPersonItem | null>(null);
  projectId = input<number>(0);
  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() savePerson = new EventEmitter<ProjectPersonFormData>();

  readonly filteredPeople = signal<PersonaAutorizaConvocatoriaItem[]>([]);
  readonly allCostCenters = signal<CostCenterOption[]>([]);
  readonly filteredCostCenters = signal<CostCenterOption[]>([]);
  readonly isCreateMode = computed(() => this.person() == null);

  readonly participantFunctionOptions = signal<Option[]>([]);

  readonly form: ProjectPersonFormGroup = new FormGroup({
    idPersonaGeneral: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    funcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idCentroCosto: new FormControl('', {
      nonNullable: true,
    }),
    horas: new FormControl<number | null>(null, {
      validators: [
        Validators.required,
        Validators.min(MIN_HORAS),
        Validators.max(MAX_HORAS),
      ],
    }),
    observacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(OBSERVACION_MAX_LENGTH)],
    }),
    esActivo: new FormControl(true, {
      nonNullable: true,
    }),
  });

  readonly horas = toSignal(this.form.controls.horas.valueChanges, {
    initialValue: null,
  });

  readonly horasValidation = computed(() => {
    const horas = this.horas();

    if (horas == null) {
      return {
        valid: false,
        bajoMinimo: false,
        sobreMaximo: false,
        minimo: MIN_HORAS,
        maximo: MAX_HORAS,
      };
    }

    return {
      valid: horas >= MIN_HORAS && horas <= MAX_HORAS,
      bajoMinimo: horas < MIN_HORAS,
      sobreMaximo: horas > MAX_HORAS,
      minimo: MIN_HORAS,
      maximo: MAX_HORAS,
    };
  });

  constructor() {
    this.searchTerm$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_TIME),
        distinctUntilChanged(),
        switchMap((term) =>
          this.projectsService
            .searchPersons(term)
            .pipe(catchError(() => of([] as PersonaAutorizaConvocatoriaItem[]))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((rows) =>
        this.filteredPeople.set(rows.slice(0, MAX_SEARCH_RESULTS)),
      );
  }

  ngOnInit(): void {
    this.loadParticipantFunctions();
    this.loadCostCenters();
    this.ensureSelectedPerson();
    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['person']) {
      this.ensureSelectedPerson();
      this.ensureSelectedCostCenter();
      this.patchForm();
    }
  }

  readonly personOptionAdapter = (item: unknown): TypeaheadOption => {
    const person = item as PersonaAutorizaConvocatoriaItem;
    return {
      value: String(person.id),
      label: person.nombreCompleto,
      secondaryLabel: person.documentoIdentidad,
      data: person,
    };
  };

  readonly costCenterOptionAdapter = (item: unknown): TypeaheadOption => {
    const ceco = item as CostCenterOption;
    return {
      value: String(ceco.id),
      label: `${ceco.codigo} - ${ceco.nombre}`,
      data: ceco,
    };
  };

  onSearchPerson(term: string): void {
    const normalized = term.trim();
    if (normalized.length < MIN_SEARCH_CHARS) {
      this.filteredPeople.set([]);
      return;
    }
    this.searchTerm$.next(normalized);
  }

  onSearchCostCenter(term: string): void {
    const normalized = term.trim().toLowerCase();
    if (!normalized) {
      this.filteredCostCenters.set(this.allCostCenters().slice(0, 30));
      return;
    }
    const matched = this.allCostCenters().filter(
      (c) =>
        c.codigo?.toLowerCase().includes(normalized) ||
        c.nombre?.toLowerCase().includes(normalized),
    );
    this.filteredCostCenters.set(matched.slice(0, 30));
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const raw = this.form.getRawValue();

    const existingData = this.person()?.data;
    let dataObj: Record<string, unknown> = {};
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        if (parsed && typeof parsed === 'object') {
          dataObj = { ...parsed };
        }
      } catch {
        // Si no es JSON previo, se inicializa nuevo objeto
      }
    }

    if (raw.funcion) {
      dataObj['funcion'] = raw.funcion;
    } else {
      delete dataObj['funcion'];
    }

    const jsonString = Object.keys(dataObj).length > 0 ? JSON.stringify(dataObj) : null;

    this.savePerson.emit({
      idProyecto: this.projectId(),
      idPersonaGeneral: Number(raw.idPersonaGeneral),
      idCentroCosto: raw.idCentroCosto ? Number(raw.idCentroCosto) : null,
      funcion: raw.funcion || null,
      data: jsonString,
      horas: String(raw.horas ?? 0),
      observacion: raw.observacion.trim() || null,
      estado: raw.esActivo ? '1' : '0',
      esActivo: raw.esActivo ? '1' : '0',
    });
  }

  private loadParticipantFunctions(): void {
    this.projectsService.listParticipantFunctions().subscribe({
      next: (list: ParticipantFunctionOption[]) => {
        this.participantFunctionOptions.set(
          (list ?? []).map((item: ParticipantFunctionOption) => ({
            value: item.codigo,
            label: item.nombre,
          })),
        );
      },
      error: (e: unknown) => console.error(e),
    });
  }

  private loadCostCenters(): void {
    this.projectsService.listCostCenters().subscribe({
      next: (list) => {
        const rows = list ?? [];
        this.allCostCenters.set(rows);
        this.filteredCostCenters.set(rows.slice(0, 30));
        this.ensureSelectedCostCenter();
      },
      error: (e) => console.error(e),
    });
  }

  private ensureSelectedPerson(): void {
    const item = this.person();
    if (!item?.idPersonaGeneral) {
      return;
    }

    const id = String(item.idPersonaGeneral);
    const rows = this.filteredPeople();
    if (rows.some((row) => String(row.id) === id)) {
      return;
    }

    this.filteredPeople.set([
      ...rows,
      {
        id: item.idPersonaGeneral,
        documentoIdentidad: '',
        nombreCompleto: item.nombreCompleto || id,
        telefonoCelular: null,
      },
    ]);
  }

  private ensureSelectedCostCenter(): void {
    const item = this.person();
    if (!item?.idCentroCosto) {
      return;
    }

    const id = String(item.idCentroCosto);
    const rows = this.filteredCostCenters();
    if (rows.some((row) => String(row.id) === id)) {
      return;
    }

    const existingInAll = this.allCostCenters().find(
      (row) => String(row.id) === id,
    );

    const costCenterToAdd: CostCenterOption = existingInAll || {
      id: item.idCentroCosto,
      codigo: item.centroCostoCodigo || '',
      nombre: item.centroCostoNombre || id,
    };

    this.filteredCostCenters.set([costCenterToAdd, ...rows]);
  }

  private patchForm(): void {
    const item = this.person();

    let funcionValue = item?.funcion ?? '';
    if (!funcionValue && item?.data) {
      try {
        const parsed = JSON.parse(item.data);
        if (parsed && typeof parsed === 'object' && parsed.funcion) {
          funcionValue = String(parsed.funcion);
        }
      } catch {
        funcionValue = item.data;
      }
    }

    this.form.reset({
      idPersonaGeneral:
        item?.idPersonaGeneral != null ? String(item.idPersonaGeneral) : '',
      funcion: funcionValue,
      idCentroCosto:
        item?.idCentroCosto != null ? String(item.idCentroCosto) : '',
      horas:
        item?.horas != null && item.horas !== '' ? Number(item.horas) : null,
      observacion: item?.observacion ?? '',
      esActivo: item ? this.isChecked(item.esActivo || item.estado) : true,
    });
  }

  private isChecked(value: string | null | undefined): boolean {
    const normalized = String(value ?? '').trim().toUpperCase();
    return (
      normalized === '1' ||
      normalized === 'S' ||
      normalized === 'SI' ||
      normalized === 'TRUE'
    );
  }
}
