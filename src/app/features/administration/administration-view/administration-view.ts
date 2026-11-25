/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Ajuste de opciones de administración: Tipo actividades y Proyectos
 * 11/11/2026 - Leonel Antonio Perez Rios - Se retira la opción Proyectos tras moverla a nivel de sidebar
 * 24/11/2026 - Juan Diego Florez - Tarjeta de Tablas básicas debajo de la tarjeta de Administración
 */
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Breadcrumb } from '../../../shared/components/common/breadcrumb/breadcrumb';
import { Icon } from '../../../shared/ui/icon/icon';
import { AppIconName } from '../../../shared/ui/icon/icons';

type AdministrationMenuItem = {
  label: string;
  icon: AppIconName;
  path?: string;
  disabled?: boolean;
};

type AdministrationMenuSection = {
  title: string;
  description: string;
  icon: AppIconName;
  items: AdministrationMenuItem[];
};

@Component({
  selector: 'app-administration-view',
  standalone: true,
  imports: [RouterModule, Breadcrumb, Icon],
  templateUrl: './administration-view.html',
})
export class AdministrationView {
  readonly menuSections: AdministrationMenuSection[] = [
    {
      title: 'Administración',
      description: 'Administra los parámetros base del sistema',
      icon: 'adjustmentsHorizontal',
      items: [
        {
          label: 'Tipo actividades',
          icon: 'bookOpen',
          path: 'tipo-actividades',
        },
        {
          label: 'Grupos de Convocatoria',
          icon: 'calendar',
          path: 'grupos-convocatoria',
        },
      ],
    },
    {
      title: 'Tablas básicas',
      description: 'Administra las tablas básicas',
      icon: 'newspaper',
      items: [
        {
          label: 'Novedades',
          icon: 'newspaper',
          path: 'tablas-basicas/novedades',
        },
        {
      label: 'Estados',
      icon: 'adjustmentsHorizontal',
      path: 'estados',
        },
      ],
    },
  ];
}
