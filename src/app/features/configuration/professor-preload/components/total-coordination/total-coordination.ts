import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CoordinationService } from '../../data/coordination.service';
import { CoordinationItem } from '../../model/coordination.model';
import {
  EMPTY_COORDINATION_LOAD_TOTAL,
  formatLoadHours,
} from '../../model/coordination-load-total.model';
import { formatCurrencyValue } from '../../../../../shared/utils/currency.util';

@Component({
  selector: 'app-total-coordination',
  imports: [],
  templateUrl: './total-coordination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TotalCoordination {
  private readonly coordinationService = inject(CoordinationService);

  readonly coordination = input.required<CoordinationItem>();

  readonly loadTotalResource = rxResource({
    params: () => {
      const coordination = this.coordination();
      if (coordination.idConvocatoria == null) {
        return undefined;
      }

      return {
        idCoordinacion: coordination.id,
        idConvocatoria: coordination.idConvocatoria,
      };
    },
    stream: ({ params }) =>
      this.coordinationService.getCoordinationLoadTotal(
        params.idCoordinacion,
        params.idConvocatoria,
      ),
    defaultValue: EMPTY_COORDINATION_LOAD_TOTAL,
  });

  readonly total = computed(() => this.loadTotalResource.value());

  readonly isLoading = computed(() => this.loadTotalResource.isLoading());

  readonly parentHours = computed(() => this.total().totalHorasCarga ?? []);

  readonly docentesLabel = computed(() =>
    this.amountLabel(this.total().totalDocentes, false),
  );

  readonly prestacionesLabel = computed(() =>
    this.amountLabel(this.total().totalPrestaciones, true),
  );

  readonly contratosLabel = computed(() =>
    this.amountLabel(this.total().totalContratos, true),
  );

  readonly cargaLabel = computed(() =>
    this.amountLabel(this.total().totalPreasignacion, true),
  );

  readonly totalHorasLabel = computed(() => {
    if (this.isLoading()) {
      return '…';
    }

    return formatLoadHours(this.total().totalHoras);
  });

  hoursLabel(hours: number): string {
    return formatLoadHours(hours);
  }

  private amountLabel(value: number, asCurrency: boolean): string {
    if (this.isLoading()) {
      return '…';
    }

    if (asCurrency) {
      return formatCurrencyValue(value);
    }

    return String(value ?? 0);
  }
}
