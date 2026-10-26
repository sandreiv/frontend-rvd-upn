import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
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
import { firstValueFrom } from 'rxjs';
import { Button } from '../../../../../shared/ui/button/button';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import {
  Option,
  Select,
} from '../../../../../shared/components/form/select/select';
import { CoordinationService } from '../../../../configuration/professor-preload/data/coordination.service';
import { PreloadCallService } from '../../../../configuration/preload-call/data/preload-call.service';
import {
  CoordinationPreloadCallApi,
} from '../../../../configuration/professor-preload/model/coordination.model';
import {
  PROJECT_CALL_CODIGO_OPTIONS,
  ProjectCallFormData,
  ProjectCallItem,
  resolveProjectCallConvocatoriaId,
} from '../../model/project-calls.model';

type ProjectCallFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  codigo: FormControl<string>;
  convocatoria: FormControl<string>;
}>;

@Component({
  selector: 'app-project-calls-form',
  imports: [ReactiveFormsModule, Label, InputField, Select, Button],
  templateUrl: './project-calls-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCallsForm implements OnInit, OnChanges {
  private readonly coordinationService = inject(CoordinationService);
  private readonly preloadCallService = inject(PreloadCallService);

  projectCall = input<ProjectCallItem | null>(null);
  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveProjectCall = new EventEmitter<ProjectCallFormData>();

  readonly codigoOptions: Option[] = PROJECT_CALL_CODIGO_OPTIONS;
  readonly convocatoriaOptions = signal<Option[]>([]);

  readonly form: ProjectCallFormGroup = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(255)],
    }),
    codigo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    convocatoria: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  async ngOnInit(): Promise<void> {
    await this.loadActivePreloadCalls();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['projectCall']) {
      this.ensureSelectedConvocatoriaOption();
      this.patchForm();
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const raw = this.form.getRawValue();

    this.saveProjectCall.emit({
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim(),
      codigo: raw.codigo,
      idConvocatoria: Number(raw.convocatoria),
    });
  }

  private async loadActivePreloadCalls(): Promise<void> {
    try {
      const calls = await this.loadActivePreloadCallsCatalog();

      this.convocatoriaOptions.set(
        (calls ?? []).map((call) => ({
          value: String(call.id),
          label:
            call.nombre?.trim() ||
            call.descripcion?.trim() ||
            String(call.id),
        })),
      );
    } catch (error) {
      console.error(error);
      this.convocatoriaOptions.set([]);
    } finally {
      this.ensureSelectedConvocatoriaOption();
      this.patchForm();
    }
  }

  private async loadActivePreloadCallsCatalog(): Promise<
    CoordinationPreloadCallApi[]
  > {
    const periods = await firstValueFrom(
      this.preloadCallService.getUniversityPeriod(),
    );

    if (!periods?.length) {
      return [];
    }

    const lists = await Promise.all(
      periods.map((period) =>
        firstValueFrom(
          this.coordinationService.getActivePreloadCall(period.id),
        ),
      ),
    );

    const byId = new Map<number, CoordinationPreloadCallApi>();

    lists.flat().forEach((item) => {
      byId.set(item.id, item);
    });

    return [...byId.values()];
  }

  private ensureSelectedConvocatoriaOption(): void {
    const item = this.projectCall();
    const options = this.convocatoriaOptions();
    const id = resolveProjectCallConvocatoriaId(item, options);
    if (!id) {
      return;
    }

    if (options.some((option) => option.value === id)) {
      return;
    }

    const label = item?.nombreConvocatoria?.trim() || id;
    this.convocatoriaOptions.set([...options, { value: id, label }]);
  }

  private patchForm(): void {
    const item = this.projectCall();
    const options = this.convocatoriaOptions();

    this.form.reset({
      nombre: item?.nombre ?? '',
      descripcion: item?.descripcion ?? '',
      codigo: item?.codigo != null ? String(item.codigo) : '',
      convocatoria: resolveProjectCallConvocatoriaId(item, options),
    });
  }
}
