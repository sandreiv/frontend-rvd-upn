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
import { Button } from '../../../../../shared/ui/button/button';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import { Checkbox } from '../../../../../shared/components/form/input/checkbox';
import { Option, Select } from '../../../../../shared/components/form/select/select';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { ProjectCallsService } from '../../data/project-calls.service';
import {
  ConvocatoriaOpcion,
  ProjectCallFormData,
  ProjectCallItem,
} from '../../model/project-calls.model';

type ProjectCallFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  esActivo: FormControl<boolean>;
}>;

@Component({
  selector: 'app-project-calls-form',
  imports: [ReactiveFormsModule, Label, InputField, Checkbox, Select, Icon, Button],
  templateUrl: './project-calls-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCallsForm implements OnInit, OnChanges {
  private readonly projectCallsService = inject(ProjectCallsService);

  projectCall = input<ProjectCallItem | null>(null);
  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveProjectCall = new EventEmitter<ProjectCallFormData>();

  readonly availableConvocatorias = signal<ConvocatoriaOpcion[]>([]);
  readonly selectedConvocatoriaIds = signal<number[]>([]);
  readonly tempConvocatoriaSelect = signal<string>('');

  readonly selectedConvocatorias = computed<ConvocatoriaOpcion[]>(() => {
    const selectedIds = new Set(this.selectedConvocatoriaIds());
    return this.availableConvocatorias().filter((c) => selectedIds.has(c.id));
  });

  readonly convocatoriaSelectOptions = computed<Option[]>(() => {
    const selectedIds = new Set(this.selectedConvocatoriaIds());
    return this.availableConvocatorias()
      .filter((c) => !selectedIds.has(c.id))
      .map((c) => ({
        value: String(c.id),
        label: c.periodo ? `${c.nombre} (${c.periodo})` : c.nombre,
      }));
  });

  readonly form: ProjectCallFormGroup = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(250)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    esActivo: new FormControl(true, {
      nonNullable: true,
    }),
  });

  ngOnInit(): void {
    this.loadConvocatorias();
    this.patchForm();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectCall']) {
      this.patchForm();
    }
  }

  private loadConvocatorias(): void {
    this.projectCallsService.listAvailableConvocatorias().subscribe({
      next: (list) => {
        this.availableConvocatorias.set(list ?? []);
      },
      error: (e) => console.error(e),
    });
  }

  private patchForm(): void {
    const item = this.projectCall();
    if (!item) {
      this.form.reset({
        nombre: '',
        descripcion: '',
        esActivo: true,
      });
      this.selectedConvocatoriaIds.set([]);
      this.tempConvocatoriaSelect.set('');
      return;
    }

    this.form.patchValue({
      nombre: item.nombre ?? '',
      descripcion: item.descripcion ?? '',
      esActivo: item.estado !== '0',
    });

    const ids = (item.convocatorias ?? []).map((c) => c.id);
    this.selectedConvocatoriaIds.set(ids);
    this.tempConvocatoriaSelect.set('');
  }

  onConvocatoriaSelected(val: string): void {
    if (!val) {
      return;
    }
    const id = Number(val);
    if (!Number.isNaN(id) && !this.selectedConvocatoriaIds().includes(id)) {
      this.selectedConvocatoriaIds.set([...this.selectedConvocatoriaIds(), id]);
    }
    // Limpia el select para permitir la siguiente selección
    setTimeout(() => this.tempConvocatoriaSelect.set(''), 0);
  }

  removeConvocatoria(id: number): void {
    this.selectedConvocatoriaIds.set(
      this.selectedConvocatoriaIds().filter((item) => item !== id),
    );
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: ProjectCallFormData = {
      nombre: this.form.controls.nombre.value.trim(),
      descripcion: this.form.controls.descripcion.value.trim(),
      estado: this.form.controls.esActivo.value ? '1' : '0',
      idConvocatorias: this.selectedConvocatoriaIds(),
    };

    this.saveProjectCall.emit(payload);
  }
}
