import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { CoordinationService } from '../../data/coordination.service';
import {
  TotalHorasPreloadItem,
  TotalPreload,
} from '../../model/coordination.model';
import { formatCurrencyCOP } from '../../model/professor-form.config';

const EMPTY_TOTAL: TotalPreload = {
  totalDocentes: 0,
  totalPrestaciones: 0,
  totalContratos: 0,
  totalPreasignacion: 0,
  totalHorasPreasignacion: [],
  totalHoras: 0,
};

@Component({
  selector: 'app-total-coordination',
  imports: [],
  templateUrl: './total-coordination.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TotalCoordination {
  private readonly coordinationService = inject(CoordinationService);

  idCarga = input<number | null>(null);
  refreshKey = input(0);

  private readonly totalResource = rxResource({
    params: () => {
      const idCarga = this.idCarga();
      const refreshKey = this.refreshKey();

      if (idCarga == null) {
        return undefined;
      }

      return { idCarga, refreshKey };
    },
    stream: ({ params }) =>
      this.coordinationService.getTotalPreload(params.idCarga),
    defaultValue: EMPTY_TOTAL,
  });

  readonly total = computed(() => this.totalResource.value() ?? EMPTY_TOTAL);

  readonly hoursByCodigo = computed(() =>
    this.toHoursByCodigo(this.total().totalHorasPreasignacion),
  );

  readonly totalDocentes = computed(() => this.total().totalDocentes);

  readonly totalPrestaciones = computed(() =>
    formatCurrencyCOP(this.total().totalPrestaciones),
  );

  readonly totalContratos = computed(() =>
    formatCurrencyCOP(this.total().totalContratos),
  );

  readonly totalPreasignacion = computed(() =>
    formatCurrencyCOP(this.total().totalPreasignacion),
  );

  readonly horasFad = computed(() =>
    this.formatHours(this.hoursByCodigo()['FAD']),
  );

  readonly horasFai = computed(() =>
    this.formatHours(this.hoursByCodigo()['FAI']),
  );

  readonly horasCtei = computed(() =>
    this.formatHours(this.hoursByCodigo()['CTEI']),
  );

  readonly horasIsu = computed(() =>
    this.formatHours(this.hoursByCodigo()['ISU']),
  );

  readonly horasAc = computed(() =>
    this.formatHours(this.hoursByCodigo()['AC']),
  );

  readonly totalHoras = computed(() =>
    this.formatHours(this.total().totalHoras),
  );

  private toHoursByCodigo(
    items: TotalHorasPreloadItem[],
  ): Record<string, number> {
    const map: Record<string, number> = {};
    for (const item of items) {
      const codigo = item.codigo?.trim().toUpperCase();
      if (!codigo) {
        continue;
      }
      map[codigo] = (map[codigo] ?? 0) + item.horas;
    }
    return map;
  }

  private formatHours(value: number | undefined): string {
    return `${value ?? 0}h`;
  }
}
