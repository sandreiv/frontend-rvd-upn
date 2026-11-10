/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Adaptación del formulario para esquema general de proyectos
 * 10/11/2026 - Leonel Antonio Perez Rios - Carga de actividades jerárquicas desde ProjectsService
 * 10/11/2026 - Leonel Antonio Perez Rios - Integración del componente jerárquico tipo árbol (TreeSelect)
 */
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  EventEmitter,
  inject,
  input,
  OnChanges,
  OnInit,
  Output,
  signal,
  SimpleChanges,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
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
import { TreeSelect } from '../../../../../shared/components/form/tree-select/tree-select';
import {
  TypeaheadOption,
  TypeaheadSelect,
} from '../../../../../shared/components/form/typeahead-select/typeahead-select';
import { ProjectsService } from '../../data/projects.service';
import {
  ProjectFormData,
  ProjectItem,
  TipoActividadProyectoItem,
} from '../../model/projects.model';

interface CoordinationOption {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

type ProjectFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  actaConsejo: FormControl<string>;
  idTipoActividad: FormControl<string>;
  idCoordinacion: FormControl<string>;
}>;

@Component({
  selector: 'app-project-form',
  imports: [ReactiveFormsModule, Label, InputField, TreeSelect, Button, TypeaheadSelect],
  templateUrl: './project-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectForm implements OnInit, OnChanges {
  private readonly projectsService = inject(ProjectsService);
  private readonly searchTerm$ = new Subject<string>();

  project = input<ProjectItem | null>(null);
  isSaving = input(false);
  title = input('Nuevo proyecto');
  editTitle = input('Editar proyecto');
  description = input('Registra la información básica del proyecto.');
  parentProjectId = input<number | null>(null);
  parentCoordinationId = input<number | null>(null);
  parentCoordinationName = input('');
  parentTipoActividadId = input<number | null>(null);

  readonly isProductMode = computed(() => this.parentProjectId() != null);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveProject = new EventEmitter<ProjectFormData>();

  readonly rawTipoActividades = signal<TipoActividadProyectoItem[]>([]);
  readonly filteredCoordinations = signal<CoordinationOption[]>([]);

  readonly form: ProjectFormGroup = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    actaConsejo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(100)],
    }),
    idTipoActividad: new FormControl('', {
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
          this.projectsService
            .searchCoordinations(term)
            .pipe(catchError(() => of([] as CoordinationOption[]))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((rows) => this.filteredCoordinations.set(rows));
  }

  async ngOnInit(): Promise<void> {
    await this.loadSelectOptions();
    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['project'] ||
      changes['parentProjectId'] ||
      changes['parentCoordinationId'] ||
      changes['parentCoordinationName'] ||
      changes['parentTipoActividadId']
    ) {
      this.patchForm();
    }
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

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const raw = this.form.getRawValue();
    const parentId = this.parentProjectId();

    this.saveProject.emit({
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim() || null,
      actaConsejo: raw.actaConsejo.trim() || null,
      idTipoActividad: Number(raw.idTipoActividad),
      idCoordinacion: Number(raw.idCoordinacion),
      idProyectoPadre: parentId,
      estado: '1',
    });
  }

  private async loadSelectOptions(): Promise<void> {
    try {
      const types = await firstValueFrom(this.projectsService.listProjectActivityTypes());
      this.rawTipoActividades.set(types ?? []);
    } catch (error) {
      console.error(error);
      this.rawTipoActividades.set([]);
    }
  }

  private ensureSelectedCoordination(idCoordinacion: number | null | undefined, nombreCoordinacion: string | null | undefined,): void {
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

    const coordinationId = productMode ? this.parentCoordinationId() : item?.idCoordinacion;

    const coordinationName = productMode
      ? this.parentCoordinationName()
      : item?.coordinacion?.nombre;

    const tipoActividadId = productMode ? this.parentTipoActividadId() : item?.idTipoActividad;

    this.ensureSelectedCoordination(coordinationId, coordinationName);

    this.form.reset({
      nombre: item?.nombre ?? '',
      descripcion: item?.descripcion ?? '',
      actaConsejo: item?.actaConsejo ?? '',
      idTipoActividad: tipoActividadId != null ? String(tipoActividadId) : '',
      idCoordinacion: coordinationId != null ? String(coordinationId) : '',
    });
  }
}
