import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  ElementRef,
  HostListener,
  computed,
  forwardRef,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Icon } from '../../../ui/icon/icon';
import { formatSentenceValue } from '../../../utils/normalized-text.util';

export interface Option {
  value: string;
  label: string;
  group?: string;
  badge?: string;
  disabled?: boolean;
}

type NormalizedOption = Option & {
  label: string;
  group?: string;
  badge?: string;
  disabled?: boolean;
};

type SelectPanelItem =
  | { type: 'group'; key: string; label: string }
  | { type: 'option'; key: string; option: NormalizedOption };

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, Icon],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Select),
      multi: true,
    },
  ],
  templateUrl: './select.html',
})
export class Select implements ControlValueAccessor {
  private readonly el = inject(ElementRef<HTMLElement>);
  triggerRef = viewChild<ElementRef<HTMLButtonElement>>('triggerRef');

  options = input<Option[]>([]);
  placeholder = input('Select an option');
  className = input('');
  panelClassName = input('');
  defaultValue = input('');
  disabled = input(false);
  labelFormat = input<'sentence' | 'uppercase' | 'none'>('sentence');

  enableSearch = input(true);
  localSearch = input(true);
  searchPlaceholder = input('Buscar...');
  emptyText = input('Sin resultados');
  multiple = input(false);

  // CVA value
  value = model<string>('');
  private readonly selectedValues = signal<string[]>([]);

  valueChange = new EventEmitter<string>();
  searchChange = output<string>();

  private onChangeFn: (value: string | string[]) => void = () => {};
  onTouched: () => void = () => {};

  isOpen = signal(false);
  query = signal('');
  openUp = signal(false);
  panelStyles = signal<Record<string, string>>({});

  normalizedOptions = computed((): NormalizedOption[] =>
    this.options().map((option) => ({
      ...option,
      label: this.formatOptionLabel(option.label),
      group: option.group?.trim() || undefined,
    })),
  );

  selectedLabel = computed(() => {
    if (this.multiple()) {
      return this.labelsFor(this.selectedValues()).join(', ');
    }

    const current = this.value();
    if (!current) {
      return '';
    }
    return this.normalizedOptions().find((option) => option.value === current)?.label ?? '';
  });

  filteredOptions = computed((): NormalizedOption[] => {
    const q = this.query().trim().toLocaleLowerCase('es-CO');
    const opts = this.normalizedOptions();

    if (!this.localSearch() || !this.enableSearch() || !q) {
      return opts;
    }

    return opts.filter((option) => {
      const labelMatch = option.label
        .toLocaleLowerCase('es-CO')
        .includes(q);
      const groupMatch =
        option.group?.toLocaleLowerCase('es-CO').includes(q) ?? false;
      return labelMatch || groupMatch;
    });
  });

  panelItems = computed((): SelectPanelItem[] => {
    const items: SelectPanelItem[] = [];
    let lastGroup: string | undefined;

    for (const option of this.filteredOptions()) {
      const group = option.group;
      if (group && group !== lastGroup) {
        items.push({
          type: 'group',
          key: `group-${group}`,
          label: group,
        });
        lastGroup = group;
      }
      if (!group) {
        lastGroup = undefined;
      }
      items.push({
        type: 'option',
        key: option.value,
        option,
      });
    }

    return items;
  });

  buttonClasses = computed(() => {
    const base = this.className();
    if (this.disabled()) {
      return `relative pr-10 text-gray-500 border-gray-300 opacity-40 bg-gray-100 cursor-not-allowed dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 ${base}`;
    }
    return `relative pr-10 bg-transparent text-gray-800 border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800 ${base}`;
  });

  private toggleValue(nextValue: string): void {
    const current = this.selectedValues();
    const next = current.includes(nextValue)
      ? current.filter((item) => item !== nextValue)
      : [...current, nextValue];
    this.selectedValues.set(next);
    this.onChangeFn(next);
  }

  private toValueList(value: string | string[] | number | null | undefined): string[] {
    if (Array.isArray(value)) {
      return value.map((item) => String(item));
    }

    if (value == null || value === '') {
      return [];
    }

    return [String(value)];
  }

  private labelsFor(values: string[]): string[] {
    const labels: string[] = [];
    for (const selected of values) {
      const label = this.normalizedOptions().find((option) => option.value === selected)?.label;
      labels.push(label || selected);
    }

    return labels;
  }

  private formatOptionLabel(label: string): string {
    const normalized = label?.trim() ?? '';

    if (this.labelFormat() === 'none') {
      return normalized;
    }

    if (this.labelFormat() === 'uppercase') {
      if (!normalized || normalized === '-') {
        return '-';
      }

      return normalized.toLocaleUpperCase('es-CO');
    }

    return formatSentenceValue(label);
  }
  writeValue(value: string | string[] | number | null | undefined): void {
    if (Array.isArray(value) || this.multiple()) {
      this.selectedValues.set(this.toValueList(value));
      return;
    }

    const next = value == null ? '' : String(value);
    this.value.set(next);
    if (!next && this.defaultValue()) {
      this.value.set(this.defaultValue());
    }
  }

  registerOnChange(fn: (value: string | string[]) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {

    (this.disabled as any).set?.(isDisabled);
  }

  toggle() {
    if (this.disabled()) return;
    this.isOpen.update((v) => !v);
    if (this.isOpen()) {
      this.setQuery('');
      this.positionPanel();
    }
  }

  close() {
    this.isOpen.set(false);
    this.setQuery('');
    this.openUp.set(false);
  }

  select(nextValue: string | number) {
    if (this.disabled()) {
      return;
    }
    const normalizedValue = String(nextValue);
    const option = this.normalizedOptions().find(
      (item) => item.value === normalizedValue,
    );
    if (option?.disabled) {
      return;
    }
    if (this.multiple()) {
      this.toggleValue(normalizedValue);
      return;
    }

    this.value.set(normalizedValue);
    this.onChangeFn(normalizedValue);
    this.valueChange.emit(normalizedValue);
    this.close();
  }

  isSelected(optionValue: string): boolean {
    if (this.multiple()) {
      return this.selectedValues().includes(optionValue);
    }

    return this.value() === optionValue;
  }

  onQueryInput(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    this.setQuery(inputEl.value);
  }

  private setQuery(value: string): void {
    if (this.query() === value) {
      return;
    }

    this.query.set(value);
    this.searchChange.emit(value);
  }

  @HostListener('window:resize')
  onWindowResize() {
    if (this.isOpen()) {
      this.positionPanel();
    }
  }

  private positionPanel() {
    const trigger = this.triggerRef()?.nativeElement;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const spacing = 6;
    const preferredHeight = 260;
    const spaceBelow = viewportHeight - rect.bottom - spacing;
    const spaceAbove = rect.top - spacing;
    const shouldOpenUp = spaceBelow < 220 && spaceAbove > spaceBelow;

    this.openUp.set(shouldOpenUp);

    if (shouldOpenUp) {
      this.panelStyles.set({
        display: 'flex',
        'flex-direction': 'column',
        left: `${Math.round(rect.left)}px`,
        width: `${Math.round(rect.width)}px`,
        bottom: `${Math.max(spacing, Math.round(viewportHeight - rect.top + spacing))}px`,
        'max-height': `${Math.max(160, Math.min(preferredHeight, spaceAbove - spacing))}px`,
      });
      return;
    }

    this.panelStyles.set({
      display: 'flex',
      'flex-direction': 'column',
      left: `${Math.round(rect.left)}px`,
      width: `${Math.round(rect.width)}px`,
      top: `${Math.round(rect.bottom + spacing)}px`,
      'max-height': `${Math.max(160, Math.min(preferredHeight, spaceBelow - spacing))}px`,
    });
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent) {
    if (!this.isOpen()) return;
    const target = event.target as Node | null;
    const root = this.el.nativeElement;
    if (root && target && !root.contains(target)) {
      this.close();
    }
  }
}
