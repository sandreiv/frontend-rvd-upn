import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Breadcrumb } from '../../../shared/components/common/breadcrumb/breadcrumb';
import { Icon } from '../../../shared/ui/icon/icon';
import { AppIconName } from '../../../shared/ui/icon/icons';

type ApplicantMenuItem = {
  label: string;
  icon: AppIconName;
  path?: string;
  disabled?: boolean;
};

@Component({
  selector: 'app-applicant-view',
  standalone: true,
  imports: [RouterModule, Breadcrumb, Icon],
  templateUrl: './config-view.html',
  styleUrl: './config-view.css',
})
export class ConfigView {
  readonly menuItems: ApplicantMenuItem[] = [
    {
      label: 'Convocatoria precarga',
      icon: 'call',
      path: 'convocatoria-precarga',
    },
    {
      label: 'Precarga docente',
      icon: 'paperAirplane',
      path: 'precarga-docente',
    },
  ];
}

