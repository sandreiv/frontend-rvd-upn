import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  DestroyRef
} from '@angular/core';
import { rxResource, takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Label } from '../../../../../../../shared/components/form/label/label';
import {
  Option,
  Select,
} from '../../../../../../../shared/components/form/select/select';
import { InputField } from '../../../../../../../shared/components/form/input/input-field';
import { Button } from '../../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../../shared/ui/icon/icon';
import { CoordinationService } from '../../../../data/coordination.service';
import { CRITERIA_ACTIVITY_FIELDS } from '../../../../model/professor-activities.config';
import {
  TipoActividad,
  TipoActividadCriterio,
} from '../../../../model/professor-activities.model';
import { SimpleActivity } from '../../../../model/professor-activities-modal.models';
import { Tooltip } from '../../../../../../../shared/ui/tooltip/tooltip';
import { NotificationService } from '../../../../../../../core/service/notification-service';

@Component({
  selector: 'app-criteria-activity-card',
  imports: [
    ReactiveFormsModule,
    Label,
    Select,
    InputField,
    Button,
    Icon,
    Tooltip,
  ],
  templateUrl: './criteria-activity-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CriteriaActivityCard {
  private readonly coordinationService = inject(CoordinationService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  tipoActividad = input<TipoActividad | null>(null);
  addFormOpen = input(false);
  activities = input<SimpleActivity[]>([]);

  readOnly = input(false);
  readOnlyReason = input<string | null>(null);
  persistDeletes = input(true);

  isRegistrationProcessed = input(false);
  

  readonly readOnlyMessage = computed(
    () =>
      this.readOnlyReason() ??
      'La coordinación no está habilitada para edición en esta convocatoria.',
  );

  addFormOpenChange = output<boolean>();
  activitiesChange = output<SimpleActivity[]>();
  activityDeleted = output<void>();

  readonly formFields = CRITERIA_ACTIVITY_FIELDS;

  readonly form = new FormGroup({
    idCriterio: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    horasDedicacion: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
    }),
  });


  readonly selectedIdCriterio = toSignal(
    this.form.controls.idCriterio.valueChanges,
    { initialValue: '' }
  );

  readonly horasDedicacion = toSignal(
    this.form.controls.horasDedicacion.valueChanges,
    { initialValue: null }
  );

  readonly selectedCriterio = computed(() => 
    this.criteriaResource
      .value()
      .find((item) => String(item.id) === this.selectedIdCriterio())
  );

  readonly horasValidation = computed(() => {
    const criterio = this.selectedCriterio();
    const horas = this.horasDedicacion();

    if (!criterio || horas == null) {
      return {
        valid: false,
        bajoMinimo: false,
        sobreMaximo: false,
        minimo: false,
        maximo: false
      };
    }

    const minimo = Number(criterio.minimoHoras);
    const maximo = Number(criterio.maximoHoras);

    return {
      valid: (horas >= minimo) && (horas <= maximo),
      bajoMinimo: horas < minimo,
      sobreMaximo: horas > maximo,
      minimo,
      maximo
    };
  });


  private readonly criteriaResource = rxResource({
    params: () => {
      const idTipoActividad = this.tipoActividad()?.id;
      if (idTipoActividad == null) {
        return undefined;
      }
      return { idTipoActividad };
    },
    stream: ({ params }) =>
      this.coordinationService.listCriteria(params.idTipoActividad),
    defaultValue: [] as TipoActividadCriterio[],
  });

  readonly criteriaOptions = computed<Option[]>(() =>
    this.criteriaResource.value().map((item) => ({
      value: String(item.id),
      label: item.nombre,
    })),
  );

  toggleAddForm(): void {
    if (this.readOnly()) {
      return;
    }

    this.addFormOpenChange.emit(!this.addFormOpen());
  }

  cancelAddForm(): void {
    this.resetForm();
    this.addFormOpenChange.emit(false);
  }

  onAddActivity(): void {

    if (this.readOnly()) {
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const activity = this.buildActivityRow();
    if (!activity) {
      return;
    }

    const llaveActividad = this.buildIndirectActivityKey(activity);
    const isDuplicate = this.activities().some(
      (existingActivity) =>
        this.buildIndirectActivityKey(existingActivity) === llaveActividad,
    );

    if (isDuplicate) {
      this.notificationService.warning(
        'La actividad seleccionada ya fue agregada.',
        'Actividad duplicada',
      );
      return;
    }

    this.activitiesChange.emit([...this.activities(), activity]);
    this.resetForm();
    this.addFormOpenChange.emit(false);
  }

  removeActivity(activityId: string): void {
    if (this.readOnly() || this.isRegistrationProcessed()) {
      return;
    }

    const activity = this.activities().find((item) => item.id === activityId);
    if (
      !this.persistDeletes() ||
      activity?.idDetalleCargaDocente == null
    ) {
      this.withoutActivity(activityId);
      return;
    }

    this.coordinationService
    .deleteProfessorActivity(activity.idDetalleCargaDocente)
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(() => {
      this.withoutActivity(activityId);
      this.activityDeleted.emit();
    });

  }

  private withoutActivity(activityId: string): void{
    this.activitiesChange.emit(
      this.activities().filter((item) => item.id !== activityId)
    );
  }

  private buildActivityRow(): SimpleActivity | null {
    const criterio = this.findSelectedCriteria();
    const horas = this.form.controls.horasDedicacion.value;

    if (!criterio || horas == null) {
      return null;
    }

    return {
      id: `criteria-${Date.now()}`,
      actividad: criterio.nombre,
      horasDedicacion: horas,
      idTipoActividadHija: criterio.id,
    };
  }

  private findSelectedCriteria(): TipoActividadCriterio | undefined {
    const id = this.form.controls.idCriterio.value;
    return this.criteriaResource
      .value()
      .find((item) => String(item.id) === id);
  }

  private resetForm(): void {
    this.form.reset({
      idCriterio: '',
      horasDedicacion: null,
    });
  }

  private buildIndirectActivityKey(activity: SimpleActivity): string {
    return [
      activity.idTipoActividadHija
    ].join('|');
  }
}
