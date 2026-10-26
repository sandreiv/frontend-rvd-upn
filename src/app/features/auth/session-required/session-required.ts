import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/service/auth-service';
import { MenuService } from '../../../core/service/menu-service';
import { Button } from '../../../shared/ui/button/button';
import { AuthPageLayout } from '../../../shared/layout/auth-page-layout/auth-page-layout';

@Component({
  selector: 'app-session-required',
  imports: [FormsModule, AuthPageLayout, Button],
  templateUrl: './session-required.html',
})
export class SessionRequired implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly menuService = inject(MenuService);
  private readonly router = inject(Router);

  readonly isProduction = environment.production;
  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(
    this.authService.consumeBootstrapError(),
  );
  pastedToken = '';

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }

    void this.router.navigateByUrl(this.menuService.homeUrl() ?? '/rvd');
  }

  async onBootstrapPastedToken(): Promise<void> {
    const accessToken = this.pastedToken.trim();

    if (!accessToken || this.isProduction) {
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const ok = await this.authService.bootstrapWithToken(accessToken);

    if (!ok) {
      this.errorMessage.set(
        this.authService.consumeBootstrapError() ??
          'No se pudo validar el token.',
      );
      this.isSubmitting.set(false);
      return;
    }

    await firstValueFrom(this.menuService.load());
    const homeUrl = this.menuService.homeUrl() ?? '/rvd';
    await this.router.navigateByUrl(homeUrl);
    this.isSubmitting.set(false);
  }
}
