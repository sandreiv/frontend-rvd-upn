import { ChangeDetectionStrategy, Component, input, output } from "@angular/core";
import { Modal } from "../../../../../shared/ui/modal/modal";
import { ObservacionesCargaItem } from "../../model/observations-load";
import { DatePipe } from "@angular/common";
import { Icon } from "../../../../../shared/ui/icon/icon";

@Component({
  selector: 'app-observations-modal',
  imports: [
    Modal,
    DatePipe,
    Icon
],
  templateUrl: './observations-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ObservationsModal {

  isOpen = input(false);
  results = input<ObservacionesCargaItem[]>([]);
  isLoading = input(false);

  close = output<void>();

  onClose(): void {
    if (this.isLoading()) return;

    this.close.emit()
  }
}