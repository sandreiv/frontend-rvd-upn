import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
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
  idCarga = input<number | null>(null);
  refreshKey = input(0);

  readonly total = computed(() => EMPTY_TOTAL);

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
