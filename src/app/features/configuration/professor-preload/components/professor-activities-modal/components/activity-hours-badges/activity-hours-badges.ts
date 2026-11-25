import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Badge } from '../../../../../../../shared/ui/badge/badge';

@Component({
  selector: 'app-activity-hours-badges',
  imports: [Badge],
  host: { class: 'inline-flex shrink-0' },
  template: `
    <div class="flex w-[12.25rem] items-center justify-end gap-1.5">
      <span class="flex w-28 flex-col items-center gap-0.5" title="Rango de horas permitido">
        <span
          class="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500"
        >
          Rango
        </span>
        <app-badge
          class="block w-full"
          variant="neutral"
          size="xs"
          className="w-full justify-center normal-case tracking-normal"
        >
          {{ range() || '—' }}
        </app-badge>
      </span>
      <span
        class="flex w-16 flex-col items-center gap-0.5"
        title="Horas totales de este nivel"
      >
        <span
          class="text-[10px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500"
        >
          Total
        </span>
        <app-badge
          class="block w-full"
          variant="brand"
          size="xs"
          className="w-full justify-center normal-case tracking-normal"
        >
          {{ assigned() }}
        </app-badge>
      </span>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityHoursBadges {
  readonly range = input<string | null>(null);
  readonly assigned = input('0 h');
}
