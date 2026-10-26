import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AbstractControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { merge } from 'rxjs';
import { DatePicker } from '../date-picker/date-picker';

const RANGE_ERROR_KEY = 'dateRange';
const RANGE_ERROR_MESSAGE =
  'La fecha fin debe ser mayor a la fecha incio , por favor corrija la fecha ingresada';

@Component({
  selector: 'app-date-range-picker',
  imports: [ReactiveFormsModule, DatePicker],
  templateUrl: './date-range-picker.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DateRangePicker implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly formGroup = input.required<FormGroup>();
  readonly startControlName = input.required<string>();
  readonly endControlName = input.required<string>();

  readonly startId = input<string>('fechaInicio');
  readonly endId = input<string>('fechaFin');

  readonly startPlaceholder = input<string>('Fecha inicio');
  readonly endPlaceholder = input<string>('Fecha fin');

  readonly startLabel = input<string>('Fecha inicio');
  readonly endLabel = input<string>('Fecha fin');
  readonly showLabels = input<boolean>(false);

  readonly rangeErrorMessage = RANGE_ERROR_MESSAGE;
  readonly rangeInvalid = signal(false);

  readonly resolvedStartLabel = computed(() =>
    this.showLabels() ? this.startLabel() : undefined,
  );

  readonly resolvedEndLabel = computed(() =>
    this.showLabels() ? this.endLabel() : undefined,
  );

  ngOnInit(): void {
    const start = this.getControl(this.startControlName());
    const end = this.getControl(this.endControlName());

    if (!start || !end) {
      return;
    }

    merge(start.valueChanges, end.valueChanges)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.validateDateRange(start, end));

    this.validateDateRange(start, end);
  }

  private getControl(controlName: string): AbstractControl | null {
    return this.formGroup().get(controlName);
  }

  private validateDateRange(
    startControl: AbstractControl,
    endControl: AbstractControl,
  ): void {
    const startValue = this.toDate(startControl.value);
    const endValue = this.toDate(endControl.value);

    const isInvalid =
      startValue != null && endValue != null && endValue <= startValue;

    this.rangeInvalid.set(isInvalid);
    this.setRangeError(endControl, isInvalid);
  }

  private setRangeError(control: AbstractControl, hasError: boolean): void {
    const currentErrors = control.errors ?? {};
    const { [RANGE_ERROR_KEY]: _dateRange, ...otherErrors } = currentErrors;

    const nextErrors = hasError
      ? { ...otherErrors, [RANGE_ERROR_KEY]: true }
      : Object.keys(otherErrors).length > 0
        ? otherErrors
        : null;

    control.setErrors(nextErrors);
  }

  private toDate(value: unknown): Date | null {
    if (typeof value !== 'string' || !value.trim()) {
      return null;
    }

    const date = new Date(`${value.trim()}T00:00:00`);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}