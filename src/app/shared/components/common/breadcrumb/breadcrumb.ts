import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Icon } from '../../../ui/icon/icon';
import { BreadcrumbTitle } from '../../../../core/service/breadcrumb-title';

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterModule, Icon],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class Breadcrumb {
  private readonly breadcrumbTitleService = inject(BreadcrumbTitle);
  readonly pageTitle = this.breadcrumbTitleService.pageTitle;
}
