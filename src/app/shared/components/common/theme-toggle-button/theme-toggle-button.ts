import { Component } from '@angular/core';
import { ThemeService } from '../../../../core/service/theme-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-theme-toggle-button',
  imports: [CommonModule],
  templateUrl: './theme-toggle-button.html',
  styleUrl: './theme-toggle-button.css',
})
export class ThemeToggleButton {
  theme$;

  constructor(private themeService: ThemeService) {
    this.theme$ = this.themeService.theme$;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
