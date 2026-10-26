import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  input,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Icon } from '../icon/icon';
import { AppIconName } from '../icon/icons';
import { TooltipPlacement, TooltipTheme } from './tooltip.types';

const HTML_TAG_REGEX = /<[a-z][\s\S]*>/i;

const THEME_CLASSES_MAP: Record<TooltipTheme, string> = {
  light: 'tooltip-theme-light bg-white text-gray-800 border-gray-200/80 shadow-gray-300/50 dark:bg-gray-800 dark:text-gray-100 dark:border-gray-700',
  brand: 'tooltip-theme-brand bg-brand-600 text-white border-brand-500 shadow-brand-600/30',
  success: 'tooltip-theme-success bg-emerald-700 text-white border-emerald-600 shadow-emerald-700/30',
  warning: 'tooltip-theme-warning bg-amber-600 text-white border-amber-500 shadow-amber-600/30',
  danger: 'tooltip-theme-danger bg-red-600 text-white border-red-500 shadow-red-600/30',
  dark: 'tooltip-theme-dark bg-gray-900 text-white border-gray-800 dark:bg-gray-750 dark:border-gray-700 shadow-black/40',
};

@Component({
  selector: 'app-tooltip-floating',
  standalone: true,
  imports: [CommonModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    .tooltip-html-body {
      color: inherit;
    }
    .tooltip-html-body h1,
    .tooltip-html-body h2,
    .tooltip-html-body h3,
    .tooltip-html-body h4,
    .tooltip-html-body h5,
    .tooltip-html-body h6 {
      font-weight: 700;
      line-height: 1.3;
      margin: 0.2rem 0;
    }
    .tooltip-html-body p {
      margin: 0.25rem 0;
      line-height: 1.45;
    }
    .tooltip-html-body p:first-child {
      margin-top: 0;
    }
    .tooltip-html-body p:last-child {
      margin-bottom: 0;
    }
    .tooltip-html-body ul {
      list-style-type: disc;
      padding-left: 1.25rem;
      margin: 0.25rem 0;
    }
    .tooltip-html-body ol {
      list-style-type: decimal;
      padding-left: 1.25rem;
      margin: 0.25rem 0;
    }
    :host .tooltip-theme-dark .tooltip-html-body [style*="color: #111827"],
    :host .tooltip-theme-dark .tooltip-html-body [style*="color:#111827"],
    :host .tooltip-theme-dark .tooltip-html-body [style*="color: #000"],
    :host .tooltip-theme-dark .tooltip-html-body [style*="color:#000"],
    :host .tooltip-theme-dark .tooltip-html-body [style*="color: black"],
    :host .tooltip-theme-dark .tooltip-html-body [style*="color: rgb(0, 0, 0)"] {
      color: #f9fafb !important;
    }
  `],
  template: `
    <div
      role="tooltip"
      [class]="containerClasses()"
    >
      @if (template()) {
        <ng-container *ngTemplateOutlet="template()!" />
      } @else {
        <div class="flex items-start gap-2 min-w-0">
          @if (icon()) {
            <span class="shrink-0 flex items-center justify-center opacity-90 mt-0.5">
              <app-icon [name]="icon()!" size="xs" />
            </span>
          }

          @if (isHtml()) {
            <div class="text-left leading-normal break-words flex-1 text-xs tooltip-html-body" [innerHTML]="sanitizedHtml()"></div>
          } @else {
            <span class="text-left leading-normal break-words flex-1">{{ text() }}</span>
          }

          @if (kbd() || kbdIcon()) {
            <kbd class="ml-1 px-1.5 py-0.5 text-[9px] font-mono font-semibold rounded bg-white/20 dark:bg-black/30 border border-white/30 text-white shrink-0 mt-0.5 inline-flex items-center justify-center min-w-4 h-4">
              @if (kbdIcon()) {
                <app-icon [name]="kbdIcon()!" size="xs" />
              } @else {
                {{ kbd() }}
              }
            </kbd>
          }
        </div>
      }
    </div>
  `,
})
export class TooltipFloatingComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly text = input<string>('');
  readonly template = input<TemplateRef<unknown> | null>(null);
  readonly icon = input<AppIconName | undefined>(undefined);
  readonly kbd = input<string | undefined>(undefined);
  readonly kbdIcon = input<AppIconName | undefined>(undefined);
  readonly theme = input<TooltipTheme>('dark');
  readonly placement = input<TooltipPlacement>('top');

  protected readonly isHtml = computed<boolean>(() => {
    const t = this.text();
    if (!t || typeof t !== 'string') return false;
    return HTML_TAG_REGEX.test(t.trim());
  });

  protected readonly sanitizedHtml = computed<SafeHtml>(() => {
    const t = this.text();
    if (!t || typeof t !== 'string') return '';
    return this.sanitizer.bypassSecurityTrustHtml(t.trim());
  });

  protected readonly containerClasses = computed(() => {
    const maxW = this.isHtml() ? 'max-w-sm sm:max-w-md md:max-w-lg' : 'max-w-xs sm:max-w-sm';
    const base = `px-3 py-2 rounded-xl text-xs font-normal leading-relaxed shadow-xl ${maxW} break-words flex items-start pointer-events-none transition-opacity duration-150 ease-out border`;
    const themeClasses = THEME_CLASSES_MAP[this.theme()] ?? THEME_CLASSES_MAP.dark;

    return `${base} ${themeClasses}`;
  });
}
