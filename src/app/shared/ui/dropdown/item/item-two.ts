import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-item-two',
  imports: [CommonModule, RouterModule],
  template: ` <a [routerLink]="to" [ngClass]="combinedClasses" (click)="handleClick($event)">
    <ng-content></ng-content>
  </a>`,
  styles: ``,
})
export class ItemTwo {
  @Input() to!: string; // Required route path
  @Input() baseClassName =
    'block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900';
  @Input() className = '';
  @Output() itemClick = new EventEmitter<void>();
  @Output() click = new EventEmitter<void>();

  get combinedClasses(): string {
    return `${this.baseClassName} ${this.className}`.trim();
  }

  handleClick(event: Event) {
    this.click.emit();
    this.itemClick.emit();
  }
}
