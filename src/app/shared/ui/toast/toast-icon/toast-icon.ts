import { Component, inject } from '@angular/core';
import { HotToastRef } from '@ngxpert/hot-toast';
import { Icon } from '../../icon/icon';
import { ToastDisplayData } from '../toast-display.model';

@Component({
  selector: 'app-toast-icon',
  imports: [Icon],
  template: `<app-icon [name]="iconName" size="sm" />`,
})
export class ToastIconComponent {
  private toastRef = inject(HotToastRef<ToastDisplayData>);

  get iconName() {
    return this.toastRef.data.icon;
  }
}
