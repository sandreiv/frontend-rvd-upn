import {
  animate,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-tooltip-content',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      role="tooltip"
      @fade
      class="max-w-xs whitespace-normal break-words [overflow-wrap:anywhere]
      rounded-lg bg-white px-3 py-2 text-xs font-medium leading-snug
      text-gray-700 shadow-lg ring-1 ring-gray-200"
    >
      {{ text() }}
    </div>
  `,
  animations: [
    trigger('fade', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.96)' }),
        animate(
          '120ms ease-out',
          style({ opacity: 1, transform: 'scale(1)' }),
        ),
      ]),
    ]),
  ],
})
export class TooltipContent {
  readonly text = input('');
}
