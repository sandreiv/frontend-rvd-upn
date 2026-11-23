/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Adaptación para esquema general con Tipo de Actividades y Docentes
 * 10/11/2026 - Leonel Antonio Perez Rios - Búsqueda de personas conectada al servicio de proyectos y remoción de tipo de actividad
 * 10/11/2026 - Leonel Antonio Perez Rios - Limpieza de código, validación de horas y remoción de límites inexistentes
 * 13/11/2026 - Inclusión de función en el proyecto y selector de centro de costo
 * 17/11/2026 - Refactorización de Clean Code: tipado estricto, días dinámicos desde backend y eliminación de código muerto
 * 20/11/2026 - Inclusión de selector dinámico de programa curricular según aplicaPrograma y auto-sincronización con centro de costo
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
  effect,
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
import { TimePicker } from '../../../../../shared/components/form/time-picker/time-picker';
import { ProjectsService } from '../../data/projects.service';
import { PersonaAutorizaConvocatoriaItem } from '../../../../configuration/preload-call/model/preload-call.model';
import {
  CentroCostoItem,
  CoordinacionCentrosCostoResponse,
  CostCenterOption,
  DayOfWeekOption,
  DayScheduleState,
  ParticipantDataPayload,
  ParticipantFunctionOption,
  ParticipantLevelOption,
  ParticipantScheduleSlot,
  ProgramaCentrosCostoItem,
  ProjectItem,
  ProjectPersonFormData,
  ProjectPersonItem,
  TipoActividadProyectoItem,
} from '../../model/projects.model';

const OBSERVACION_MAX_LENGTH = 255;
const SEARCH_DEBOUNCE_TIME = 300;
const MIN_SEARCH_CHARS = 2;
const MIN_HORAS = 1;
const MAX_HORAS = 40;
const MAX_SEARCH_RESULTS = 20;
const DEFAULT_HORA_INICIO = '08:00';
const DEFAULT_HORA_FIN = '12:00';

type ProjectPersonFormGroup = FormGroup<{
  idPersonaGeneral: FormControl<string>;
  funcion: FormControl<string>;
  nivel: FormControl<string>;
  idCentroCosto: FormControl<string>;
  idPrograma: FormControl<string>;
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
    TimePicker,
  ],
  templateUrl: './project-person-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPersonForm implements OnInit, OnChanges {
  private readonly projectsService = inject(ProjectsService);
  private readonly searchTerm$ = new Subject<string>();

  person = input<ProjectPersonItem | null>(null);
  projectId = input<number>(0);
  project = input<ProjectItem | null>(null);
  isSaving = input(false);
  readOnly = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() savePerson = new EventEmitter<ProjectPersonFormData>();

  readonly filteredPeople = signal<PersonaAutorizaConvocatoriaItem[]>([]);
  readonly costCenterOptions = signal<Option[]>([]);
  readonly baseCostCenterOptions = signal<Option[]>([]);
  readonly programOptions = signal<Option[]>([]);
  private readonly costCenterToProgramMap = new Map<string, string>();
  private readonly programToCostCenterMap = new Map<string, string>();
  private readonly costCenterSearch$ = new Subject<string>();
  readonly isCreateMode = computed<boolean>(() => this.person() == null);

  readonly participantFunctionOptions = signal<Option[]>([]);
  readonly participantLevelOptions = signal<Option[]>([]);
  readonly availableDays = signal<DayOfWeekOption[]>([]);
  readonly weeklySchedule = signal<DayScheduleState[]>([]);
  readonly activityTypes = signal<TipoActividadProyectoItem[]>([]);

  readonly targetTipoActividadId = computed<number | null>(() => {
    return this.project()?.idTipoActividad ?? this.person()?.idTipoActividad ?? null;
  });

  readonly activeActivityType = computed<TipoActividadProyectoItem | null>(() => {
    const targetId = this.targetTipoActividadId();
    if (targetId == null) {
      return null;
    }
    return (
      this.activityTypes().find(
        (item: TipoActividadProyectoItem) => Number(item.id) === Number(targetId),
      ) ?? null
    );
  });

  readonly showFuncion = computed<boolean>(() => {
    return this.activeActivityType()?.requiereFuncion ?? false;
  });

  readonly showNivel = computed<boolean>(() => {
    return this.activeActivityType()?.requiereNivel ?? false;
  });

  readonly showHorario = computed<boolean>(() => {
    return this.activeActivityType()?.requiereHorario ?? false;
  });

  readonly showPrograma = computed<boolean>(() => {
    return this.activeActivityType()?.aplicaPrograma ?? false;
  });

  readonly showCustomDataCard = computed<boolean>(() => {
    return this.showFuncion() || this.showNivel() || this.showHorario();
  });

  readonly minHoras = computed<number>(() => {
    let current = this.activeActivityType();
    const visited = new Set<number>();
    while (current != null && !visited.has(Number(current.id))) {
      visited.add(Number(current.id));
      if (current.minimoHoras != null && current.minimoHoras > 0) {
        return current.minimoHoras;
      }
      if (current.idPadre == null) {
        break;
      }
      current =
        this.activityTypes().find(
          (item: TipoActividadProyectoItem) =>
            Number(item.id) === Number(current?.idPadre),
        ) ?? null;
    }
    return MIN_HORAS;
  });

  readonly maxHoras = computed<number>(() => {
    let current = this.activeActivityType();
    const visited = new Set<number>();
    let minOfMax: number | null = null;
    while (current != null && !visited.has(Number(current.id))) {
      visited.add(Number(current.id));
      if (current.maximoHoras != null && current.maximoHoras > 0) {
        minOfMax =
          minOfMax != null
            ? Math.min(minOfMax, current.maximoHoras)
            : current.maximoHoras;
      }
      if (current.idPadre == null) {
        break;
      }
      current =
        this.activityTypes().find(
          (item: TipoActividadProyectoItem) =>
            Number(item.id) === Number(current?.idPadre),
        ) ?? null;
    }
    return minOfMax ?? MAX_HORAS;
  });

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

  readonly isHorarioValid = computed<boolean>(() => {
    if (!this.showHorario()) {
      return true;
    }
    const horasAsignadas = this.horas();
    if (horasAsignadas == null || horasAsignadas <= 0) {
      return false;
    }
    return Math.abs(this.totalHorasSemanales() - horasAsignadas) < 0.01;
  });

  readonly horarioDiferencia = computed<number>(() => {
    if (!this.showHorario()) {
      return 0;
    }
    const horasAsignadas = this.horas() ?? 0;
    const diff = this.totalHorasSemanales() - horasAsignadas;
    return Number(diff.toFixed(1));
  });

  readonly form: ProjectPersonFormGroup = new FormGroup({
    idPersonaGeneral: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    funcion: new FormControl('', {
      nonNullable: true,
    }),
    nivel: new FormControl('', {
      nonNullable: true,
    }),
    idCentroCosto: new FormControl('', {
      nonNullable: true,
    }),
    idPrograma: new FormControl('', {
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
    const min = this.minHoras();
    const max = this.maxHoras();

    if (horas == null) {
      return {
        valid: false,
        bajoMinimo: false,
        sobreMaximo: false,
        minimo: min,
        maximo: max,
      };
    }

    return {
      valid: horas >= min && horas <= max,
      bajoMinimo: horas < min,
      sobreMaximo: horas > max,
      minimo: min,
      maximo: max,
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

    this.costCenterSearch$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_TIME),
        distinctUntilChanged(),
        switchMap((term: string) => {
          const clean = term?.trim();
          if (!clean || clean.length < MIN_SEARCH_CHARS) {
            return of([] as CentroCostoItem[]);
          }
          return this.projectsService
            .searchCostCenters(clean)
            .pipe(catchError(() => of([] as CentroCostoItem[])));
        }),
        takeUntilDestroyed(),
      )
      .subscribe((extraCenters: CentroCostoItem[]) => {
        const base = this.baseCostCenterOptions();
        if (!extraCenters || extraCenters.length === 0) {
          this.costCenterOptions.set(base);
          this.ensureSelectedCostCenter();
          return;
        }

        const existingValues = new Set(base.map((o) => o.value));
        const extraOptions: Option[] = extraCenters
          .filter((c) => !existingValues.has(String(c.id)))
          .map((c) => ({
            value: String(c.id),
            label: c.descripcion,
            group: 'Otros centros de costo',
          }));

        this.costCenterOptions.set([...base, ...extraOptions]);
        this.ensureSelectedCostCenter();
      });

    this.form.controls.idPrograma.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((progId: string) => {
        this.updateFilteredCostCenters(progId);
        if (!progId) {
          return;
        }
        const assignedCeco = this.programToCostCenterMap.get(progId);
        if (assignedCeco) {
          this.form.controls.idCentroCosto.setValue(assignedCeco, { emitEvent: false });
        }
      });

    this.form.controls.idCentroCosto.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((cecoId: string) => {
        if (!cecoId || !this.showPrograma()) {
          return;
        }
        const progId = this.costCenterToProgramMap.get(cecoId);
        if (progId) {
          this.form.controls.idPrograma.setValue(progId, { emitEvent: false });
        }
      });

    effect(() => {
      const reqFuncion = this.showFuncion();
      const reqNivel = this.showNivel();
      const min = this.minHoras();
      const max = this.maxHoras();
      this.updateDynamicValidators(reqFuncion, reqNivel, min, max);
    });
  }

  ngOnInit(): void {
    this.loadActivityTypes();
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
    if (changes['project'] && !changes['project'].firstChange) {
      this.loadCostCenters();
    }
    if (changes['person'] || changes['readOnly']) {
      this.ensureSelectedPerson();
      this.ensureSelectedCostCenter();
      this.ensureSelectedProgram();
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

  onSearchCostCenter(term: string): void {
    this.costCenterSearch$.next(term ?? '');
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
    const val = String(horaInicio ?? DEFAULT_HORA_INICIO);
    this.weeklySchedule.update((list: DayScheduleState[]) =>
      list.map((d: DayScheduleState) =>
        d.dia === dia ? { ...d, horaInicio: val } : d,
      ),
    );
  }

  updateDayHoraFin(dia: string, horaFin: string | number): void {
    const val = String(horaFin ?? DEFAULT_HORA_FIN);
    this.weeklySchedule.update((list: DayScheduleState[]) =>
      list.map((d: DayScheduleState) =>
        d.dia === dia ? { ...d, horaFin: val } : d,
      ),
    );
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || !this.isHorarioValid() || this.isSaving()) {
      return;
    }

    const raw = this.form.getRawValue();
    const existingData = this.person()?.data;
    const dataObj: ParticipantDataPayload = {};

    const parsedExisting = this.parseDataPayload(existingData);
    if (parsedExisting) {
      Object.assign(dataObj, parsedExisting);
    }

    if (this.showFuncion() && raw.funcion) {
      dataObj.funcion = raw.funcion;
    } else {
      delete dataObj.funcion;
    }

    if (this.showNivel() && raw.nivel) {
      dataObj.nivel = raw.nivel;
    } else {
      delete dataObj.nivel;
    }

    const activeSlots: ParticipantScheduleSlot[] = this.showHorario()
      ? this.weeklySchedule()
          .filter((d: DayScheduleState) => d.activo && d.horaInicio && d.horaFin)
          .map((d: DayScheduleState) => ({
            dia: d.dia,
            horaInicio: d.horaInicio,
            horaFin: d.horaFin,
          }))
      : [];

    if (this.showHorario() && activeSlots.length > 0) {
      dataObj.horario = activeSlots;
    } else {
      delete dataObj.horario;
    }

    const jsonString = Object.keys(dataObj).length > 0 ? JSON.stringify(dataObj) : null;

    this.savePerson.emit({
      idProyecto: this.projectId(),
      idPersonaGeneral: Number(raw.idPersonaGeneral),
      idCentroCosto: raw.idCentroCosto ? Number(raw.idCentroCosto) : null,
      idPrograma: this.showPrograma() && raw.idPrograma ? Number(raw.idPrograma) : null,
      funcion: this.showFuncion() && raw.funcion ? raw.funcion : null,
      nivel: this.showNivel() && raw.nivel ? raw.nivel : null,
      horario: this.showHorario() && activeSlots.length > 0 ? activeSlots : null,
      data: jsonString,
      horas: String(raw.horas ?? 0),
      observacion: raw.observacion.trim() || null,
      estado: raw.esActivo ? '1' : '0',
      esActivo: raw.esActivo ? '1' : '0',
    });
  }

  private loadActivityTypes(): void {
    this.projectsService.listProjectActivityTypes().subscribe({
      next: (list: TipoActividadProyectoItem[]) => {
        this.activityTypes.set(list ?? []);
      },
      error: () => {},
    });
  }

  private updateDynamicValidators(
    reqFuncion: boolean,
    reqNivel: boolean,
    minHoras: number,
    maxHoras: number,
  ): void {
    const funcionControl = this.form.controls.funcion;
    const nivelControl = this.form.controls.nivel;
    const horasControl = this.form.controls.horas;

    if (reqFuncion) {
      funcionControl.setValidators([Validators.required]);
    } else {
      funcionControl.clearValidators();
    }
    funcionControl.updateValueAndValidity({ emitEvent: false });

    if (reqNivel) {
      nivelControl.setValidators([Validators.required]);
    } else {
      nivelControl.clearValidators();
    }
    nivelControl.updateValueAndValidity({ emitEvent: false });

    horasControl.setValidators([
      Validators.required,
      Validators.min(minHoras),
      Validators.max(maxHoras),
    ]);
    horasControl.updateValueAndValidity({ emitEvent: false });
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
      error: () => {},
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
      error: () => {},
    });
  }

  private loadDaysOfWeek(): void {
    this.projectsService.listDaysOfWeek().subscribe({
      next: (days: DayOfWeekOption[]) => {
        this.availableDays.set(days ?? []);
        this.syncWeeklySchedule();
      },
      error: () => {},
    });
  }

  private parseDataPayload(data?: string | null): ParticipantDataPayload | null {
    if (!data || !data.trim().startsWith('{')) {
      return null;
    }
    try {
      const parsed = JSON.parse(data.trim());
      return parsed && typeof parsed === 'object' ? (parsed as ParticipantDataPayload) : null;
    } catch {
      return null;
    }
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

    const parsedData = this.parseDataPayload(item?.data);
    if (parsedData?.horario) {
      if (Array.isArray(parsedData.horario)) {
        for (const s of parsedData.horario) {
          if (s?.dia) {
            const hIni = this.normalizeTime(s.horaInicio, DEFAULT_HORA_INICIO);
            const hFin = this.normalizeTime(s.horaFin, DEFAULT_HORA_FIN);
            existingMap.set(String(s.dia).toUpperCase(), {
              activo: true,
              horaInicio: hIni,
              horaFin: hFin,
            });
          }
        }
      } else if (typeof parsedData.horario === 'object') {
        const dias = Array.isArray(parsedData.horario.dias) ? parsedData.horario.dias : [];
        for (const diaName of dias) {
          const hIni = this.normalizeTime(parsedData.horario.horaInicio, DEFAULT_HORA_INICIO);
          const hFin = this.normalizeTime(parsedData.horario.horaFin, DEFAULT_HORA_FIN);
          existingMap.set(String(diaName).toUpperCase(), {
            activo: true,
            horaInicio: hIni,
            horaFin: hFin,
          });
        }
      }
    }

    if (item?.horario && Array.isArray(item.horario)) {
      for (const s of item.horario) {
        if (s?.dia) {
          const hIni = this.normalizeTime(s.horaInicio, DEFAULT_HORA_INICIO);
          const hFin = this.normalizeTime(s.horaFin, DEFAULT_HORA_FIN);
          existingMap.set(String(s.dia).toUpperCase(), {
            activo: true,
            horaInicio: hIni,
            horaFin: hFin,
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
        horaInicio: saved ? saved.horaInicio : DEFAULT_HORA_INICIO,
        horaFin: saved ? saved.horaFin : DEFAULT_HORA_FIN,
      };
    });

    this.weeklySchedule.set(state);
  }

  private loadCostCenters(): void {
    const projId = this.projectId();
    const coordId = this.project()?.idCoordinacion;
    this.projectsService
      .listCostCenters(projId > 0 ? projId : undefined, coordId && coordId > 0 ? coordId : undefined)
      .subscribe({
        next: (data: CoordinacionCentrosCostoResponse) => {
          const options: Option[] = [];
          const progOptions: Option[] = [];
          const seenCostCenters = new Set<string>();
          const seenPrograms = new Set<string>();
          this.costCenterToProgramMap.clear();
          this.programToCostCenterMap.clear();

          const coordGroup = data?.nombre ? `Coordinación: ${data.nombre}` : 'Coordinación';
          (data?.centrosCosto ?? []).forEach((c: CentroCostoItem) => {
            const val = String(c.id);
            if (!seenCostCenters.has(val)) {
              seenCostCenters.add(val);
              options.push({
                value: val,
                label: c.descripcion,
                group: coordGroup,
              });
            }
          });

          (data?.programas ?? []).forEach((p: ProgramaCentrosCostoItem) => {
            const progId = String(p.id);
            if (!seenPrograms.has(progId)) {
              seenPrograms.add(progId);
              progOptions.push({
                value: progId,
                label: p.nombre,
                group: p.grupo || undefined,
              });
            }

            const firstCostCenter = p.centrosCosto?.[0];
            if (firstCostCenter) {
              this.programToCostCenterMap.set(progId, String(firstCostCenter.id));
            }

            const progGroup = p.nombre ? `Programa: ${p.nombre}` : 'Programa';
            (p.centrosCosto ?? []).forEach((c: CentroCostoItem) => {
              const val = String(c.id);
              this.costCenterToProgramMap.set(val, progId);
              if (!seenCostCenters.has(val)) {
                seenCostCenters.add(val);
                options.push({
                  value: val,
                  label: c.descripcion,
                  group: progGroup,
                });
              }
            });
          });

          this.programOptions.set(progOptions);
          this.baseCostCenterOptions.set(options);
          this.updateFilteredCostCenters(this.form.controls.idPrograma.value);
          this.ensureSelectedCostCenter();
          this.ensureSelectedProgram();
        },
        error: () => {},
      });
  }

  private updateFilteredCostCenters(selectedProgId?: string | null): void {
    const base = this.baseCostCenterOptions();
    if (!selectedProgId) {
      this.costCenterOptions.set(base);
      this.ensureSelectedCostCenter();
      return;
    }

    const filtered = base.filter((opt: Option) => {
      const isCoord = !this.costCenterToProgramMap.has(opt.value);
      const isSelectedProg = this.costCenterToProgramMap.get(opt.value) === selectedProgId;
      return isCoord || isSelectedProg;
    });

    this.costCenterOptions.set(filtered);
    this.ensureSelectedCostCenter();
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

  private ensureSelectedProgram(): void {
    const item = this.person();
    if (!item?.idPrograma) {
      return;
    }

    const id = String(item.idPrograma);
    const currentOptions = this.programOptions();
    if (currentOptions.some((opt: Option) => opt.value === id)) {
      return;
    }

    const label = item.programaNombre || `Programa ${id}`;
    this.programOptions.set([{ value: id, label }, ...currentOptions]);
  }

  private patchForm(): void {
    const item = this.person();

    let funcionValue = item?.funcion ?? '';
    let nivelValue = item?.nivel ?? '';

    const parsedData = this.parseDataPayload(item?.data);
    if (parsedData) {
      if (!funcionValue && parsedData.funcion) {
        funcionValue = String(parsedData.funcion);
      }
      if (!nivelValue && parsedData.nivel) {
        nivelValue = String(parsedData.nivel);
      }
    } else if (item?.data && !item.data.trim().startsWith('{') && !funcionValue) {
      funcionValue = item.data;
    }

    this.syncWeeklySchedule();

    this.form.reset({
      idPersonaGeneral: item?.idPersonaGeneral != null ? String(item.idPersonaGeneral) : '',
      funcion: funcionValue,
      nivel: nivelValue,
      idCentroCosto: item?.idCentroCosto != null ? String(item.idCentroCosto) : '',
      idPrograma: item?.idPrograma != null ? String(item.idPrograma) : '',
      horas: item?.horas != null && item.horas !== '' ? Number(item.horas) : null,
      observacion: item?.observacion ?? '',
      esActivo: item ? this.isChecked(item.esActivo || item.estado) : true,
    });

    this.updateFilteredCostCenters(item?.idPrograma != null ? String(item.idPrograma) : '');

    if (this.readOnly()) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  isCoordinationGroup(group: string): boolean {
    const g = group.toLowerCase();
    return (
      g.startsWith('coordinación') ||
      g.startsWith('coordinacion') ||
      g.startsWith('facultad') ||
      g.startsWith('decanatura') ||
      g.startsWith('departamento')
    );
  }

  isProgramGroup(group: string): boolean {
    return group.toLowerCase().startsWith('programa');
  }

  cleanGroupName(group: string): string {
    return group.replace(/^(coordinaci[oó]n|programa|facultad|departamento):\s*/i, '').trim();
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

  private normalizeTime(val: string | null | undefined, fallback: string): string {
    if (!val) {
      return fallback;
    }
    const parts = String(val).trim().split(':');
    if (parts.length >= 2) {
      const h = parts[0].padStart(2, '0');
      const m = parts[1].padStart(2, '0');
      return `${h}:${m}`;
    }
    return fallback;
  }
}
