/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Ajuste de opciones de administración: Tipo actividades y Proyectos
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

@Component({
  selector: 'app-administration-view',
  standalone: true,
  imports: [RouterModule, Breadcrumb, Icon],
  templateUrl: './administration-view.html',
})
export class AdministrationView {
  readonly menuItems: AdministrationMenuItem[] = [
    {
      label: 'Tipo actividades',
      icon: 'bookOpen',
      path: 'tipo-actividades',
    },
    {
      label: 'Proyectos',
      icon: 'documentPlus',
      path: 'proyectos',
    },
  ];
}
