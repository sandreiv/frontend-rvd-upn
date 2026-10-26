import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageFallback } from '../../../core/directives/image-fallback';

type AvatarSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge' | '3xlarge' | '4xlarge';
type AvatarStatus = 'online' | 'offline' | 'busy' | 'none';

@Component({
  selector: 'app-avatar',
  imports: [CommonModule, ImageFallback],
  template: ` <div class="relative rounded-full" [ngClass]="sizeClasses[size]">
    <!-- Avatar Image -->
    <img
      [src]="src"
      [alt]="alt"
      class="w-full h-full object-cover rounded-full"
      [appImageFallback]="'images/fallback/image-fallback-perfil.png'"
    />

    <!-- Status Indicator -->
    @if (status !== 'none') {
      <span
        class="absolute bottom-0 right-0 rounded-full border-[1.5px] border-white dark:border-gray-900"
        [ngClass]="statusSizeClasses[size] + ' ' + (statusColorClasses[status] || '')"
      ></span>
    }
  </div>`,
})
export class Avatar {
  @Input() src!: string;
  @Input() alt: string = 'User Avatar';
  @Input() size: AvatarSize = 'medium';
  @Input() status: AvatarStatus = 'none';

  sizeClasses: Record<AvatarSize, string> = {
    xsmall: 'h-6 w-6 max-w-6',
    small: 'h-8 w-8 max-w-8',
    medium: 'h-10 w-10 max-w-10',
    large: 'h-12 w-12 max-w-12',
    xlarge: 'h-14 w-14 max-w-14',
    '2xlarge': 'h-16 w-16 max-w-16',
    '3xlarge': 'h-20 w-20 max-w-20',
    '4xlarge': 'h-24 w-24 max-w-24',
  };

  statusSizeClasses: Record<AvatarSize, string> = {
    xsmall: 'h-1.5 w-1.5 max-w-1.5',
    small: 'h-2 w-2 max-w-2',
    medium: 'h-2.5 w-2.5 max-w-2.5',
    large: 'h-3 w-3 max-w-3',
    xlarge: 'h-3.5 w-3.5 max-w-3.5',
    '2xlarge': 'h-4 w-4 max-w-4',
    '3xlarge': 'h-4.5 w-4.5 max-w-4.5',
    '4xlarge': 'h-5 w-5 max-w-5',
  };

  statusColorClasses: Record<Exclude<AvatarStatus, 'none'>, string> = {
    online: 'bg-success-500',
    offline: 'bg-error-400',
    busy: 'bg-warning-500',
  };
}
