import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

type AvatarSize = 'xsmall' | 'small' | 'medium' | 'large' | 'xlarge' | '2xlarge' | '3xlarge' | '4xlarge';

@Component({
  selector: 'app-avatar-text',
  imports: [CommonModule],
  template: `
    <div
      class="flex items-center justify-center rounded-full"
      [ngClass]="sizeClasses[size] + ' ' + colorClass + ' ' + className"
    >
      <span class="font-medium" [ngClass]="textSizeClasses[size]">{{ initials }}</span>
    </div>
  `,
})
export class AvatarText {
  @Input() name!: string;
  @Input() className = '';
  @Input() size: AvatarSize = 'medium';

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

  textSizeClasses: Record<AvatarSize, string> = {
    xsmall: 'text-[10px]',
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
    xlarge: 'text-lg',
    '2xlarge': 'text-xl',
    '3xlarge': 'text-2xl',
    '4xlarge': 'text-3xl',
  };

  get initials(): string {
    if (!this.name) return '';
    return this.name
      .split(' ')
      .filter(Boolean)
      .map((word) => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  get colorClass(): string {
    const colors = [
      'bg-brand-100 text-brand-600',
      'bg-pink-100 text-pink-600',
      'bg-cyan-100 text-cyan-600',
      'bg-orange-100 text-orange-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-yellow-100 text-yellow-600',
      'bg-error-100 text-error-600',
    ];
    if (!this.name) {
      return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
    }
    const index = this.name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  }
}
