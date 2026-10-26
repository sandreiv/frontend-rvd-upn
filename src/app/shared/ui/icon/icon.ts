import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICONS, AppIconName } from './icons';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Component({
  selector: 'app-icon',
  imports: [CommonModule],
  template: `
    <svg
      [ngClass]="computedClasses"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.5"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g [innerHTML]="safePath"></g>
    </svg>
  `,
})
export class Icon {
  @Input({ required: true }) name!: AppIconName;
  @Input() classes: string = '';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' = 'md';

  private sizeMap = {
    xs: 'w-4 h-4',
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  constructor(private sanitizer: DomSanitizer) {}

  get safePath(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(ICONS[this.name]);
  }

  get computedClasses(): string {
    return `${this.sizeMap[this.size]} ${this.classes}`;
  }
}
