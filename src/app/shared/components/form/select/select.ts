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
  disabled?: boolean;
}

type NormalizedOption = Option & {
  label: string;
  group?: string;
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
  labelFormat = input<'sentence' | 'uppercase'>('sentence');

  enableSearch = input(true);
  searchPlaceholder = input('Buscar...');
  emptyText = input('Sin resultados');

  // CVA value
  value = model<string>('');

  valueChange = new EventEmitter<string>();

  private onChangeFn: (value: string) => void = () => {};
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
    const v = this.value();
    if (!v) {
      return '';
    }
    return this.normalizedOptions().find((o) => o.value === v)?.label ?? '';
  });

  filteredOptions = computed((): NormalizedOption[] => {
    const q = this.query().trim().toLocaleLowerCase('es-CO');
    const opts = this.normalizedOptions();

    if (!this.enableSearch() || !q) {
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

  private formatOptionLabel(label: string): string {
    if (this.labelFormat() === 'uppercase') {
      const normalized = label?.trim();

      if (!normalized || normalized === '-') {
        return '-';
      }

      return normalized.toLocaleUpperCase('es-CO');
    }

    return formatSentenceValue(label);
  }
  writeValue(value: string | number | null | undefined): void {
    const next = value == null ? '' : String(value);
    this.value.set(next);
    if (!next && this.defaultValue()) {
      this.value.set(this.defaultValue());
    }
  }

  registerOnChange(fn: (value: string) => void): void {
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
      this.query.set('');
      this.positionPanel();
    }
  }

  close() {
    this.isOpen.set(false);
    this.query.set('');
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
    this.value.set(normalizedValue);
    this.onChangeFn(normalizedValue);
    this.valueChange.emit(normalizedValue);
    this.close();
  }

  onQueryInput(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    this.query.set(inputEl.value);
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
