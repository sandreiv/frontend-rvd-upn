/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Adaptación para esquema general con Tipo de Actividades y Docentes
 * 10/11/2026 - Leonel Antonio Perez Rios - Búsqueda de personas conectada al servicio de proyectos y remoción de tipo de actividad
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
  TypeaheadOption,
  TypeaheadSelect,
} from '../../../../../shared/components/form/typeahead-select/typeahead-select';
import { ProjectsService } from '../../data/projects.service';
import { PersonaAutorizaConvocatoriaItem } from '../../../../configuration/preload-call/model/preload-call.model';
import {
  ProjectPersonFormData,
  ProjectPersonItem,
} from '../../model/projects.model';
import { Checkbox } from '../../../../../shared/components/form/input/checkbox';

type ProjectPersonFormGroup = FormGroup<{
  idPersonaGeneral: FormControl<string>;
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
  projectId = input.required<number>();
  isSaving = input(false);
  currentPersonCount = input(0);
  maxParticipantes = input<number | null>(null);

  @Output() cancel = new EventEmitter<void>();
  @Output() savePerson = new EventEmitter<ProjectPersonFormData>();

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

  readonly horas = toSignal(
    this.form.controls.horas.valueChanges,
    { initialValue: null },
  );

  readonly horasValidation = computed(() => {
    const horas = this.horas();

    if (horas == null || horas <= 0) {
      return {
        valid: false,
        bajoMinimo: false,
        sobreMaximo: false,
        minimo: 1,
        maximo: 40,
      };
    }

    return {
      valid: true,
      bajoMinimo: false,
      sobreMaximo: false,
      minimo: 1,
      maximo: 40,
    };
  });

  constructor() {
    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) =>
          this.projectsService
            .searchPersons(term)
            .pipe(
              catchError(() => of([] as PersonaAutorizaConvocatoriaItem[])),
            ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((rows) => this.filteredPeople.set(rows.slice(0, 20)));
  }

  ngOnInit(): void {
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
      horas: String(raw.horas ?? 0),
      observacion: raw.observacion.trim() || null,
      estado: raw.esActivo ? '1' : '0',
      esActivo: raw.esActivo ? '1' : '0',
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

  private patchForm(): void {
    const item = this.person();

    this.form.reset({
      idPersonaGeneral:
        item?.idPersonaGeneral != null ? String(item.idPersonaGeneral) : '',
      horas:
        item?.horas != null && item.horas !== '' ? Number(item.horas) : null,
      observacion: item?.observacion ?? '',
      esActivo: this.isChecked(item?.esActivo || item?.estado),
    });
  }

  private isChecked(value: string | null | undefined): boolean {
    const normalized = String(value ?? '').trim().toUpperCase();

    return normalized === '1' || normalized === 'S' || normalized === 'SI' || normalized === 'TRUE';
  }
}
