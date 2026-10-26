import { Component, ElementRef, ViewChild, inject } from '@angular/core';
import { SidebarService } from '../../../core/service/sidebar-service';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ThemeToggleButton } from '../../components/common/theme-toggle-button/theme-toggle-button';
import { Icon } from '../../ui/icon/icon';
import { UserDropdown } from '../../components/header/user-dropdown/user-dropdown';
import { VerifyNotifications } from '../../../features/configuration/verify-professors/components/verify-notifications/verify-notifications';
import { SidebarTheme } from '../../../core/service/sidebar-theme';

@Component({
  selector: 'app-header',
  imports: [CommonModule, RouterModule, Icon, UserDropdown, VerifyNotifications],
  templateUrl: './app-header.html',
  styleUrl: './app-header.css',
})
export class AppHeader {
  isApplicationMenuOpen = false;
  readonly isMobileOpen$;
  readonly sidebarThemeMode$;

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);

  constructor(
    public sidebarService: SidebarService,
    public sidebarThemeService: SidebarTheme,
  ) {
    this.isMobileOpen$ = this.sidebarService.isMobileOpen$;
    this.sidebarThemeMode$ = this.sidebarThemeService.mode$;
  }

  get isPublicArea(): boolean {
    return this.router.url.split('?')[0].startsWith('/publico');
  }

  handleToggle() {
    if (window.innerWidth >= 1280) {
      this.sidebarService.toggleExpanded();
    } else {
      this.sidebarService.toggleMobileOpen();
    }
  }

  toggleApplicationMenu() {
    this.isApplicationMenuOpen = !this.isApplicationMenuOpen;
  }

  toggleSidebarTheme() {
    this.sidebarThemeService.toggleThemeMode();
  }

  resetSidebarTheme() {
    this.sidebarThemeService.resetToDefaultTheme();
  }


  ngAfterViewInit() {
    document.addEventListener('keydown', this.handleKeyDown);
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleKeyDown);
  }

  handleKeyDown = (event: KeyboardEvent) => {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      this.searchInput?.nativeElement.focus();
    }
  };
}
