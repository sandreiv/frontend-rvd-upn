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
  dark: 'tooltip-theme-dark bg-gray-900/95 dark:bg-gray-950/95 text-gray-100 border-white/10 dark:border-white/15 shadow-xl shadow-black/30 backdrop-blur-md',
  brand: 'tooltip-theme-brand bg-brand-950/90 dark:bg-brand-950/95 text-brand-100 border-brand-500/30 shadow-xl shadow-brand-950/40 backdrop-blur-md',
  light: 'tooltip-theme-light bg-white/95 text-gray-900 border-gray-200/90 shadow-xl shadow-gray-900/10 dark:bg-gray-800/95 dark:text-gray-100 dark:border-gray-700/80 backdrop-blur-md',
  success: 'tooltip-theme-success bg-emerald-950/90 dark:bg-emerald-950/95 text-emerald-100 border-emerald-500/30 shadow-xl shadow-emerald-950/40 backdrop-blur-md',
  warning: 'tooltip-theme-warning bg-amber-950/90 dark:bg-amber-950/95 text-amber-100 border-amber-500/30 shadow-xl shadow-amber-950/40 backdrop-blur-md',
  danger: 'tooltip-theme-danger bg-rose-950/90 dark:bg-rose-950/95 text-rose-100 border-rose-500/30 shadow-xl shadow-rose-950/40 backdrop-blur-md',
};

@Component({
  selector: 'app-tooltip-floating',
  standalone: true,
  imports: [CommonModule, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`
    :host, :host *, :host ::ng-deep * {
      pointer-events: none !important;
    }
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
    const base = `px-2.5 py-1.5 rounded-lg text-[11px] font-medium leading-snug tracking-tight shadow-xl ${maxW} break-words flex items-center pointer-events-none border select-none`;
    const themeClasses = THEME_CLASSES_MAP[this.theme()] ?? THEME_CLASSES_MAP.dark;

    return `${base} ${themeClasses}`;
  });
}
