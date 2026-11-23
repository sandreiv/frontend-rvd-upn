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
import { firstValueFrom } from 'rxjs';
import { Button } from '../../../../../shared/ui/button/button';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import { Checkbox } from '../../../../../shared/components/form/input/checkbox';
import { DatePicker } from '../../../../../shared/components/form/date-picker/date-picker';
import { Option, Select } from '../../../../../shared/components/form/select/select';
import { TreeSelect } from '../../../../../shared/components/form/tree-select/tree-select';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { ProjectsService } from '../../data/projects.service';
import {
  ProjectFormData,
  ProjectItem,
  TipoActividadProyectoItem,
} from '../../model/projects.model';

const CODIGO_MAX_LENGTH = 50;
const NOMBRE_MAX_LENGTH = 255;
const ACTA_MAX_LENGTH = 100;

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
  imports: [ReactiveFormsModule, Label, InputField, DatePicker, Checkbox, TreeSelect, Button, Select, Icon],
  templateUrl: './project-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectForm implements OnInit, OnChanges {
  private readonly projectsService = inject(ProjectsService);

  project = input<ProjectItem | null>(null);
  isSaving = input(false);
  readOnly = input(false);
  title = input('Nuevo proyecto');
  editTitle = input('Editar proyecto');
  description = input('Registra la información básica del proyecto.');
  parentProjectId = input<number | null>(null);
  parentCoordinationId = input<number | null>(null);
  parentCoordinationName = input('');
  parentTipoActividadId = input<number | null>(null);

  readonly isSubprojectMode = computed(() => this.parentProjectId() != null);

  readonly displayCoordinacionNombre = computed(() => {
    let raw = '';
    if (this.isSubprojectMode()) {
      raw = this.parentCoordinationName() || 'No asignada';
    } else {
      const item = this.project();
      raw = item?.coordinacion?.nombre || this.parentCoordinationName() || 'No asignada';
    }
    return this.formatTitleCase(raw);
  });

  @Output() cancel = new EventEmitter<void>();
  @Output() saveProject = new EventEmitter<ProjectFormData>();

  readonly rawTipoActividades = signal<TipoActividadProyectoItem[]>([]);
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
      changes['parentTipoActividadId'] ||
      changes['readOnly']
    ) {
      this.patchForm();
    }
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

  private patchForm(): void {
    const item = this.project();
    const subprojectMode = this.isSubprojectMode();

    const coordinationId = subprojectMode
      ? this.parentCoordinationId()
      : (item?.idCoordinacion ?? this.parentCoordinationId());

    const coordinationName = subprojectMode
      ? this.parentCoordinationName()
      : (item?.coordinacion?.nombre ?? this.parentCoordinationName());

    const tipoActividadId = subprojectMode
      ? this.parentTipoActividadId()
      : item?.idTipoActividad;

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

    if (this.readOnly()) {
      this.form.disable();
    } else {
      this.form.enable();
    }
  }

  private formatTitleCase(text: string): string {
    if (!text) {
      return '';
    }
    const lowerWords = new Set([
      'de',
      'del',
      'la',
      'las',
      'el',
      'los',
      'en',
      'y',
      'e',
      'o',
      'u',
      'a',
      'por',
      'para',
    ]);
    return text
      .toLowerCase()
      .split(/\s+/)
      .map((word, index) => {
        if (index > 0 && lowerWords.has(word)) {
          return word;
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }
}
