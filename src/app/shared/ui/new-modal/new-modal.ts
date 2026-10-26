import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';

import { CommonModule } from '@angular/common';
import { Icon } from '../icon/icon';
import { MODAL_GLYPHS, NewModalVariantName } from '../icon/icons';

export type NewModalVariant = NewModalVariantName;

@Component({
  selector: 'app-new-modal',
  imports: [CommonModule, Icon],
  templateUrl: './new-modal.html',
  styleUrl: './new-modal.css',
})
export class NewModal {
  @Input() isOpen = false;

  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  @Input() className = '';
  @Input() showCloseButton = true;

  @Input() title = 'Danger Alert!';

  @Input() message =
    'Lorem ipsum dolor sit amet consectetur. Feugiat ipsum libero tempor felis risus nisi non. Quisque eu ut tempor curabitur.';

  @Input() buttonText = 'Okay, Got It';

  @Input() showCancelButton = false;
  @Input() cancelButtonText = 'Cancel';

  /**
   * Variante visual: 'danger' (default, X roja), 'success' (check verde),
   * 'warning' (signo ! amarillo), 'info' (i azul).
   */
  @Input() variant: NewModalVariant = 'danger';

  /**
   * Path SVG (`d`) del glifo dentro del viewBox 60x60. Default según variant
   * (catálogo `MODAL_GLYPHS` en `icon/icons.ts`). Permite override para
   * glifos custom sin tocar el catálogo.
   */
  @Input() iconPath?: string;

  /** Color del botón principal (hex o clase Tailwind). Default según variant. */
  @Input() buttonColor?: string;

  /** Color del glifo (hex, se aplica como stroke). Default según variant. */
  @Input() iconColor?: string;

  /** Color de fondo del burst. Default según variant. */
  @Input() iconBackground?: string;

  ngOnInit() {
    if (this.isOpen) {
      document.body.style.overflow = 'hidden';
    }
  }

  ngOnDestroy() {
    document.body.style.overflow = 'unset';
  }

  ngOnChanges() {
    document.body.style.overflow = this.isOpen ? 'hidden' : 'unset';
  }

  onBackdropClick(event: MouseEvent) {
    this.close.emit();
  }

  onContentClick(event: MouseEvent) {
    event.stopPropagation();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    if (this.isOpen) {
      this.close.emit();
    }
  }

  /** Path del glifo: override explícito o catálogo según variant. */
  defaultIconPath(): string {
    return this.iconPath ?? MODAL_GLYPHS[this.variant];
  }

  defaultIconColor(): string {
    switch (this.variant) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      case 'danger':
      default:
        return '#DC2626';
    }
  }

  defaultIconBackground(): string {
    switch (this.variant) {
      case 'success':
        return '#ECFDF5';
      case 'warning':
        return '#FFFBEB';
      case 'info':
        return '#EFF6FF';
      case 'danger':
      default:
        return '#FEF2F2';
    }
  }

  defaultButtonColor(): string {
    switch (this.variant) {
      case 'success':
        return '#10B981';
      case 'warning':
        return '#F59E0B';
      case 'info':
        return '#3B82F6';
      case 'danger':
      default:
        return '#DC2626';
    }
  }
}
