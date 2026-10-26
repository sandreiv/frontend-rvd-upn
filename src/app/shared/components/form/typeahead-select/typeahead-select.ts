import { CommonModule } from '@angular/common';
import {
  Component,
  ContentChild,
  Directive,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  Output,
  TemplateRef,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../../../ui/icon/icon';

export interface TypeaheadOption {
  value: string;
  label: string;
  secondaryLabel?: string;
  badge?: string;
  data?: unknown;
}

@Directive({
  selector: 'ng-template[typeaheadOptionTemplate]',
  standalone: true,
})
export class TypeaheadOptionTemplateDirective {
  constructor(public readonly template: TemplateRef<{ $implicit: TypeaheadOption }>) {}
}

@Directive({
  selector: 'ng-template[typeaheadValueTemplate]',
  standalone: true,
})
export class TypeaheadValueTemplateDirective {
  constructor(public readonly template: TemplateRef<{ $implicit: TypeaheadOption | null }>) {}
}

@Component({
  selector: 'app-typeahead-select',
  standalone: true,
  imports: [CommonModule, Icon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TypeaheadSelect),
      multi: true,
    },
  ],
  templateUrl: './typeahead-select.html',
  styleUrl: './typeahead-select.css',
})
export class TypeaheadSelect implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLElement>);

  @Input() options: TypeaheadOption[] = [];
  @Input() items: unknown[] = [];
  @Input() optionAdapter?: (item: unknown, index: number) => TypeaheadOption;
  @Input() valueKey = 'id';
  @Input() labelKey = 'nombre';
  @Input() secondaryKey = 'modalidad';
  @Input() badgeKey = 'tipo';
  @Input() placeholder = 'Buscar...';
  @Input() mode: 'autocomplete' | 'select' = 'autocomplete';
  @Input() minChars = 2;
  @Input() loading = false;
  @Input() disabled = false;
  @Input() emptyText = 'Sin resultados';
  @Input() className = '';
  @Input() inlineDropdown = false;

  @Output() queryChange = new EventEmitter<string>();
  @Output() optionSelected = new EventEmitter<TypeaheadOption>();
  @Output() itemSelected = new EventEmitter<unknown>();

  @ContentChild(TypeaheadOptionTemplateDirective)
  optionTemplate?: TypeaheadOptionTemplateDirective;

  @ContentChild(TypeaheadValueTemplateDirective)
  valueTemplate?: TypeaheadValueTemplateDirective;

  isOpen = false;
  searchText = '';
  value = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get resolvedOptions(): TypeaheadOption[] {
    if (this.options.length > 0) {
      return this.options;
    }

    return this.items.map((item, index) => this.resolveOptionFromItem(item, index));
  }

  get selectedOption(): TypeaheadOption | null {
    if (!this.value) {
      return null;
    }

    return this.resolvedOptions.find((item) => item.value === this.value) ?? null;
  }

  ngOnChanges(): void {
    this.syncLabelFromValue();
  }

  writeValue(
    value: string | null | undefined,
  ): void {
    this.value = value ?? '';

    if (!this.value) {
      this.searchText = '';
      this.isOpen = false;
      return;
    }

    this.syncLabelFromValue();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    if (this.disabled || this.mode !== 'autocomplete') {
      return;
    }

    const input = event.target as HTMLInputElement;
    this.searchText = input.value;
    this.value = '';
    this.onChange('');

    const query = this.searchText.trim();
    this.queryChange.emit(query);
    this.isOpen = query.length >= this.minChars;
  }

  onFocus(): void {
    if (this.disabled) {
      return;
    }

    if (this.mode === 'select') {
      this.isOpen = true;
      return;
    }

    const query = this.searchText.trim();
    if (query.length >= this.minChars || this.resolvedOptions.length > 0) {
      this.isOpen = true;
    }
  }

  toggleSelectMode(): void {
    if (this.disabled || this.mode !== 'select') {
      return;
    }

    this.isOpen = !this.isOpen;
  }

  selectOption(option: TypeaheadOption): void {
    if (this.disabled) {
      return;
    }

    this.value = option.value;
    this.searchText = option.label;
    this.onChange(option.value);
    this.optionSelected.emit(option);
    this.itemSelected.emit(option.data ?? option);
    this.isOpen = false;
    this.onTouched();
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    const target = event.target as Node | null;
    if (!target) {
      return;
    }

    if (!this.el.nativeElement.contains(target)) {
      this.isOpen = false;
      this.onTouched();
    }
  }

  get inputClasses(): string {
    let classes =
      'h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30';

    if (this.disabled) {
      classes +=
        ' text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700';
    } else {
      classes +=
        ' bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800';
    }

    return `${classes} ${this.className}`.trim();
  }

  private syncLabelFromValue(): void {
    if (!this.value) {
      if (this.mode === 'select') {
        this.searchText = '';
      }
      return;
    }

    const selected = this.resolvedOptions.find((item) => item.value === this.value);
    if (selected) {
      this.searchText = selected.label;
    }
  }

  private resolveOptionFromItem(item: unknown, index: number): TypeaheadOption {
    if (this.optionAdapter) {
      return this.optionAdapter(item, index);
    }

    const record = (item ?? {}) as Record<string, unknown>;
    const value = this.normalizeString(record['value'] ?? record[this.valueKey]) || `item-${index}`;
    const label =
      this.normalizeString(record['label'] ?? record[this.labelKey] ?? record['name']) || value;

    return {
      value,
      label,
      secondaryLabel: this.normalizeString(record['secondaryLabel'] ?? record[this.secondaryKey]),
      badge: this.normalizeString(record['badge'] ?? record[this.badgeKey]),
      data: item,
    };
  }

  private normalizeString(value: unknown): string {
    if (value == null) {
      return '';
    }

    return String(value).trim();
  }
}

