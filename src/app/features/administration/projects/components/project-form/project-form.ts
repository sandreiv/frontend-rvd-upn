/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Adaptación del formulario para esquema general de proyectos
 * 10/11/2026 - Leonel Antonio Perez Rios - Carga de actividades jerárquicas desde ProjectsService
 * 10/11/2026 - Leonel Antonio Perez Rios - Integración del componente jerárquico tipo árbol (TreeSelect)
 * 10/11/2026 - Leonel Antonio Perez Rios - Refactorización de código limpio, constantes y soporte a subproyectos
 * 13/11/2026 - Inclusión de codigo, numeroActa, fechaActa y activo en el formulario
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
import { Checkbox } from '../../../../../shared/components/form/input/checkbox';
import { DatePicker } from '../../../../../shared/components/form/date-picker/date-picker';
import { Option, Select } from '../../../../../shared/components/form/select/select';
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

const CODIGO_MAX_LENGTH = 50;
const NOMBRE_MAX_LENGTH = 255;
const ACTA_MAX_LENGTH = 100;
const SEARCH_DEBOUNCE_TIME = 300;
const MIN_SEARCH_CHARS = 2;

interface CoordinationOption {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

type ProjectFormGroup = FormGroup<{
  codigo: FormControl<string>;
  nombre: FormControl<string>;
  numeroActa: FormControl<string>;
  fechaActa: FormControl<string>;
  idTipoActividad: FormControl<string>;
  idCoordinacion: FormControl<string>;
  idProyectoGrupo: FormControl<string>;
  activo: FormControl<boolean>;
}>;

@Component({
  selector: 'app-project-form',
  imports: [ReactiveFormsModule, Label, InputField, DatePicker, Checkbox, TreeSelect, Button, TypeaheadSelect, Select],
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

  readonly isSubprojectMode = computed(() => this.parentProjectId() != null);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveProject = new EventEmitter<ProjectFormData>();

  readonly rawTipoActividades = signal<TipoActividadProyectoItem[]>([]);
  readonly filteredCoordinations = signal<CoordinationOption[]>([]);
  readonly projectGroupOptions = signal<Option[]>([]);

  readonly form: ProjectFormGroup = new FormGroup({
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(CODIGO_MAX_LENGTH)],
    }),
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(NOMBRE_MAX_LENGTH)],
    }),
    numeroActa: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(ACTA_MAX_LENGTH)],
    }),
    fechaActa: new FormControl('', {
      nonNullable: true,
    }),
    idTipoActividad: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idCoordinacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idProyectoGrupo: new FormControl('', {
      nonNullable: true,
    }),
    activo: new FormControl(true, {
      nonNullable: true,
    }),
  });

  constructor() {
    this.searchTerm$
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_TIME),
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
    if (this.isSubprojectMode()) {
      return;
    }
    const normalized = term.trim();
    if (normalized.length < MIN_SEARCH_CHARS) {
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

    this.saveProject.emit({
      codigo: raw.codigo.trim() || null,
      nombre: raw.nombre.trim(),
      actaConsejo: raw.numeroActa.trim() || null,
      numeroActa: raw.numeroActa.trim() || null,
      fechaActa: raw.fechaActa || null,
      activo: raw.activo ? '1' : '0',
      idTipoActividad: Number(raw.idTipoActividad),
      idCoordinacion: Number(raw.idCoordinacion),
      idProyectoPadre: this.parentProjectId(),
      idProyectoGrupo: raw.idProyectoGrupo ? Number(raw.idProyectoGrupo) : null,
      estado: raw.activo ? '1' : '0',
    });
  }

  private async loadSelectOptions(): Promise<void> {
    try {
      const [types, groups] = await Promise.all([
        firstValueFrom(this.projectsService.listProjectActivityTypes()),
        firstValueFrom(this.projectsService.listProjectGroups()).catch(() => []),
      ]);
      this.rawTipoActividades.set(types ?? []);
      this.projectGroupOptions.set(
        (groups ?? []).map((g) => ({
          value: String(g.id),
          label: g.nombre,
        })),
      );
    } catch (error) {
      console.error(error);
      this.rawTipoActividades.set([]);
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
    const subprojectMode = this.isSubprojectMode();

    const coordinationId = subprojectMode
      ? this.parentCoordinationId()
      : item?.idCoordinacion;

    const coordinationName = subprojectMode
      ? this.parentCoordinationName()
      : item?.coordinacion?.nombre;

    const tipoActividadId = subprojectMode
      ? this.parentTipoActividadId()
      : item?.idTipoActividad;

    this.ensureSelectedCoordination(coordinationId, coordinationName);

    const isActivo = item?.activo != null ? item.activo === '1' : true;
    const numActa = item?.numeroActa ?? item?.actaConsejo ?? '';
    const fecha = item?.fechaActa ? item.fechaActa.substring(0, 10) : '';

    this.form.reset({
      codigo: item?.codigo ?? '',
      nombre: item?.nombre ?? '',
      numeroActa: numActa,
      fechaActa: fecha,
      idTipoActividad: tipoActividadId != null ? String(tipoActividadId) : '',
      idCoordinacion: coordinationId != null ? String(coordinationId) : '',
      idProyectoGrupo: item?.idProyectoGrupo != null ? String(item.idProyectoGrupo) : '',
      activo: isActivo,
    });
  }
}
