import { Component } from '@angular/core';
import { ThemeService } from '../../../../core/service/theme-service';

@Component({
  selector: 'app-theme-toggle-button-two',
  imports: [],
  templateUrl: './theme-toggle-button-two.html',
  styleUrl: './theme-toggle-button-two.css',
})
export class ThemeToggleButtonTwo {
  theme$;

  constructor(private themeService: ThemeService) {
    this.theme$ = this.themeService.theme$;
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }
}
