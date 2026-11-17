/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Adaptación para esquema general con Tipo de Actividades y Docentes
 * 10/11/2026 - Leonel Antonio Perez Rios - Búsqueda de personas conectada al servicio de proyectos y remoción de tipo de actividad
 * 10/11/2026 - Leonel Antonio Perez Rios - Limpieza de código, validación de horas y remoción de límites inexistentes
 * 13/11/2026 - Inclusión de función en el proyecto y selector de centro de costo
 * 17/11/2026 - Refactorización de Clean Code: tipado estricto, días dinámicos desde backend y eliminación de código muerto
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
import { Checkbox } from '../../../../../shared/components/form/input/checkbox';
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
  DayOfWeekOption,
  DayScheduleState,
  ParticipantDataPayload,
  ParticipantFunctionOption,
  ParticipantLevelOption,
  ParticipantScheduleSlot,
  ProjectPersonFormData,
  ProjectPersonItem,
} from '../../model/projects.model';

const OBSERVACION_MAX_LENGTH = 255;
const SEARCH_DEBOUNCE_TIME = 300;
const MIN_SEARCH_CHARS = 2;
const MIN_HORAS = 1;
const MAX_HORAS = 40;
const MAX_SEARCH_RESULTS = 20;

type ProjectPersonFormGroup = FormGroup<{
  idPersonaGeneral: FormControl<string>;
  funcion: FormControl<string>;
  nivel: FormControl<string>;
  idCentroCosto: FormControl<string>;
  horas: FormControl<number | null>;
  observacion: FormControl<string>;
  esActivo: FormControl<boolean>;
}>;

interface HorasValidationResult {
  valid: boolean;
  bajoMinimo: boolean;
  sobreMaximo: boolean;
  minimo: number;
  maximo: number;
}

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
  readonly costCenterOptions = signal<Option[]>([]);
  readonly isCreateMode = computed<boolean>(() => this.person() == null);

  readonly participantFunctionOptions = signal<Option[]>([]);
  readonly participantLevelOptions = signal<Option[]>([]);
  readonly availableDays = signal<DayOfWeekOption[]>([]);
  readonly weeklySchedule = signal<DayScheduleState[]>([]);

  readonly totalHorasSemanales = computed<number>(() => {
    let total = 0;
    for (const day of this.weeklySchedule()) {
      total += this.calculateSlotHours(day);
    }
    return Number.isInteger(total) ? total : Number(total.toFixed(1));
  });

  readonly activeDaysCount = computed<number>(() => {
    return this.weeklySchedule().filter((d) => d.activo).length;
  });

  readonly form: ProjectPersonFormGroup = new FormGroup({
    idPersonaGeneral: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    funcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    nivel: new FormControl('', {
      nonNullable: true,
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

  readonly horasValidation = computed<HorasValidationResult>(() => {
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
        switchMap((term: string) =>
          this.projectsService
            .searchPersons(term)
            .pipe(catchError(() => of([] as PersonaAutorizaConvocatoriaItem[]))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((rows: PersonaAutorizaConvocatoriaItem[]) =>
        this.filteredPeople.set(rows.slice(0, MAX_SEARCH_RESULTS)),
      );
  }

  ngOnInit(): void {
    this.loadParticipantFunctions();
    this.loadParticipantLevels();
    this.loadDaysOfWeek();
    this.loadCostCenters();
    this.ensureSelectedPerson();
    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectId'] && !changes['projectId'].firstChange) {
      this.loadCostCenters();
    }
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

  onSearchPerson(term: string): void {
    const normalized = term.trim();
    if (normalized.length < MIN_SEARCH_CHARS) {
      this.filteredPeople.set([]);
      return;
    }
    this.searchTerm$.next(normalized);
  }

  calculateSlotHours(slot: { activo: boolean; horaInicio: string; horaFin: string }): number {
    if (!slot.activo || !slot.horaInicio || !slot.horaFin) {
      return 0;
    }
    const [h1, m1] = slot.horaInicio.split(':').map(Number);
    const [h2, m2] = slot.horaFin.split(':').map(Number);
    if (isNaN(h1) || isNaN(m1) || isNaN(h2) || isNaN(m2)) {
      return 0;
    }
    const diffMinutes = h2 * 60 + m2 - (h1 * 60 + m1);
    if (diffMinutes <= 0) {
      return 0;
    }
    const hours = diffMinutes / 60;
    return Number.isInteger(hours) ? hours : Number(hours.toFixed(1));
  }

  toggleDayActive(dia: string): void {
    this.weeklySchedule.update((list: DayScheduleState[]) =>
      list.map((d: DayScheduleState) =>
        d.dia === dia ? { ...d, activo: !d.activo } : d,
      ),
    );
  }

  updateDayHoraInicio(dia: string, horaInicio: string | number): void {
    const val = String(horaInicio ?? '08:00');
    this.weeklySchedule.update((list: DayScheduleState[]) =>
      list.map((d: DayScheduleState) =>
        d.dia === dia ? { ...d, horaInicio: val } : d,
      ),
    );
  }

  updateDayHoraFin(dia: string, horaFin: string | number): void {
    const val = String(horaFin ?? '12:00');
    this.weeklySchedule.update((list: DayScheduleState[]) =>
      list.map((d: DayScheduleState) =>
        d.dia === dia ? { ...d, horaFin: val } : d,
      ),
    );
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const raw = this.form.getRawValue();
    const existingData = this.person()?.data;
    const dataObj: ParticipantDataPayload = {};

    if (existingData) {
      try {
        const parsed = JSON.parse(existingData) as ParticipantDataPayload;
        if (parsed && typeof parsed === 'object') {
          Object.assign(dataObj, parsed);
        }
      } catch {
        // En caso de texto plano legacy, se sobreescribe con estructura JSON
      }
    }

    if (raw.funcion) {
      dataObj.funcion = raw.funcion;
    } else {
      delete dataObj.funcion;
    }

    if (raw.nivel) {
      dataObj.nivel = raw.nivel;
    } else {
      delete dataObj.nivel;
    }

    const activeSlots: ParticipantScheduleSlot[] = this.weeklySchedule()
      .filter((d: DayScheduleState) => d.activo && d.horaInicio && d.horaFin)
      .map((d: DayScheduleState) => ({
        dia: d.dia,
        horaInicio: d.horaInicio,
        horaFin: d.horaFin,
      }));

    if (activeSlots.length > 0) {
      dataObj.horario = activeSlots;
    } else {
      delete dataObj.horario;
    }

    const jsonString = Object.keys(dataObj).length > 0 ? JSON.stringify(dataObj) : null;

    this.savePerson.emit({
      idProyecto: this.projectId(),
      idPersonaGeneral: Number(raw.idPersonaGeneral),
      idCentroCosto: raw.idCentroCosto ? Number(raw.idCentroCosto) : null,
      funcion: raw.funcion || null,
      nivel: raw.nivel || null,
      horario: activeSlots.length > 0 ? activeSlots : null,
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

  private loadParticipantLevels(): void {
    this.projectsService.listParticipantLevels().subscribe({
      next: (list: ParticipantLevelOption[]) => {
        this.participantLevelOptions.set(
          (list ?? []).map((item: ParticipantLevelOption) => ({
            value: item.codigo,
            label: item.nombre,
          })),
        );
      },
      error: (e: unknown) => console.error(e),
    });
  }

  private loadDaysOfWeek(): void {
    this.projectsService.listDaysOfWeek().subscribe({
      next: (days: DayOfWeekOption[]) => {
        this.availableDays.set(days ?? []);
        this.syncWeeklySchedule();
      },
      error: (e: unknown) => console.error(e),
    });
  }

  private syncWeeklySchedule(): void {
    const days = this.availableDays();
    if (days.length === 0) {
      return;
    }

    const item = this.person();
    const existingMap = new Map<string, { activo: boolean; horaInicio: string; horaFin: string }>();

    for (const d of this.weeklySchedule()) {
      existingMap.set(d.dia, { activo: d.activo, horaInicio: d.horaInicio, horaFin: d.horaFin });
    }

    if (item?.data) {
      try {
        const parsed = JSON.parse(item.data) as ParticipantDataPayload;
        if (parsed?.horario) {
          if (Array.isArray(parsed.horario)) {
            for (const s of parsed.horario) {
              if (s?.dia) {
                existingMap.set(String(s.dia).toUpperCase(), {
                  activo: true,
                  horaInicio: s.horaInicio ? String(s.horaInicio) : '08:00',
                  horaFin: s.horaFin ? String(s.horaFin) : '12:00',
                });
              }
            }
          } else if (typeof parsed.horario === 'object') {
            const dias = Array.isArray(parsed.horario.dias) ? parsed.horario.dias : [];
            for (const diaName of dias) {
              existingMap.set(String(diaName).toUpperCase(), {
                activo: true,
                horaInicio: parsed.horario.horaInicio ? String(parsed.horario.horaInicio) : '08:00',
                horaFin: parsed.horario.horaFin ? String(parsed.horario.horaFin) : '12:00',
              });
            }
          }
        }
      } catch {
        // Ignora si no contiene JSON parseable
      }
    }

    if (item?.horario && Array.isArray(item.horario)) {
      for (const s of item.horario) {
        if (s?.dia) {
          existingMap.set(String(s.dia).toUpperCase(), {
            activo: true,
            horaInicio: s.horaInicio ? String(s.horaInicio) : '08:00',
            horaFin: s.horaFin ? String(s.horaFin) : '12:00',
          });
        }
      }
    }

    const state: DayScheduleState[] = days.map((d: DayOfWeekOption) => {
      const saved = existingMap.get(d.codigo);
      return {
        dia: d.codigo,
        nombre: d.nombre,
        abreviacion: d.abreviacion,
        activo: saved ? saved.activo : false,
        horaInicio: saved ? saved.horaInicio : '08:00',
        horaFin: saved ? saved.horaFin : '12:00',
      };
    });

    this.weeklySchedule.set(state);
  }

  private loadCostCenters(): void {
    const projId = this.projectId();
    this.projectsService.listCostCenters(projId > 0 ? projId : undefined).subscribe({
      next: (list: CostCenterOption[]) => {
        const options: Option[] = (list ?? []).map((item: CostCenterOption) => ({
          value: String(item.id),
          label: `${item.codigo} - ${item.nombre}`,
        }));
        this.costCenterOptions.set(options);
        this.ensureSelectedCostCenter();
      },
      error: (e: unknown) => console.error(e),
    });
  }

  private ensureSelectedPerson(): void {
    const item = this.person();
    if (!item?.idPersonaGeneral) {
      return;
    }

    const id = String(item.idPersonaGeneral);
    const rows = this.filteredPeople();
    if (rows.some((row: PersonaAutorizaConvocatoriaItem) => String(row.id) === id)) {
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
    const currentOptions = this.costCenterOptions();
    if (currentOptions.some((opt: Option) => opt.value === id)) {
      return;
    }

    const label =
      item.centroCostoCodigo && item.centroCostoNombre
        ? `${item.centroCostoCodigo} - ${item.centroCostoNombre}`
        : item.centroCostoNombre || item.centroCostoCodigo || id;

    this.costCenterOptions.set([{ value: id, label }, ...currentOptions]);
  }

  private patchForm(): void {
    const item = this.person();

    let funcionValue = item?.funcion ?? '';
    let nivelValue = item?.nivel ?? '';

    if (item?.data) {
      try {
        const parsed = JSON.parse(item.data) as ParticipantDataPayload;
        if (parsed && typeof parsed === 'object') {
          if (!funcionValue && parsed.funcion) {
            funcionValue = String(parsed.funcion);
          }
          if (!nivelValue && parsed.nivel) {
            nivelValue = String(parsed.nivel);
          }
        }
      } catch {
        if (!funcionValue) {
          funcionValue = item.data;
        }
      }
    }

    this.syncWeeklySchedule();

    this.form.reset({
      idPersonaGeneral:
        item?.idPersonaGeneral != null ? String(item.idPersonaGeneral) : '',
      funcion: funcionValue,
      nivel: nivelValue,
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