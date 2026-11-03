import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { AuthService } from '../../../../../core/service/auth-service';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { Button } from '../../../../../shared/ui/button/button';
import {
  Select,
  type Option as SelectOption,
} from '../../../../../shared/components/form/select/select';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { UniversityPeriodItem } from '../../../preload-call/model/preload-call.model';
import { CoordinationDetail } from '../../components/coordination-detail/coordination-detail';
import { CoordinationTable } from '../../components/coordination-table/coordination-table';
import { CoordinationService } from '../../data/coordination.service';
import {
  CoordinationItem,
  CoordinationPreloadCallApi,
  UNASSIGNED_PRELOAD_CALL_FILTER,
  isAvalDesarrolloCarga,
} from '../../model/coordination.model';

@Component({
  selector: 'app-professor-preload',
  imports: [
    Button,
    Select,
    SectionFrame,
    CoordinationTable,
    CoordinationDetail,
  ],
  templateUrl: './professor-preload.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorPreload implements OnInit {
  private readonly coordinationService = inject(CoordinationService);

  private readonly authService = inject(AuthService);

  readonly universityPeriods = signal<UniversityPeriodItem[]>([]);
  readonly selectedPeriodId = signal('');
  readonly appliedPeriodId = signal<number | null>(null);
  readonly isLoadingPeriods = signal(false);

  readonly selectedPreloadCallId = signal(UNASSIGNED_PRELOAD_CALL_FILTER);
  readonly appliedFilterPreloadCallId = signal<string | null>(null);
  readonly selectedCoordinationIds = signal<string[]>([]);
  readonly selectedCoordination = signal<CoordinationItem | null>(null);
  readonly showCoordinationDetail = signal(false);
  readonly showAlterationDetail = signal(false);

  readonly activePreloadCallsResource = rxResource({
    params: () => {
      const idPeriodoUniversidad = this.resolveSelectedPeriodId();
      if (idPeriodoUniversidad == null) {
        return undefined;
      }
      return { idPeriodoUniversidad };
    },
    stream: ({ params }) =>
      this.coordinationService.getActivePreloadCall(
        params.idPeriodoUniversidad,
      ),
    defaultValue: [] as CoordinationPreloadCallApi[],
  });

  readonly coordinationsResource = rxResource({
    params: () => {
      const idPeriodoUniversidad = this.appliedPeriodId();
      const filterId = this.appliedFilterPreloadCallId();

      if (idPeriodoUniversidad == null || filterId === null) {
        return undefined;
      }

      const idConvocatoria =
        filterId === UNASSIGNED_PRELOAD_CALL_FILTER
          ? null
          : Number(filterId);

      return { idPeriodoUniversidad, idConvocatoria };
    },
    stream: ({ params }) =>
      this.coordinationService.getCoordinations(
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

  readonly preloadCallOptions = computed<SelectOption[]>(() => {
    const activeCalls = this.activePreloadCallsResource.value().map((item) => ({
      value: String(item.id),
      label: item.nombre,
    }));

    if (this.hideUnassignedPreloadCall()) {
      return activeCalls;
    }

    return [
      {
        value: UNASSIGNED_PRELOAD_CALL_FILTER,
        label: 'Sin convocatoria asignada',
      },
      ...activeCalls,
    ];
  });

  readonly coordinations = computed(() => this.coordinationsResource.value());

  readonly isLoadingPreloadCalls = computed(() =>
    this.activePreloadCallsResource.isLoading(),
  );

  readonly isLoadingCoordinations = computed(() =>
    this.coordinationsResource.isLoading(),
  );

  readonly hasAppliedFilter = computed(
    () =>
      this.appliedPeriodId() != null &&
      this.appliedFilterPreloadCallId() !== null,
  );

  readonly tableEmptyMessage = computed(() => {
    if (this.hasAppliedFilter()) {
      return 'No hay coordinaciones para mostrar.';
    }

    if (!this.selectedPeriodId()) {
      return 'Seleccione un periodo y pulse Filtrar.';
    }

    return 'Seleccione una convocatoria y pulse Filtrar.';
  });

  readonly hideUnassignedPreloadCall = computed(() => {
    const roles = this.authService
      .getRoles()
      .map((role) => role.trim().toLowerCase());

    return (
      roles.includes('decano') ||
      roles.includes('desarrollo academico')
    );
  });

  ngOnInit(): void {
    void this.loadUniversityPeriods();
  }

  onPeriodChange(periodId: string): void {
    this.selectedPeriodId.set(periodId);
    this.selectedPreloadCallId.set(UNASSIGNED_PRELOAD_CALL_FILTER);
  }

  onPreloadCallChange(preloadCallId: string): void {
    this.selectedPreloadCallId.set(preloadCallId);
  }

  onApplyCoordinationFilter(): void {
    const periodId = this.selectedPeriodId();

    if (!periodId) {
      this.appliedPeriodId.set(null);
      this.appliedFilterPreloadCallId.set(null);
      this.selectedCoordinationIds.set([]);
      this.closeCoordinationViews();
      return;
    }

    const nextPeriodId = Number(periodId);

    if (Number.isNaN(nextPeriodId)) {
      return;
    }

    this.appliedPeriodId.set(nextPeriodId);
    this.appliedFilterPreloadCallId.set(this.selectedPreloadCallId());
    this.selectedCoordinationIds.set([]);
    this.closeCoordinationViews();
  }

  onRefreshCoordinations(): void {
    if (this.appliedPeriodId() == null) {
      return;
    }

    this.coordinationsResource.reload();
  }

  onStartPreassignment(coordination: CoordinationItem): void {
    this.openCoordinationDetail(coordination);
  }

  onOpenAlteration(coordination: CoordinationItem): void {
    if (!coordination?.id || !isAvalDesarrolloCarga(coordination.estadoCarga)) {
      return;
    }

    this.selectedCoordination.set(coordination);
    this.showAlterationDetail.set(true);
    this.showCoordinationDetail.set(false);
  }

  private openCoordinationDetail(coordination: CoordinationItem): void {
    this.selectedCoordination.set(coordination);
    this.showCoordinationDetail.set(true);
    this.showAlterationDetail.set(false);
  }

  onBackToCoordinationList(): void {
    this.syncListFilterWithSelectedCoordination();
    this.closeCoordinationViews();
  }

  onCargaValorChange(valor: number | null): void {
    const current = this.selectedCoordination();
    if (current == null || current.valor === valor) {
      return;
    }
    this.selectedCoordination.set({ ...current, valor });
  }

  private closeCoordinationViews(): void {
    this.showCoordinationDetail.set(false);
    this.showAlterationDetail.set(false);
    this.selectedCoordination.set(null);
  }

  private syncListFilterWithSelectedCoordination(): void {
    const coordination = this.selectedCoordination();

    if (!coordination) {
      return;
    }

    const filterId =
      coordination.idConvocatoria != null
        ? String(coordination.idConvocatoria)
        : UNASSIGNED_PRELOAD_CALL_FILTER;

    this.selectedPreloadCallId.set(filterId);
    this.appliedFilterPreloadCallId.set(filterId);
    this.selectedCoordinationIds.set([String(coordination.id)]);

    this.coordinationsResource.reload();
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
        this.coordinationService.getUniversityPeriod(),
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
