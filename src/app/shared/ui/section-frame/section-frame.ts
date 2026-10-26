import { Component, Input } from '@angular/core';
import { Icon } from '../icon/icon';
import { AppIconName } from '../icon/icons';

type IconVariant = 'brand' | 'neutral' | 'success' | 'warning' | 'danger';

@Component({
  selector: 'app-section-frame',
  standalone: true,
  templateUrl: './section-frame.html',
  imports: [Icon],
})
export class SectionFrame {
  @Input({ required: true }) title = '';
  @Input() description = '';
  @Input() iconName?: AppIconName;
  @Input() iconVariant: IconVariant = 'brand';
  @Input() iconClasses = '';

  private readonly iconContainerVariants: Record<IconVariant, string> = {
    brand: 'bg-brand-50 dark:bg-brand-500/10',
    neutral: 'bg-gray-100 dark:bg-gray-800',
    success: 'bg-success-50 dark:bg-success-500/10',
    warning: 'bg-warning-50 dark:bg-warning-500/10',
    danger: 'bg-error-50 dark:bg-error-500/10',
  };

  private readonly iconColorVariants: Record<IconVariant, string> = {
    brand: 'text-brand-600 dark:text-brand-400',
    neutral: 'text-gray-600 dark:text-gray-300',
    success: 'text-success-600 dark:text-success-400',
    warning: 'text-warning-600 dark:text-warning-400',
    danger: 'text-error-600 dark:text-error-400',
  };

  get iconContainerClasses(): string {
    return this.iconContainerVariants[this.iconVariant];
  }

  get resolvedIconClasses(): string {
    return this.iconClasses.trim() ? this.iconClasses : this.iconColorVariants[this.iconVariant];
  }
}

