import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { BreadcrumbTitle } from '../../../../../core/service/breadcrumb-title';
import { Button } from '../../../../../shared/ui/button/button';
import {
  Select,
  type Option as SelectOption,
} from '../../../../../shared/components/form/select/select';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { UniversityPeriodItem } from '../../../preload-call/model/preload-call.model';
import { CoordinationItem } from '../../../professor-preload/model/coordination.model';
import { HiringCallTable } from '../../components/hiring-call-table/hiring-call-table';
import { CoordinationDetail } from '../../components/coordination-detail/coordination-detail';
import { HiringCallService } from '../../data/hiring-call.service';
import { HiringCallItem } from '../../model/hiring-call.model';

@Component({
  selector: 'app-hiring-call',
  imports: [SectionFrame, HiringCallTable, CoordinationDetail, Select, Button],
  templateUrl: './hiring-call.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HiringCall implements OnInit, OnDestroy {
  private readonly hiringCallService = inject(HiringCallService);
  private readonly breadcrumbTitleService = inject(BreadcrumbTitle);

  readonly universityPeriods = signal<UniversityPeriodItem[]>([]);
  readonly selectedPeriodId = signal('');
  readonly selectedCallId = signal('');
  readonly appliedPeriodId = signal<number | null>(null);
  readonly appliedCallId = signal<number | null>(null);
  readonly isLoadingPeriods = signal(false);
  readonly selectedCoordinationIds = signal<string[]>([]);
  readonly isStartingHiring = signal(false);
  readonly showCoordinationDetail = signal(false);
  readonly selectedCoordination = signal<CoordinationItem | null>(null);

  readonly hiringCallsResource = rxResource({
    params: () => {
      const idPeriodoUniversidad = this.resolveSelectedPeriodId();
      if (idPeriodoUniversidad == null) {
        return undefined;
      }
      return { idPeriodoUniversidad };
    },
    stream: ({ params }) =>
      this.hiringCallService.listHiringCalls(params.idPeriodoUniversidad),
    defaultValue: [] as HiringCallItem[],
  });

  readonly coordinationsResource = rxResource({
    params: () => {
      const idPeriodoUniversidad = this.appliedPeriodId();
      if (idPeriodoUniversidad == null) {
        return undefined;
      }

      return {
        idPeriodoUniversidad,
        idConvocatoria: this.appliedCallId(),
      };
    },
    stream: ({ params }) =>
      this.hiringCallService.listCoordinations(
        params.idPeriodoUniversidad,
        params.idConvocatoria,
      ),
    defaultValue: [] as CoordinationItem[],
  });

  readonly periodOptions = computed<SelectOption[]>(() =>
    this.universityPeriods().map((item) => ({
      value: String(item.id),
      label: `${item.anio} - ${item.periodo}`,
    })),
  );

  readonly callOptions = computed<SelectOption[]>(() =>
    this.hiringCallsResource.value().map((item) => ({
      value: String(item.id),
      label: item.nombre || item.descripcion || `Convocatoria ${item.id}`,
    })),
  );

  readonly coordinations = computed(
    () => this.coordinationsResource.value(),
  );

  readonly isLoadingCalls = computed(() =>
    this.hiringCallsResource.isLoading(),
  );

  readonly isLoadingCoordinations = computed(() =>
    this.coordinationsResource.isLoading(),
  );

  readonly tableEmptyMessage = computed(() => {
    if (this.appliedPeriodId() != null) {
      return 'No hay coordinaciones en aval desarrollo para el filtro seleccionado.';
    }

    if (!this.selectedPeriodId()) {
      return 'Seleccione un periodo y pulse Filtrar.';
    }

    return 'Seleccione una convocatoria y pulse Filtrar.';
  });

  ngOnInit(): void {
    this.breadcrumbTitleService.setPageTitle('Convocatoria contratación');
    void this.loadUniversityPeriods();
  }

  ngOnDestroy(): void {
    this.breadcrumbTitleService.clearPageTitle();
  }

  onPeriodChange(periodId: string): void {
    this.selectedPeriodId.set(periodId);
    this.selectedCallId.set('');
    this.selectedCoordinationIds.set([]);
    this.closeCoordinationDetail();
  }

  onCallChange(callId: string): void {
    this.selectedCallId.set(callId);
  }

  onApplyFilter(): void {
    const periodId = this.selectedPeriodId();

    if (!periodId) {
      this.appliedPeriodId.set(null);
      this.appliedCallId.set(null);
      this.selectedCoordinationIds.set([]);
      this.closeCoordinationDetail();
      return;
    }

    const nextPeriodId = Number(periodId);
    if (Number.isNaN(nextPeriodId)) {
      return;
    }

    const callId = this.selectedCallId();
    const nextCallId = callId ? Number(callId) : null;

    this.appliedPeriodId.set(nextPeriodId);
    this.appliedCallId.set(
      nextCallId != null && !Number.isNaN(nextCallId) ? nextCallId : null,
    );
    this.selectedCoordinationIds.set([]);
    this.closeCoordinationDetail();
  }

  onRefreshCoordinations(): void {
    if (this.appliedPeriodId() == null) {
      return;
    }

    this.coordinationsResource.reload();
  }

  onStartHiring(coordination: CoordinationItem): void {
    if (this.isStartingHiring() || !coordination?.id) {
      return;
    }

    this.selectedCoordination.set(coordination);
    this.showCoordinationDetail.set(true);
  }

  closeCoordinationDetail(): void {
    this.showCoordinationDetail.set(false);
    this.selectedCoordination.set(null);
  }

  private resolveSelectedPeriodId(): number | null {
    const periodId = this.selectedPeriodId();
    if (!periodId) {
      return null;
    }

    const parsed = Number(periodId);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private async loadUniversityPeriods(): Promise<void> {
    this.isLoadingPeriods.set(true);

    try {
      const periods = await firstValueFrom(
        this.hiringCallService.getUniversityPeriod(),
      );
      this.universityPeriods.set(periods ?? []);
    } catch (error) {
      console.error('Error al cargar periodos universitarios:', error);
      this.universityPeriods.set([]);
    } finally {
      this.isLoadingPeriods.set(false);
    }
  }
}
