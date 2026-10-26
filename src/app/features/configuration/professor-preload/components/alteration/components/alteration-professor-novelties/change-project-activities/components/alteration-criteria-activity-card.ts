import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { TipoActividad, TipoActividadCriterio } from '../../../../../../model/professor-activities.model';
import { CoordinationService } from '../../../../../../data/coordination.service';
import { Tooltip } from '../../../../../../../../../shared/ui/tooltip/tooltip';
import { Button } from '../../../../../../../../../shared/ui/button/button';
import { SimpleActivity } from '../../../../../../model/professor-activities-modal.models';
import { NotificationService } from '../../../../../../../../../core/service/notification-service';
import { CRITERIA_ACTIVITY_FIELDS } from '../../../../../../model/professor-activities.config';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Option, Select } from '../../../../../../../../../shared/components/form/select/select';
import { Icon } from '../../../../../../../../../shared/ui/icon/icon';
import { Label } from '../../../../../../../../../shared/components/form/label/label';
import { InputField } from '../../../../../../../../../shared/components/form/input/input-field';

@Component({
  selector: 'app-alteration-criteria-activity-card',
  imports: [
    ReactiveFormsModule,
    Tooltip,
    Button,
    Icon,
    Label,
    Select,
    InputField
  ],
  templateUrl: './alteration-criteria-activity-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlterationCriteriaActivityCard {
  private readonly coordinationService = inject(CoordinationService);
  private readonly notificationService = inject(NotificationService);

  tipoActividad = input<TipoActividad | null>(null);
  addFormOpen = input(false);
  activities = input<SimpleActivity[]>([]);
  readOnly = input(false);
  readOnlyReason = input<string | null>(null);

  addFormOpenChange = output<boolean>();
  activitiesChange = output<SimpleActivity[]>();

  readonly readOnlyMessage = computed(() => this.readOnlyReason() ?? 'La fecha límite para editar actividades ya expiró.');

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

  onRemoveActivity(activityId: string): void {
    if (this.readOnly()) {
      return;
    }

    this.withoutActivity(activityId);
    return;
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
