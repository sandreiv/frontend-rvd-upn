import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { PersonaAutorizaConvocatoriaItem } from '../../model/preload-call.model';

@Component({
  selector: 'app-preload-call-person-search-modal',
  imports: [Modal],
  templateUrl: './preload-call-person-search-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreloadCallPersonSearchModal {
  readonly isOpen = input(false);
  readonly results = input<PersonaAutorizaConvocatoriaItem[]>([]);
  readonly isLoading = input(false);

  readonly close = output<void>();
  readonly personSelected = output<PersonaAutorizaConvocatoriaItem>();

  onSelect(person: PersonaAutorizaConvocatoriaItem): void {
    this.personSelected.emit(person);
  }

  formatPhone(phone: string | null): string {
    return phone?.trim() ? phone : '—';
  }
}
