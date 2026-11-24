/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 24/11/2026 - Creación inicial: sección Tablas básicas a nivel de Administración
 */
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Breadcrumb } from '../../../shared/components/common/breadcrumb/breadcrumb';
import { Icon } from '../../../shared/ui/icon/icon';
import { AppIconName } from '../../../shared/ui/icon/icons';

type BasicTablesMenuItem = {
  label: string;
  icon: AppIconName;
  path?: string;
  disabled?: boolean;
};

@Component({
  selector: 'app-basic-tables-view',
  standalone: true,
  imports: [RouterModule, Breadcrumb, Icon],
  templateUrl: './basic-tables-view.html',
})
export class BasicTablesView {
  readonly menuItems: BasicTablesMenuItem[] = [
    {
      label: 'Novedades',
      icon: 'newspaper',
      path: 'novedades',
    },
  ];
}
