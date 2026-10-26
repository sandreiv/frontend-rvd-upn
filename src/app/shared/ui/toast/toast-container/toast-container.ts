import { Component, inject } from '@angular/core';
import { ToastService } from '../../../../core/service/toastService';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainer {
  toastService = inject(ToastService);
}
