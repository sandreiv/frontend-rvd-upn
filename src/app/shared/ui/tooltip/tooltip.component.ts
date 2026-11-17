import { ChangeDetectionStrategy, Component, TemplateRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipDirective } from './tooltip.directive';
import { TooltipPlacement, TooltipTheme } from './tooltip.types';
import { AppIconName } from '../icon/icons';

/**
 * Componente Wrapper versátil para envolver cualquier elemento y dotarlo de tooltip enriquecido.
 *
 * Ejemplos:
 *
 * 1. Simple con icono:
 * <app-tooltip text="Copiar al portapapeles" icon="clipboard" placement="top">
 *   <button>...</button>
 * </app-tooltip>
 *
 * 2. Con atajo de teclado:
 * <app-tooltip text="Guardar cambios" icon="check" kbd="Ctrl+S" placement="bottom">
 *   <button>...</button>
 * </app-tooltip>
 *
 * 3. Con TemplateRef personalizado:
 * <app-tooltip [template]="customTpl">
 *   <button>...</button>
 * </app-tooltip>
 */
@Component({
  selector: 'app-tooltip',
  standalone: true,
  imports: [CommonModule, TooltipDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex"
      [appTooltip]="template() || text()"
      [tooltipPlacement]="placement()"
      [tooltipTheme]="theme()"
      [tooltipIcon]="icon()"
      [tooltipKbd]="kbd()"
      [tooltipKbdIcon]="kbdIcon()"
      [tooltipDisabled]="disabled()"
      [tooltipDelay]="delay()"
    >
      <ng-content />
    </span>
  `,
})
export class TooltipComponent {
  readonly text = input<string>('');
  readonly template = input<TemplateRef<unknown> | null>(null);
  readonly icon = input<AppIconName | undefined>(undefined);
  readonly kbd = input<string | undefined>(undefined);
  readonly kbdIcon = input<AppIconName | undefined>(undefined);
  readonly placement = input<TooltipPlacement>('top');
  readonly theme = input<TooltipTheme>('dark');
  readonly disabled = input<boolean>(false);
  readonly delay = input<number>(80);
}
