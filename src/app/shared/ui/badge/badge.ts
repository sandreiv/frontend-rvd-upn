import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type BadgeVariant =
  | 'brand'
  | 'success'
  | 'error'
  | 'warning'
  | 'neutral'
  | 'blue-light';

export type BadgeSize = 'xs' | 'sm' | 'md';
export type BadgeShape = 'pill' | 'rounded';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      class="inline-flex items-center font-medium transition-colors select-none"
      [ngClass]="[variantClasses, sizeClasses, shapeClasses, className]"
    >
      @if (dot) {
        <span class="mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full" [ngClass]="dotClasses"></span>
      }
      <ng-content />
    </span>
  `,
})
export class Badge {
  @Input() variant: BadgeVariant = 'brand';
  @Input() size: BadgeSize = 'sm';
  @Input() shape: BadgeShape = 'pill';
  @Input() dot = false;
  @Input() className = '';

  get variantClasses(): string {
    switch (this.variant) {
      case 'success':
        return 'bg-success-50 text-success-700 border border-success-200 dark:bg-success-500/10 dark:text-success-400 dark:border-success-500/30';
      case 'error':
        return 'bg-error-50 text-error-700 border border-error-200 dark:bg-error-500/10 dark:text-error-400 dark:border-error-500/30';
      case 'warning':
        return 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30';
      case 'neutral':
        return 'bg-gray-100 text-gray-700 border border-gray-200 dark:bg-white/5 dark:text-gray-300 dark:border-white/10';
      case 'blue-light':
        return 'bg-blue-light-50 text-blue-light-700 border border-blue-light-200 dark:bg-blue-light-500/10 dark:text-blue-light-300 dark:border-blue-light-500/30';
      case 'brand':
      default:
        return 'bg-brand-50 text-brand-700 border border-brand-200 dark:bg-brand-500/10 dark:text-brand-300 dark:border-brand-500/30';
    }
  }

  get dotClasses(): string {
    switch (this.variant) {
      case 'success':
        return 'bg-success-500';
      case 'error':
        return 'bg-error-500';
      case 'warning':
        return 'bg-amber-500';
      case 'neutral':
        return 'bg-gray-400';
      case 'blue-light':
        return 'bg-blue-light-500';
      case 'brand':
      default:
        return 'bg-brand-500';
    }
  }

  get sizeClasses(): string {
    switch (this.size) {
      case 'xs':
        return 'px-1.5 py-0.5 text-[11px] leading-tight';
      case 'md':
        return 'px-3 py-1 text-sm leading-normal';
      case 'sm':
      default:
        return 'px-2.5 py-0.5 text-xs leading-normal';
    }
  }

  get shapeClasses(): string {
    return this.shape === 'rounded' ? 'rounded-md' : 'rounded-full';
  }
}
