import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import TimepickerUI from 'timepicker-ui';

@Component({
  selector: 'app-time-picker',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimePicker),
      multi: true,
    },
  ],
  templateUrl: './time-picker.html',
  styleUrl: './time-picker.css',
})
export class TimePicker implements AfterViewInit, OnChanges, OnDestroy, ControlValueAccessor {
  @Input() id?: string;
  @Input() label?: string;
  @Input() placeholder: string = '00:00';
  @Input() value: string = '';
  @Input() disabled: boolean = false;
  @Input() className: string = '';

  @Output() valueChange = new EventEmitter<string>();
  @Output() timeChange = new EventEmitter<string>();

  @ViewChild('containerRef', { static: false }) containerRef!: ElementRef<HTMLDivElement>;
  @ViewChild('timeInput', { static: false }) timeInput!: ElementRef<HTMLInputElement>;

  private pickerInstance?: TimepickerUI;
  isOpen: boolean = false;
  private onChange: (val: string) => void = () => {};
  onTouched: () => void = () => {};

  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.isOpen) {
      this.positionPicker();
    }
  }

  onInputPointerDown(): void {
    this.calcAndSetCoordinates();
  }

  onInputClick(): void {
    this.calcAndSetCoordinates();
    this.isOpen = true;
    this.positionPicker();
  }

  ngAfterViewInit(): void {
    if (this.timeInput?.nativeElement) {
      this.timeInput.nativeElement.value = this.to12HourDisplay(this.value);
    }
    this.initPicker();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value'] && !changes['value'].firstChange) {
      if (this.timeInput?.nativeElement) {
        this.timeInput.nativeElement.value = this.to12HourDisplay(this.value);
      }
    }
  }

  ngOnDestroy(): void {
    if (this.pickerInstance) {
      try {
        this.pickerInstance.destroy();
      } catch {
        // safe destroy
      }
    }
  }

  writeValue(val: string | null): void {
    this.value = val ?? '';
    if (this.timeInput?.nativeElement) {
      this.timeInput.nativeElement.value = this.to12HourDisplay(this.value);
    }
  }

  registerOnChange(fn: (val: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  private initPicker(): void {
    if (!this.containerRef?.nativeElement) {
      return;
    }

    try {
      this.pickerInstance = new TimepickerUI(this.containerRef.nativeElement, {
        clock: {
          type: '12h',
          autoSwitchToMinutes: true,
        },
        ui: {
          backdrop: true,
        },
        labels: {
          ok: 'Aceptar',
          cancel: 'Cancelar',
          time: 'Seleccionar hora',
          am: 'AM',
          pm: 'PM',
        },
        callbacks: {
          onShow: () => {
            this.calcAndSetCoordinates();
            this.isOpen = true;
          },
          onOpen: () => {
            this.isOpen = true;
            this.positionPicker();
          },
          onSwitchFace: () => {
            this.positionPicker();
          },
          onSwitchView: () => {
            this.positionPicker();
          },
          onCancel: () => {
            this.isOpen = false;
          },
          onConfirm: (data: { hour?: string | number; minutes?: string | number; type?: string; value?: string }) => {
            this.isOpen = false;
            const time24 = this.extract24Hour(data);
            if (time24) {
              this.handleTimeSelected(time24);
            }
          },
          onUpdate: (data: { hour?: string | number; minutes?: string | number; type?: string; value?: string }) => {
            const time24 = this.extract24Hour(data);
            if (time24) {
              this.handleTimeSelected(time24);
            }
          },
        },
      });

      this.pickerInstance.create();
    } catch {
      // safe fallback
    }
  }

  private calcAndSetCoordinates(): void {
    if (!this.timeInput?.nativeElement) {
      return;
    }
    const rect = this.timeInput.nativeElement.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) {
      return;
    }

    const pickerWidth = 300;
    const pickerHeight = 402;
    const gap = 4;
    const margin = 8;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top: number;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow >= pickerHeight + gap || spaceBelow >= spaceAbove) {
      top = rect.bottom + gap;
      if (top + pickerHeight > viewportHeight - margin) {
        top = Math.max(margin, viewportHeight - pickerHeight - margin);
      }
    } else {
      top = rect.top - pickerHeight - gap;
      if (top < margin) {
        top = margin;
      }
    }

    let left: number;
    if (rect.left + pickerWidth <= viewportWidth - margin) {
      left = rect.left;
    } else {
      left = rect.right - pickerWidth;
    }

    if (left + pickerWidth > viewportWidth - margin) {
      left = viewportWidth - pickerWidth - margin;
    }
    if (left < margin) {
      left = margin;
    }

    const topPx = `${Math.round(top)}px`;
    const leftPx = `${Math.round(left)}px`;

    document.documentElement.style.setProperty('--tp-popup-top', topPx);
    document.documentElement.style.setProperty('--tp-popup-left', leftPx);
  }

  private positionPicker(): void {
    this.calcAndSetCoordinates();

    const applyPosition = () => {
      const wrapper = document.querySelector('.tp-ui-wrapper') as HTMLElement | null;
      if (!wrapper || !this.timeInput?.nativeElement) {
        return;
      }

      this.calcAndSetCoordinates();

      const topPx = document.documentElement.style.getPropertyValue('--tp-popup-top');
      const leftPx = document.documentElement.style.getPropertyValue('--tp-popup-left');

      wrapper.style.setProperty('position', 'fixed', 'important');
      wrapper.style.setProperty('top', topPx, 'important');
      wrapper.style.setProperty('left', leftPx, 'important');
      wrapper.style.setProperty('transform', 'none', 'important');
      wrapper.style.setProperty('margin', '0', 'important');
    };

    applyPosition();
    requestAnimationFrame(applyPosition);
  }

  private handleTimeSelected(time24: string): void {
    this.value = time24;
    if (this.timeInput?.nativeElement) {
      this.timeInput.nativeElement.value = this.to12HourDisplay(time24);
    }
    this.onChange(time24);
    this.onTouched();
    this.valueChange.emit(time24);
    this.timeChange.emit(time24);
  }

  private to12HourDisplay(val: string): string {
    if (!val) {
      return '';
    }
    const clean = val.trim();
    if (clean.toUpperCase().includes('AM') || clean.toUpperCase().includes('PM')) {
      return clean;
    }
    const parts = clean.split(':');
    if (parts.length < 2) {
      return clean;
    }
    let h = parseInt(parts[0], 10);
    const m = parts[1].slice(0, 2).padStart(2, '0');
    if (isNaN(h)) {
      return clean;
    }
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) {
      h = 12;
    }
    return `${String(h).padStart(2, '0')}:${m} ${period}`;
  }

  private to24Hour(hourStr: string | number, minStr: string | number, typeStr?: string): string {
    let hour = parseInt(String(hourStr || '0'), 10);
    const minutes = String(minStr || '0').padStart(2, '0');
    const type = (typeStr || '').trim().toUpperCase();

    if (type === 'PM' && hour < 12) {
      hour += 12;
    } else if (type === 'AM' && hour === 12) {
      hour = 0;
    }

    return `${String(hour).padStart(2, '0')}:${minutes}`;
  }

  private parseTo24Hour(val: string): string {
    if (!val) {
      return '';
    }
    const clean = val.trim();
    const match = clean.match(/(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?/);
    if (!match) {
      return clean;
    }
    let h = parseInt(match[1], 10);
    const m = match[2];
    const period = match[3] ? match[3].toUpperCase() : null;

    if (period === 'PM' && h < 12) {
      h += 12;
    } else if (period === 'AM' && h === 12) {
      h = 0;
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  private extract24Hour(data: { hour?: string | number; minutes?: string | number; type?: string; value?: string }): string {
    if (!data) {
      return '';
    }
    if (data.hour != null && data.minutes != null && data.type) {
      return this.to24Hour(data.hour, data.minutes, data.type);
    }
    if (data.value) {
      return this.parseTo24Hour(data.value);
    }
    return '';
  }
}
