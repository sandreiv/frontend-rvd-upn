import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class BreadcrumbTitle {
  private readonly _pageTitle = signal('');
  readonly pageTitle = this._pageTitle.asReadonly();

  setPageTitle(title: string): void {
    this._pageTitle.set(title);
  }

  clearPageTitle(): void {
    this._pageTitle.set('');
  }
}

