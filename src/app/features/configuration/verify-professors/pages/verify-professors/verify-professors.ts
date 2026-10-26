import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { BreadcrumbTitle } from '../../../../../core/service/breadcrumb-title';
import { Button } from '../../../../../shared/ui/button/button';
import {
  Select,
  type Option as SelectOption,
} from '../../../../../shared/components/form/select/select';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { UniversityPeriodItem } from '../../../preload-call/model/preload-call.model';
import { ProfessorSummary } from '../../../professor-preload/components/professor-summary/professor-summary';
import { VerifyProfessorsTable } from '../../components/verify-professors-table/verify-professors-table';
import { VerifyProfessorsService } from '../../data/verify-professors.service';
import {
  AcademicCoordinationItem,
  VerifyPreloadCallItem,
  VerifyProfessorItem,
  VerifyProfessorsFilter,
  VERIFY_PROFESSORS_QUERY,
  coordinationLabel,
  toContractModality,
  toModalityProfessor,
  toSummaryCoordination,
} from '../../model/verify-professors.model';
import { PermissionService } from '../../../../../core/service/permission-service';
import { NewModal } from '../../../../../shared/ui/new-modal/new-modal';

@Component({
  selector: 'app-verify-professors',
  imports: [
    Button,
    Select,
    SectionFrame,
    VerifyProfessorsTable,
    ProfessorSummary,
    NewModal,
  ],
  templateUrl: './verify-professors.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyProfessors implements OnInit, OnDestroy {
  private readonly verifyProfessorsService = inject(VerifyProfessorsService);
  private readonly breadcrumbTitle = inject(BreadcrumbTitle);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly permissions = inject(PermissionService);
  readonly universityPeriods = signal<UniversityPeriodItem[]>([]);
  readonly selectedPeriodId = signal('');
  readonly selectedPreloadCallId = signal('');
  readonly selectedCoordinationId = signal('');
  readonly appliedFilter = signal<VerifyProfessorsFilter | null>(null);
  readonly selectedProfessor = signal<VerifyProfessorItem | null>(null);
  readonly showSummary = signal(false);
  readonly isReviewing = signal(false);

  readonly pendingReview = signal<{
    action: 'verify' | 'decline';
    idCargaDocente: number;
    observacion: string;
  } | null>(null);

  readonly reviewTitle = computed(() =>
    this.pendingReview()?.action === 'verify'
      ? 'Verificar docente'
      : 'Devolver docente',
  );

  readonly reviewMessage = computed(() =>
    this.pendingReview()?.action === 'verify'
      ? '¿Seguro que deseas verificar este docente? Su estado cambiará a Verificado.'
      : '¿Seguro que deseas devolver este docente? Su estado cambiará a Devuelto para que el coordinador pueda realizar las correcciones.',
  );

  readonly reviewButtonText = computed(() => {
    const verifying = this.pendingReview()?.action === 'verify';

    if (this.isReviewing()) {
      return verifying ? 'Verificando...' : 'Devolviendo...';
    }

    return verifying ? 'Sí, verificar' : 'Sí, devolver';
  });
  readonly isLoadingPeriods = signal(false);

  readonly activePreloadCallsResource = rxResource({
    params: () => {
      const idPeriodoUniversidad = this.parseId(this.selectedPeriodId());
      if (idPeriodoUniversidad == null) {
        return undefined;
      }
      return { idPeriodoUniversidad };
    },
    stream: ({ params }) =>
      this.verifyProfessorsService.listActivePreloadCalls(
        params.idPeriodoUniversidad,
      ),
    defaultValue: [] as VerifyPreloadCallItem[],
  });

  readonly coordinationsResource = rxResource({
    params: () => {
      const idPeriodoUniversidad = this.parseId(this.selectedPeriodId());
      const idConvocatoria = this.parseId(this.selectedPreloadCallId());
      if (idPeriodoUniversidad == null || idConvocatoria == null) {
        return undefined;
      }
      return { idPeriodoUniversidad, idConvocatoria };
    },
    stream: ({ params }) =>
      this.verifyProfessorsService.listAcademicCoordinations(
        params.idPeriodoUniversidad,
        params.idConvocatoria,
      ),
    defaultValue: [] as AcademicCoordinationItem[],
  });

  readonly professorsResource = rxResource({
    params: () => this.appliedFilter() ?? undefined,
    stream: ({ params }) =>
      this.verifyProfessorsService.listProfessors(params),
    defaultValue: [] as VerifyProfessorItem[],
  });

  readonly periodOptions = computed<SelectOption[]>(() =>
    this.universityPeriods().map((item) => ({
      value: String(item.id),
      label: `${item.anio} - ${item.periodo}`,
    })),
  );

  readonly preloadCallOptions = computed<SelectOption[]>(() =>
    this.activePreloadCallsResource.value().map((item) => ({
      value: String(item.id),
      label: item.nombre,
    })),
  );

  readonly coordinations = computed(
    () => this.coordinationsResource.value(),
  );

  readonly coordinationOptions = computed<SelectOption[]>(() =>
    this.coordinations().map((item) => ({
      value: String(item.id),
      label: coordinationLabel(item),
    })),
  );

  readonly professors = computed(() => this.professorsResource.value());

  readonly isLoadingPreloadCalls = computed(() =>
    this.activePreloadCallsResource.isLoading(),
  );

  readonly isLoadingCoordinations = computed(() =>
    this.coordinationsResource.isLoading(),
  );

  readonly isLoadingProfessors = computed(() =>
    this.professorsResource.isLoading(),
  );

  readonly hasAppliedFilter = computed(() => this.appliedFilter() != null);

  readonly isFilterDisabled = computed(
    () =>
      this.isLoadingPeriods() ||
      this.isLoadingCoordinations() ||
      this.isLoadingPreloadCalls() ||
      this.isLoadingProfessors() ||
      !this.selectedPeriodId() ||
      !this.selectedPreloadCallId() ||
      !this.selectedCoordinationId(),
  );

  readonly tableEmptyMessage = computed(() => {
    if (this.hasAppliedFilter()) {
      return 'No hay docentes para verificar.';
    }

    return 'Seleccione periodo, convocatoria y coordinación y pulse Filtrar.';
  });

  readonly summaryProfessor = computed(() => {
    const item = this.selectedProfessor();
    return item ? toModalityProfessor(item) : null;
  });

  readonly summaryCoordination = computed(() => {
    const idCoordinacion = this.appliedFilter()?.idCoordinacion;
    if (idCoordinacion == null) {
      return null;
    }

    const coordination = this.coordinations().find(
      (item) => item.id === idCoordinacion,
    );

    return coordination ? toSummaryCoordination(coordination) : null;
  });

  readonly summaryModality = computed(() => {
    const item = this.selectedProfessor();
    return item ? toContractModality(item) : null;
  });

  readonly loadSummary = (idCargaDocente: number) =>
    this.verifyProfessorsService.getProfessorLoadSummary(idCargaDocente);

  async ngOnInit(): Promise<void> {
    this.breadcrumbTitle.setPageTitle('Verificar docentes');
    await this.loadUniversityPeriods();
    this.listenQueryFilter();
  }

  ngOnDestroy(): void {
    this.breadcrumbTitle.clearPageTitle();
  }

  onPeriodChange(periodId: string): void {
    this.selectedPeriodId.set(periodId);
    this.selectedPreloadCallId.set('');
    this.selectedCoordinationId.set('');
  }

  onPreloadCallChange(preloadCallId: string): void {
    this.selectedPreloadCallId.set(preloadCallId);
    this.selectedCoordinationId.set('');
  }

  onCoordinationChange(coordinationId: string): void {
    this.selectedCoordinationId.set(coordinationId);
  }

  onApplyFilter(): void {
    const idPeriodoUniversidad = this.parseId(this.selectedPeriodId());
    const idConvocatoria = this.parseId(this.selectedPreloadCallId());
    const idCoordinacion = this.parseId(this.selectedCoordinationId());

    if (
      idPeriodoUniversidad == null ||
      idConvocatoria == null ||
      idCoordinacion == null
    ) {
      this.appliedFilter.set(null);
      return;
    }

    this.appliedFilter.set({
      idPeriodoUniversidad,
      idConvocatoria,
      idCoordinacion,
    });
  }

  onRefreshProfessors(): void {
    if (this.appliedFilter() == null) {
      return;
    }

    this.professorsResource.reload();
  }

  onViewSummary(professor: VerifyProfessorItem): void {
    if (
      professor.idCargaDocente == null ||
      this.pendingReview() != null ||
      this.isReviewing()
    ) {
      return;
    }

    this.selectedProfessor.set(professor);
    this.showSummary.set(true);
  }

  onCloseSummary(): void {
    if (this.pendingReview() != null || this.isReviewing()) {
      return;
    }

    this.showSummary.set(false);
    this.selectedProfessor.set(null);
  }

  onRequestReview(
    action: 'verify' | 'decline',
    observation: string,
  ): void {
    if (
      !this.showSummary() ||
      this.pendingReview() != null ||
      this.isReviewing()
    ) {
      return;
    }

    const professor = this.summaryProfessor();

    if (
      professor?.idCargaDocente == null ||
      professor.estado !== '1'
    ) {
      return;
    }

    const allowed = action === 'verify'
      ? this.permissions.canVerifyProfessor()
      : this.permissions.canDeclineProfessorVerification();

    if (!allowed) {
      return;
    }

    const observacion = observation.trim();

    if (observacion.length > 500) {
      return;
    }

    this.pendingReview.set({
      action,
      idCargaDocente: professor.idCargaDocente,
      observacion,
    });
  }

  onCancelReview(): void {
    if (this.isReviewing()) {
      return;
    }

    this.pendingReview.set(null);
  }

  async onConfirmReview(): Promise<void> {
    const review = this.pendingReview();

    if (review == null || this.isReviewing()) {
      return;
    }

    const allowed = review.action === 'verify'
      ? this.permissions.canVerifyProfessor()
      : this.permissions.canDeclineProfessorVerification();

    if (!allowed) {
      this.pendingReview.set(null);
      return;
    }

    this.isReviewing.set(true);

    try {
      const request = review.action === 'verify'
        ? this.verifyProfessorsService.verifyProfessor(
            review.idCargaDocente,
            review.observacion,
          )
        : this.verifyProfessorsService.declineProfessor(
            review.idCargaDocente,
            review.observacion,
          );

      await firstValueFrom(request);
    } catch {
      // El interceptor existente muestra el error.
      // Conservamos el resumen y la observación.
      return;
    } finally {
      this.isReviewing.set(false);
      this.pendingReview.set(null);
    }

    this.showSummary.set(false);
    this.selectedProfessor.set(null);

    this.professorsResource.reload();
    this.coordinationsResource.reload();
  }

  private listenQueryFilter(): void {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((query) => this.applyQueryFilter(query));
  }

  private applyQueryFilter(query: ParamMap): void {
    const periodo = query.get(VERIFY_PROFESSORS_QUERY.PERIODO) ?? '';
    const convocatoria =
      query.get(VERIFY_PROFESSORS_QUERY.CONVOCATORIA) ?? '';
    const coordinacion =
      query.get(VERIFY_PROFESSORS_QUERY.COORDINACION) ?? '';

    if (!periodo || !convocatoria || !coordinacion) {
      return;
    }

    this.selectedPeriodId.set(periodo);
    this.selectedPreloadCallId.set(convocatoria);
    this.selectedCoordinationId.set(coordinacion);
    this.onApplyFilter();
  }

  private parseId(value: string): number | null {
    if (!value) {
      return null;
    }

    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  private async loadUniversityPeriods(): Promise<void> {
    this.isLoadingPeriods.set(true);

    try {
      const periods = await firstValueFrom(
        this.verifyProfessorsService.listUniversityPeriod(),
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
