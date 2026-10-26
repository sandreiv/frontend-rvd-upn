import { Injectable } from '@angular/core';
import { ToastService } from './toastService';

export interface NotificationOptions {
  timeOut?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private defaultOptions: NotificationOptions = {
    timeOut: 4000,
  };

  constructor(private toast: ToastService) {}

  /**
   * Mostrar notificación de éxito
   */
  success(
    message: string,
    title: string = 'Éxito',
    options?: NotificationOptions
  ): void {
    const duration = options?.timeOut ?? this.defaultOptions.timeOut ?? 4000;
    this.toast.show(message, 'success', title, duration);
  }

  /**
   * Mostrar notificación de error
   */
  error(
    message: string,
    title: string = 'Error',
    options?: NotificationOptions
  ): void {
    const duration = options?.timeOut ?? 5000;
    this.toast.show(message, 'error', title, duration);
  }

  /**
   * Mostrar notificación de advertencia
   */
  warning(
    message: string,
    title: string = 'Advertencia',
    options?: NotificationOptions
  ): void {
    const duration = options?.timeOut ?? this.defaultOptions.timeOut ?? 4000;
    this.toast.show(message, 'info', title, duration);
  }

  /**
   * Mostrar notificación de información
   */
  info(
    message: string,
    title: string = 'Información',
    options?: NotificationOptions
  ): void {
    const duration = options?.timeOut ?? this.defaultOptions.timeOut ?? 4000;
    this.toast.show(message, 'info', title, duration);
  }

  /**
   * Limpiar todas las notificaciones
   */
  clearAll(): void {
    this.toast.clearAll();
  }

  /**
   * Remover una notificación específica
   */
  remove(toastId: number): void {
    this.toast.remove(toastId);
  }
}

