import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Breadcrumb } from '../../../shared/components/common/breadcrumb/breadcrumb';
import { Icon } from '../../../shared/ui/icon/icon';
import { AppIconName } from '../../../shared/ui/icon/icons';
import { ProjectView } from '../project-view/project-view';

type AdministrationMenuItem = {
  label: string;
  icon: AppIconName;
  path?: string;
  disabled?: boolean;
};

@Component({
  selector: 'app-administration-view',
  standalone: true,
  imports: [RouterModule, Breadcrumb, Icon, ProjectView],
  templateUrl: './administration-view.html',
})
export class AdministrationView {
  readonly menuItems: AdministrationMenuItem[] = [
    {
      label: 'Coordinaciones',
      icon: 'home',
      path: 'coordinaciones',
    },
    {
      label: 'Tipo actividades',
      icon: 'bookOpen',
      path: 'tipo-actividades',
    },
    {
      label: 'Novedades',
      icon: 'bell',
      path: 'novedades',
    },
    {
      label: 'Puntos por vigencia',
      icon: 'calendar',
      path: 'puntos-vigencia',
    },
    {
      label: 'Restricción de carga',
      icon: 'lock',
      path: 'restriccion-carga',
    },
  ];
}
