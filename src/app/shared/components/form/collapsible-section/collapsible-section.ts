import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { Icon } from '../../../ui/icon/icon';

export type CollapsibleSectionVariant = 'card' | 'plain';

@Component({
  selector: 'app-collapsible-section',
  imports: [Icon],
  templateUrl: './collapsible-section.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollapsibleSection {
  title = input('');
  expanded = model(true);
  disabled = input(false);
  variant = input<CollapsibleSectionVariant>('card');
  contentClassName = input('flex flex-col gap-4');

  readonly wrapperClasses = computed(() => {
    if (this.variant() === 'plain') {
      return '';
    }
    return (
      'rounded-xl border border-gray-200 bg-white ' +
      'dark:border-white/5 dark:bg-white/3'
    );
  });

  readonly chevronClasses = computed(() => {
    const base =
      'shrink-0 text-gray-500 transition-transform duration-200 ' +
      'dark:text-gray-400';
    return this.expanded() ? `${base} rotate-180` : base;
  });

  toggle(): void {
    if (this.disabled()) {
      return;
    }
    this.expanded.update((value) => !value);
  }
}
