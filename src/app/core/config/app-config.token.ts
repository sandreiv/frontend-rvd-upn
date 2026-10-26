import { InjectionToken } from '@angular/core';
import { AppConfig } from './app-config';

/**
 * Token de inyección para la configuración global de la aplicación
 * Úsalo con: inject(APP_CONFIG)
 */
export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG');

