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
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
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
import {
  TypeaheadOption,
  TypeaheadSelect,
} from '../../../../../shared/components/form/typeahead-select/typeahead-select';
import { ActivityTypesService } from '../../../activity-types/data/activity-types.service';
import { PreloadCallService } from '../../../../configuration/preload-call/data/preload-call.service';
import { PersonaAutorizaConvocatoriaItem } from '../../../../configuration/preload-call/model/preload-call.model';
import {
  ProjectPersonFormData,
  ProjectPersonItem,
} from '../../model/projects.model';
import { ActivityTypeItem } from '../../../activity-types/model/activity-types.model';
import { Checkbox } from '../../../../../shared/components/form/input/checkbox';

type ProjectPersonFormGroup = FormGroup<{
  idPersonaGeneral: FormControl<string>;
  idTipoActividad: FormControl<string>;
  tipo: FormControl<string>;
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
    Select,
    Button,
    TypeaheadSelect,
    Checkbox
],
  templateUrl: './project-person-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPersonForm implements OnInit, OnChanges {
  private readonly activityTypesService = inject(ActivityTypesService);
  private readonly preloadCallService = inject(PreloadCallService);
  private readonly searchTerm$ = new Subject<string>();

  person = input<ProjectPersonItem | null>(null);
  projectId = input.required<number>();
  isSaving = input(false);
  currentPersonCount = input(0);
  maxParticipantes = input<number | null>(null);

  @Output() cancel = new EventEmitter<void>();
  @Output() savePerson = new EventEmitter<ProjectPersonFormData>();

  readonly activityTypeOptions = signal<Option[]>([]);
  readonly filteredPeople = signal<PersonaAutorizaConvocatoriaItem[]>([]);

  readonly isCreateMode = computed(() => this.person() == null);

  readonly isCreateBlocked = computed(() => {
    if (!this.isCreateMode()) {
      return false;
    }

    const max = this.maxParticipantes();
    if (max == null) {
      return false;
    }

    return this.currentPersonCount() >= max;
  });

  readonly form: ProjectPersonFormGroup = new FormGroup({
    idPersonaGeneral: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idTipoActividad: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    tipo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    horas: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    observacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(255)],
    }),
    esActivo: new FormControl(false, {
      nonNullable: true,
    }),
  });

  readonly selectedIdTipoActividad = toSignal(
    this.form.controls.idTipoActividad.valueChanges,
    { initialValue: '' }
  );

  readonly horas = toSignal(
    this.form.controls.horas.valueChanges,
    { initialValue: null }
  );

  readonly selectedTipoActividad = computed(() => 
    this.tiposActividadResource
      .value()
      .find((item) => String(item.id) === this.selectedIdTipoActividad())
  );

  readonly horasValidation = computed(() => {
    const tipoActividad = this.selectedTipoActividad();
    const horas = this.horas();

    if (!tipoActividad || horas == null) {
      return {
        valid: false,
        bajoMinimo: false,
        sobreMaximo: false,
        minimo: false,
        maximo: false
      };
    }

    const minimo = Number(tipoActividad.minimoHoras);
    const maximo = Number(tipoActividad.maximoHoras);

    return {
      valid: (horas >= minimo) && (horas <= maximo),
      bajoMinimo: horas < minimo,
      sobreMaximo: horas > maximo,
      minimo,
      maximo
    };
  });

  
  private readonly tiposActividadResource = rxResource({
    stream: () =>
      this.activityTypesService.listActivityTypes(),
    defaultValue: [] as ActivityTypeItem[],
  });


  constructor() {
    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) => {
          const params = /^\d+$/.test(term)
            ? { documento: term }
            : { nombre: term };
          return this.preloadCallService
            .searchGeneralPerson(params)
            .pipe(
              catchError(() => of([] as PersonaAutorizaConvocatoriaItem[])),
            );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((rows) => this.filteredPeople.set(rows.slice(0, 20)));
  }

  async ngOnInit(): Promise<void> {
    await this.loadActivityTypes();
    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['person']) {
      this.ensureSelectedPerson();
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
    if (normalized.length < 2) {
      this.filteredPeople.set([]);
      return;
    }
    this.searchTerm$.next(normalized);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.isCreateBlocked() || this.form.invalid || this.isSaving()) {
      return;
    }

    const raw = this.form.getRawValue();

    this.savePerson.emit({
      idProyecto: this.projectId(),
      idPersonaGeneral: Number(raw.idPersonaGeneral),
      idTipoActividad: Number(raw.idTipoActividad),
      tipo: raw.tipo.trim(),
      horas: String(raw.horas ?? 0),
      observacion: raw.observacion.trim() || null,
      esActivo: raw.esActivo ? '1' : '0',
    });
  }

  private async loadActivityTypes(): Promise<void> {
    try {
      const rows = await firstValueFrom(
        this.activityTypesService.listActivityTypes(),
      );
      this.activityTypeOptions.set(
        (rows ?? []).map((item) => ({
          value: String(item.id),
          label: item.nombre?.trim() || String(item.id),
        })),
      );
    } catch (error) {
      console.error(error);
      this.activityTypeOptions.set([]);
    }
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

  private patchForm(): void {
    const item = this.person();

    this.form.reset({
      idPersonaGeneral:
        item?.idPersonaGeneral != null ? String(item.idPersonaGeneral) : '',
      idTipoActividad:
        item?.idTipoActividad != null ? String(item.idTipoActividad) : '',
      tipo: item?.tipo ?? '',
      horas:
        item?.horas != null && item.horas !== '' ? Number(item.horas) : null,
      observacion: item?.observacion ?? '',
      esActivo: this.isChecked(item?.esActivo),
    });
  }

  private isChecked(value: string | null | undefined): boolean {
    const normalized = String(value ?? '').trim().toUpperCase();

    return normalized === '1' || normalized === 'S' || normalized === 'SI' || normalized === 'TRUE';
  }
}
