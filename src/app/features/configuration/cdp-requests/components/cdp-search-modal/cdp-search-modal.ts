import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { CdpService } from '../../data/cdp.service';
import { ApproveCdpRequest, CdpSearchResult } from '../../model/cdp-context.model';
import { Button } from '../../../../../shared/ui/button/button';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Modal } from '../../../../../shared/ui/modal/modal';

@Component({
  selector: 'app-cdp-search-modal',
  imports: [Button, InputField, Modal],
  templateUrl: './cdp-search-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CdpSearchModal {
  private readonly cdpService = inject(CdpService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isOpen = input(false);
  readonly idSolicitud = input<number | null>(null);
  readonly idUnidad = input<number | null>(null);
  readonly anioVigencia = input<number | null>(null);

  readonly close = output<void>();
  readonly approved = output<void>();

  readonly hasSearchedCdps = signal(false);
  readonly cdpSearchQuery = signal('');
  readonly cdpSearchResults = signal<CdpSearchResult[]>([]);
  readonly isSearchingCdps = signal(false);
  readonly isApprovingCdp = signal(false);


  constructor() {
    effect(() => {
      this.idSolicitud();
      this.resetModalState();
    });
  }

  searchCdps(): void {
    const numeroCdp = this.cdpSearchQuery().trim();
    const idUnidad = this.idUnidad();
    const anioVigencia = this.anioVigencia();

    if (!numeroCdp || !idUnidad || !anioVigencia) return;

    if (this.isSearchingCdps()) {
        return;
    }

    this.hasSearchedCdps.set(true);
    this.isSearchingCdps.set(true);
    this.cdpSearchResults.set([]);
    
    this.cdpService
      .searchCdpResults(numeroCdp, idUnidad, anioVigencia)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSearchingCdps.set(false)),
      )
      .subscribe({
        next: (results) => {
          this.cdpSearchResults.set(results ?? []);
        }
      })
  }

  selectCdp(cdp: CdpSearchResult): void {
    const idSolicitud = this.idSolicitud();

    if (idSolicitud == null || this.isApprovingCdp()) {
      return;
    }

    const payload: ApproveCdpRequest = {
      idSolicitud,
      numero: cdp.numero,
      idCdp: cdp.idCdp,
    };

    this.isApprovingCdp.set(true);
    this.cdpService
      .approveCdpRequest(payload)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isApprovingCdp.set(false)),
      )
      .subscribe({
        next: () => {
          this.approved.emit();
          this.close.emit();
        }
      })
  }

  closeModal(): void {
    this.close.emit();
  }

  onCdpSearchQueryChange(value: string | number): void {
    this.cdpSearchQuery.set(String(value));
  }

  private resetModalState(): void {
    this.cdpSearchQuery.set('');
    this.cdpSearchResults.set([]);
    this.hasSearchedCdps.set(false);
    this.isSearchingCdps.set(false);
    this.isApprovingCdp.set(false);
  }
}