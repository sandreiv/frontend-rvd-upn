import { Component, ElementRef, EventEmitter, forwardRef, Input, Output, ViewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import flatpickr from 'flatpickr';
import 'flatpickr/dist/flatpickr.css';
import { Label } from '../label/label';

@Component({
  selector: 'app-date-picker',
  imports: [Label],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePicker),
      multi: true,
    },
  ],
  templateUrl: './date-picker.html',
  styleUrl: './date-picker.css',
})
export class DatePicker implements ControlValueAccessor {
  @Input() id!: string;
  @Input() mode: 'single' | 'multiple' | 'range' | 'time' = 'single';
  @Input() defaultDate?: string | Date | string[] | Date[];
  @Input() label?: string;
  @Input() placeholder?: string;
  @Input() minDate?: string | Date;
  @Output() dateChange = new EventEmitter<any>();

  @ViewChild('dateInput', { static: false }) dateInput!: ElementRef<HTMLInputElement>;

  private flatpickrInstance: flatpickr.Instance | undefined;
  private value = '';
  disabled = false;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  ngAfterViewInit() {
    const initialValue = this.value || this.resolveDefaultDate(this.defaultDate);

    this.flatpickrInstance = flatpickr(this.dateInput.nativeElement, {
      mode: this.mode,
      static: false,
      appendTo: document.body,
      positionElement: this.dateInput.nativeElement,
      monthSelectorType: 'static',
      dateFormat: 'Y-m-d',
      defaultDate: initialValue || undefined,
      minDate: this.minDate || undefined,
      onChange: (selectedDates, dateStr, instance) => {
        this.value = dateStr;
        this.onChange(dateStr);
        this.dateChange.emit({ selectedDates, dateStr, instance });
      },
      onClose: () => this.onTouched(),
    });

    this.flatpickrInstance.calendarContainer.classList.add('app-date-picker-calendar');

    if (this.disabled) {
      this.flatpickrInstance.input.disabled = true;
    }
  }

  ngOnDestroy() {
    if (this.flatpickrInstance) {
      this.flatpickrInstance.destroy();
    }
  }

  writeValue(value: string | null): void {
    this.value = value ?? '';

    if (!this.flatpickrInstance) {
      return;
    }

    if (!this.value) {
      this.flatpickrInstance.clear();
      return;
    }

    this.flatpickrInstance.setDate(this.value, false, 'Y-m-d');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
    if (this.flatpickrInstance) {
      this.flatpickrInstance.input.disabled = isDisabled;
    }
  }

  markTouched(): void {
    this.onTouched();
  }

  private resolveDefaultDate(defaultDate?: string | Date | string[] | Date[]): string {
    if (!defaultDate) {
      return '';
    }

    if (typeof defaultDate === 'string') {
      return defaultDate;
    }

    if (Array.isArray(defaultDate) && defaultDate.length > 0) {
      return typeof defaultDate[0] === 'string'
        ? defaultDate[0]
        : this.toDateOnly(defaultDate[0] as Date);
    }

    if (defaultDate instanceof Date) {
      return this.toDateOnly(defaultDate);
    }

    return '';
  }

  private toDateOnly(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
