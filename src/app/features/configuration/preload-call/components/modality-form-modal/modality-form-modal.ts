import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { merge } from 'rxjs';
import { DateRangePicker } from '../../../../../shared/components/form/date-range-picker/date-range-picker';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import {
  Option,
  Select,
} from '../../../../../shared/components/form/select/select';
import { Button } from '../../../../../shared/ui/button/button';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { ModalityFormItem } from '../../model/preload-call.model';
import { resolveModalityKind } from '../../../professor-preload/model/professor-form.config';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Semanas equivalentes a 4 meses (4 * 52 / 12 ≈ 17.3).
 * Coincide con el rango de 4 meses registrado en las convocatorias.
 */
const SEMANAS_CUATRO_MESES = 17;

/**
 * Semanas equivalentes a 11 meses (11 * 52 / 12 ≈ 47.67).
 * Mismo criterio que FechasConvocatoriaCalculator.SEMANAS_ONCE_MESES del backend.
 */
const SEMANAS_ONCE_MESES = 48;

/**
 * Tolerancia de 4 semanas por encima y por debajo del valor de referencia,
 * para admitir rangos cercanos a los 4 y 11 meses.
 */
const MARGEN_SEMANAS = 4;

const SEMANAS_MIN_CUATRO_MESES = SEMANAS_CUATRO_MESES - MARGEN_SEMANAS;
const SEMANAS_MAX_CUATRO_MESES = SEMANAS_CUATRO_MESES + MARGEN_SEMANAS;
const SEMANAS_MIN_ONCE_MESES = SEMANAS_ONCE_MESES - MARGEN_SEMANAS;
const SEMANAS_MAX_ONCE_MESES = SEMANAS_ONCE_MESES + MARGEN_SEMANAS;

@Component({
  selector: 'app-modality-form-modal',
  imports: [
    ReactiveFormsModule,
    Modal,
    Label,
    Select,
    InputField,
    DateRangePicker,
    Button,
  ],
  templateUrl: './modality-form-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalityFormModal {
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private semanasManuallyEdited = false;

  readonly isOpen = input(false);
  readonly modalityOptions = input<Option[]>([]);
  readonly editingItem = input<ModalityFormItem | null>(null);
  readonly isHiringCall = input(false);

  readonly close = output<void>();
  readonly saved = output<ModalityFormItem>();

  readonly isEditMode = computed(() => this.editingItem() != null);
  readonly modalTitle = computed(() =>
    this.isEditMode() ? 'Editar modalidad' : 'Agregar modalidad',
  );
  readonly saveButtonLabel = computed(() =>
    this.isEditMode() ? 'Actualizar' : 'Agregar',
  );

  readonly isTiempoCompletoOcasionalSelected = computed(() => {
    const tipoModalidad = this.tipoModalidadValue();
    const label =
      this.modalityOptions().find((opt) => opt.value === tipoModalidad)?.label ??
      tipoModalidad ??
      null;

    return resolveModalityKind(label) === 'tiempoCompletoOcasional';
  });

  /**
   * La modalidad cátedra no maneja días de vacaciones: el campo queda
   * deshabilitado y no se envía valor al guardar.
   */
  readonly isCatedraSelected = computed(() => {
    const tipoModalidad = this.tipoModalidadValue();
    const label =
      this.modalityOptions().find((opt) => opt.value === tipoModalidad)?.label ??
      tipoModalidad ??
      null;

    return resolveModalityKind(label) === 'catedra';
  });

  readonly form = this.fb.group({
    tipoModalidad: ['', Validators.required],
    diasVacaciones: [''],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    semanas: ['', Validators.required],
  });

  private readonly tipoModalidadValue = toSignal(
    this.form.controls.tipoModalidad.valueChanges,
    { initialValue: this.form.controls.tipoModalidad.value },
  );

  private readonly fechaInicioValue = toSignal(
    this.form.controls.fechaInicio.valueChanges,
    { initialValue: this.form.controls.fechaInicio.value },
  );

  private readonly fechaFinValue = toSignal(
    this.form.controls.fechaFin.valueChanges,
    { initialValue: this.form.controls.fechaFin.value },
  );

  /**
   * Modalidad de tiempo completo ocasional con rango de 4 o 11 meses
   * (con 4 semanas de tolerancia por encima y por debajo):
   * las semanas quedan bloqueadas y se toman del rango de fechas.
   */
  readonly isSemanasBloqueadas = computed(() => {
    if (!this.isTiempoCompletoOcasionalSelected()) {
      return false;
    }

    const semanas = this.calculateWeeks(
      this.fechaInicioValue() ?? '',
      this.fechaFinValue() ?? '',
    );

    if (semanas == null) {
      return false;
    }

    const enRangoCuatroMeses =
      semanas >= SEMANAS_MIN_CUATRO_MESES && semanas <= SEMANAS_MAX_CUATRO_MESES;
    const enRangoOnceMeses =
      semanas >= SEMANAS_MIN_ONCE_MESES && semanas <= SEMANAS_MAX_ONCE_MESES;

    return enRangoCuatroMeses || enRangoOnceMeses;
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const item = this.editingItem();

      if (!open) {
        this.form.reset();
        this.semanasManuallyEdited = false;
        this.syncDateFieldsState();
        return;
      }

      if (!item) {
        this.form.reset();
        this.semanasManuallyEdited = false;
        this.syncDateFieldsState();
        return;
      }

      this.semanasManuallyEdited = true;
      this.form.patchValue({
        tipoModalidad: item.tipoModalidad,
        diasVacaciones:
          item.diasVacaciones != null ? String(item.diasVacaciones) : '',
        fechaInicio: item.fechaInicio ?? '',
        fechaFin: item.fechaFin ?? '',
        semanas: item.semanas != null ? String(item.semanas) : '',
      });

      this.syncDateFieldsState();
    });

    this.form.controls.tipoModalidad.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.syncSemanasFromDates();
        this.syncDateFieldsState();
      });

    merge(
      this.form.controls.fechaInicio.valueChanges,
      this.form.controls.fechaFin.valueChanges,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.syncSemanasFromDates();
        this.syncDateFieldsState();
      });
  }

  onSemanasManualEdit(): void {
    this.semanasManuallyEdited = true;
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const tipoModalidad = this.form.controls.tipoModalidad.value ?? '';
    const label =
      this.modalityOptions().find((opt) => opt.value === tipoModalidad)
        ?.label ?? tipoModalidad;
    const rawValues = this.form.getRawValue();
    const diasRaw = rawValues.diasVacaciones;
    const semanasRaw = rawValues.semanas;
    const diasVacaciones = diasRaw === '' || diasRaw == null ? null : Number(diasRaw);

    const editing = this.editingItem();
    const skipDateFields = this.isHiringCall();
    const skipVacaciones = this.isCatedraSelected();

    // Con las semanas bloqueadas el valor es el calculado desde el rango de fechas.
    const semanasCalculadas = this.calculateWeeks(
      rawValues.fechaInicio ?? '',
      rawValues.fechaFin ?? '',
    );
    const semanas =
      this.isSemanasBloqueadas() && semanasCalculadas != null
        ? semanasCalculadas
        : semanasRaw === '' || semanasRaw == null
          ? null
          : Number(semanasRaw);

    this.saved.emit({
      id: editing?.id ?? '',
      cotcId: editing?.cotcId,
      fechaId: editing?.fechaId,
      tipoModalidad,
      tipoModalidadLabel: label,
      diasVacaciones:
        this.isHiringCall() || skipVacaciones ? null : diasVacaciones,
      fechaInicio: skipDateFields
        ? null
        : this.form.controls.fechaInicio.value ?? '',
      fechaFin: skipDateFields
        ? null
        : this.form.controls.fechaFin.value ?? '',
      semanas: skipDateFields ? null : semanas,
    });

    this.close.emit();
  }

  private syncSemanasFromDates(): void {
    if (this.isHiringCall()) {
      return;
    }

    // Con las semanas bloqueadas el valor siempre proviene del rango de fechas.
    if (this.semanasManuallyEdited && !this.isSemanasBloqueadas()) {
      return;
    }

    const inicio = this.form.controls.fechaInicio.value ?? '';
    const fin = this.form.controls.fechaFin.value ?? '';
    const semanas = this.calculateWeeks(inicio, fin);

    this.form.controls.semanas.patchValue(
      semanas != null ? String(semanas) : '',
      { emitEvent: false },
    );
  }

  private calculateWeeks(fechaInicio: string, fechaFin: string): number | null {
    const inicio = fechaInicio.trim();
    const fin = fechaFin.trim();
    if (!inicio || !fin) {
      return null;
    }

    const start = new Date(`${inicio}T00:00:00`);
    const end = new Date(`${fin}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return null;
    }
    if (end < start) {
      return null;
    }

    const diffDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;
    const weeks = diffDays / 7;
    const fraction = weeks % 1;
    const whole = Math.floor(weeks);
    return fraction >= 0.5 ? whole + 1 : whole;
  }

  private syncDateFieldsState(): void {
    const skipDateFields = this.isHiringCall();
    const lockSemanas = this.isSemanasBloqueadas();

    const fechaInicio = this.form.controls.fechaInicio;
    const fechaFin = this.form.controls.fechaFin;
    const semanas = this.form.controls.semanas;

    if (skipDateFields) {
      fechaInicio.clearValidators();
      fechaFin.clearValidators();
      semanas.clearValidators();

      fechaInicio.setValue('', { emitEvent: false });
      fechaFin.setValue('', { emitEvent: false });
      semanas.setValue('', { emitEvent: false });

      fechaInicio.disable({ emitEvent: false });
      fechaFin.disable({ emitEvent: false });
      semanas.disable({ emitEvent: false });

      fechaInicio.updateValueAndValidity({ emitEvent: false });
      fechaFin.updateValueAndValidity({ emitEvent: false });
      semanas.updateValueAndValidity({ emitEvent: false });
      return;
    }

    fechaInicio.enable({ emitEvent: false });
    fechaFin.enable({ emitEvent: false });

    fechaInicio.setValidators(Validators.required);
    fechaFin.setValidators(Validators.required);

    fechaInicio.updateValueAndValidity({ emitEvent: false });
    fechaFin.updateValueAndValidity({ emitEvent: false });

    if (lockSemanas) {
      semanas.disable({ emitEvent: false });
      semanas.setValidators([]);
      semanas.updateValueAndValidity({ emitEvent: false });
      return;
    }

    semanas.enable({ emitEvent: false });
    semanas.setValidators(Validators.required);
    semanas.updateValueAndValidity({ emitEvent: false });
  }
}
