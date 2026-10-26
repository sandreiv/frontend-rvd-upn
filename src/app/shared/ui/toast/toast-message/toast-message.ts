import { Component, inject } from '@angular/core';
import { HotToastRef } from '@ngxpert/hot-toast';
import { ToastDisplayData } from '../toast-display.model';

@Component({
  selector: 'app-toast-message',
  template: `
    <div class="toast-display">
      @if (data.title) {
        <p class="toast-display__title">{{ data.title }}</p>
      }
      <p class="toast-display__message">{{ data.message }}</p>
    </div>
  `,
  styles: [
    `
      .toast-display {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .toast-display__title {
        margin: 0;
        font-size: 0.95rem;
        font-weight: 700;
        line-height: 1.25;
      }

      .toast-display__message {
        margin: 0;
        font-size: 0.8125rem;
        font-weight: 400;
        line-height: 1.35;
      }
    `,
  ],
})
export class ToastMessageComponent {
  private toastRef = inject(HotToastRef<ToastDisplayData>);

  get data(): ToastDisplayData {
    return this.toastRef.data;
  }
}
