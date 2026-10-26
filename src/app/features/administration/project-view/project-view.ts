import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Icon } from '../../../shared/ui/icon/icon';
import { AppIconName } from '../../../shared/ui/icon/icons';

type ProjectMenuItem = {
  label: string;
  icon: AppIconName;
  path?: string;
  disabled?: boolean;
};

@Component({
  selector: 'app-project-view',
  standalone: true,
  imports: [RouterModule, Icon],
  templateUrl: './project-view.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectView {
  readonly menuItems: ProjectMenuItem[] = [
    {
      label: 'Tipo proyectos',
      icon: 'briefcase',
      path: 'tipos-de-proyecto',
    },
    {
      label: 'Convocatoria proyectos',
      icon: 'calendar',
      path: 'convocatorias-de-proyecto',
    },
    {
      label: 'Proyectos',
      icon: 'documentPlus',
      path: 'proyectos',
    },
  ];
}
