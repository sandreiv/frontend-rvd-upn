import { Injectable, inject, signal } from '@angular/core';
import { HotToastService } from '@ngxpert/hot-toast';
import {
  buildToastOptions,
  getToastIconName,
} from '../../shared/ui/toast/config/toast-style.config';
import { ToastIconComponent } from '../../shared/ui/toast/toast-icon/toast-icon';
import { ToastMessageComponent } from '../../shared/ui/toast/toast-message/toast-message';
import { Toast } from '../../shared/ui/toast/toas.model';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private hotToast = inject(HotToastService);

  /** @deprecated Mantenido por compatibilidad con ToastContainer */
  toasts = signal<Toast[]>([]);

  show(
    message: string,
    type: Toast['type'] = 'info',
    title?: string,
    durationMs: number = 4000,
  ): void {
    const options = {
      ...buildToastOptions(type, durationMs),
      icon: ToastIconComponent,
      data: {
        title,
        message,
        icon: getToastIconName(type),
      },
    };

    switch (type) {
      case 'success':
        this.hotToast.success(ToastMessageComponent, options);
        break;
      case 'error':
        this.hotToast.error(ToastMessageComponent, options);
        break;
      default:
        this.hotToast.info(ToastMessageComponent, options);
        break;
    }
  }

  /** @deprecated Mantenido por compatibilidad con ToastContainer */
  remove(id: number): void {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }

  clearAll(): void {
    this.hotToast.close();
    this.toasts.set([]);
  }
}
