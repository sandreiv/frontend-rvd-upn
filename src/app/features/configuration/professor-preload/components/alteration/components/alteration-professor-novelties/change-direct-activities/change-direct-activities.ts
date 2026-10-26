import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Icon } from '../../../../../../../../shared/ui/icon/icon';
import { CollapsibleSection } from '../../../../../../../../shared/components/form/collapsible-section/collapsible-section';
import { DirectActivityCard } from '../../../../professor-activities-modal/components/direct-activity-card/direct-activity-card';
import { CoordinationService } from '../../../../../data/coordination.service';
import { CAREER_PROFESSOR_MAX_ACTIVITY_HOURS } from '../../../../../model/career-professor.config';
import {
  CoordinationContractModality,
  CoordinationItem,
  LoadRestrictionPreview,
  ModalityProfessor,
  WorkDate,
} from '../../../../../model/coordination.model';
import {
  ActividadModalidadDTO,
  ActivityFormType,
  TipoActividad,
} from '../../../../../model/professor-activities.model';
import {
  DetailProfessorPreloadApi,
  DetailProfessorPreloadItemApi,
} from '../../../../../model/detail-professor-preload.model';
import {
  DirectLearningActivity,
  SimpleActivity,
} from '../../../../../model/professor-activities-modal.models';
import { ProfessorProjectRow } from '../../../../../model/professor-projects.model';
import {
  buildCareerActivityItems,
  buildComponenteByCodigo,
  buildVisibleActivityItems,
  createInitialAddFormOpen,
} from '../../../../../model/professor-activities.config';
import { mapDetailProfessorPreloadToModalState } from '../../../../../model/professor-activities-load.mapper';
import { parseMaxWeeklyHours } from '../../../../../model/professor-form.config';
import { flattenDirectActivities } from '../../../../../model/direct-activities-novelty.mapper';
import { SaveDetailProfessorPreloadInput } from '../../../../../model/professor-activities-save.mapper';
import {
  buildNoveltyActivityDistributionRequest,
  hasNoveltyChanges,
} from '../../../../../model/professor-activities-novelty-save.mapper';
import {
  computeProfessorContractTotal,
  isCatedraFormaPago,
} from '../../../../../model/professor-contract-value';
import { forNext } from '../../../../../../../../core/utils/for-next.function';
import { NoveltyComponentState } from '../novelty-component-state';
import { NoveltyBudgetStore } from '../novelty-budget.store';

@Component({
  selector: 'app-change-direct-activities',
  imports: [Icon, CollapsibleSection, DirectActivityCard],
  templateUrl: './change-direct-activities.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeDirectActivities {
  private readonly coordinationService = inject(CoordinationService);
  private readonly noveltyState = inject(NoveltyComponentState);
  private readonly budgetStore = inject(NoveltyBudgetStore);

  professor = input<ModalityProfessor | null>(null);
  contractModality = input<CoordinationContractModality | null>(null);
  coordination = input<CoordinationItem | null>(null);
  noveltyId = input<number | null>(null);

  readonly hasSavedDetail = signal(false);
  readonly directByCodigo = signal<
    Record<string, DirectLearningActivity[]>
  >({});
  private readonly criteriaByCodigo = signal<
    Record<string, SimpleActivity[]>
  >({});
  private readonly projectsByCodigo = signal<
    Record<string, ProfessorProjectRow[]>
  >({});
  private readonly loadedDetailsById = signal<
    Map<number, DetailProfessorPreloadItemApi>
  >(new Map());
  readonly expandedCategories = signal<Record<string, boolean>>({});
  readonly addFormOpen = signal<Record<string, boolean>>({});
  private readonly expandedInitialized = signal(false);

  readonly activityTypesResource = rxResource({
    params: () => true,
    stream: () => this.coordinationService.listActivityTypes(),
    defaultValue: [] as TipoActividad[],
  });

  readonly activitiesModalityResource = rxResource({
    params: () => {
      const idModalidadContratacion = this.contractModality()?.id;
      if (idModalidadContratacion == null) {
        return undefined;
      }
      return { idModalidadContratacion };
    },
    stream: ({ params }) =>
      this.coordinationService.listActivitiesModality(
        params.idModalidadContratacion,
      ),
    defaultValue: {
      idModalidadContratacion: 0,
      tipoActividades: [],
    } as ActividadModalidadDTO,
  });

  readonly workDatesResource = rxResource({
    params: () => {
      const idCarga = this.coordination()?.idCarga;
      const idModalidadContratacion = this.contractModality()?.id;
      if (idCarga == null || idModalidadContratacion == null) {
        return undefined;
      }
      return { idCarga, idModalidadContratacion };
    },
    stream: ({ params }) =>
      this.coordinationService.getWorkDates(
        params.idCarga,
        params.idModalidadContratacion,
      ),
    defaultValue: [] as WorkDate[],
  });

  readonly loadRestrictionResource = rxResource<
    LoadRestrictionPreview | null,
    { modalityId: number } | undefined
  >({
    params: () => {
      const modalityId = this.contractModality()?.id;
      if (modalityId == null) {
        return undefined;
      }
      return { modalityId };
    },
    stream: ({ params }) =>
      this.coordinationService
        .getLoadRestrictionByModality(params.modalityId)
        .pipe(catchError(() => of(null))),
    defaultValue: null,
  });

  readonly detailResource = rxResource({
    params: () => {
      const idCargaDocente = this.professor()?.idCargaDocente;
      if (idCargaDocente == null) {
        return undefined;
      }
      return { idCargaDocente };
    },
    stream: ({ params }) =>
      this.coordinationService
        .listNoveltyDetailProfessorPreload(params.idCargaDocente)
        .pipe(catchError(() => of([] as DetailProfessorPreloadApi))),
    defaultValue: [] as DetailProfessorPreloadApi,
  });

  readonly isLoadingDetail = computed(
    () => this.detailResource.isLoading(),
  );

  readonly isLoadingActivityCategories = computed(
    () => this.activitiesModalityResource.isLoading(),
  );

  readonly visibleActivityItems = computed(() => {
    const activityTypes = this.activityTypesResource.value();
    if (this.contractModality() == null) {
      return buildCareerActivityItems(activityTypes);
    }
    return buildVisibleActivityItems(
      this.activitiesModalityResource.value().tipoActividades ?? [],
      activityTypes,
    );
  });

  readonly visibleDirectItems = computed(() =>
    this.visibleActivityItems().filter(
      (item) => item.formType === 'direct',
    ),
  );

  readonly canViewDirects = computed(
    () => this.visibleDirectItems().length > 0,
  );

  readonly directActivityContext = computed(() => {
    const coordination = this.coordination();
    if (
      !coordination?.id ||
      coordination.idNivelEducativo == null ||
      coordination.idPeriodoUniversidad == null
    ) {
      return null;
    }
    return {
      idCoordinacion: coordination.id,
      idNivelEducativo: coordination.idNivelEducativo,
      idPeriodoUniversidad: coordination.idPeriodoUniversidad,
      idModalidadContratacion: this.contractModality()?.id ?? null,
      idCargaDocente: this.professor()?.idCargaDocente ?? null,
    };
  });

  readonly allDirectActivities = computed(() =>
    flattenDirectActivities(this.directByCodigo()),
  );

  readonly categoryHours = computed((): Record<string, number> => {
    const hours: Record<string, number> = {};
    forNext(this.visibleActivityItems(), (item) => {
      hours[item.codigo] = this.hoursForItem(
        item.formType,
        item.codigo,
      );
    });
    return hours;
  });

  readonly totalAssignedHours = computed(() => {
    let total = 0;
    const hours = this.categoryHours();
    forNext(Object.keys(hours), (codigo) => {
      total += hours[codigo] ?? 0;
    });
    return total;
  });

  readonly professorWorkDate = computed(() => {
    const idFecha = this.professor()?.idFechasConvocatoria;
    if (idFecha == null) {
      return null;
    }
    return (
      this.workDatesResource
        .value()
        .find((item) => item.id === idFecha) ?? null
    );
  });

  readonly weeklyHoursLabel = computed(() => {
    const exception = String(
      this.professor()?.horasDeExcepcion ?? '',
    ).trim();
    if (exception) {
      return exception;
    }
    return this.professorWorkDate()?.rangoHoras ?? '';
  });

  readonly weeklyHoursLimit = computed(() => {
    if (this.contractModality() == null) {
      return CAREER_PROFESSOR_MAX_ACTIVITY_HOURS;
    }
    return parseMaxWeeklyHours(this.weeklyHoursLabel());
  });

  readonly isLoadingWorkDates = computed(
    () => this.workDatesResource.isLoading(),
  );

  readonly withinWeeklyLimit = computed(() => {
    const limit = this.weeklyHoursLimit();
    if (limit == null) {
      return true;
    }
    return this.totalAssignedHours() <= limit;
  });

  private readonly distribution = computed(() => {
    const input = this.buildSaveInput();
    const loadedDetails = this.loadedDetailsById();
    const result = buildNoveltyActivityDistributionRequest(
      input,
      loadedDetails,
    );
    const deleteIds = this.getDeletedDetailsIds();
    return {
      ...result,
      deleteIds,
      hasChanges:
        hasNoveltyChanges(input, loadedDetails) ||
        deleteIds.length > 0,
    };
  });

  constructor() {
    effect(() => {
      this.professor()?.idCargaDocente;
      this.contractModality()?.id;
      untracked(() => this.expandedInitialized.set(false));
    });

    effect(() => this.onDetailLoad());
    effect(() => this.onExpandInit());
    effect(() => this.onNoveltySync());
  }

  hoursLabel(hours: number): string {
    return `${hours ?? 0}h`;
  }

  isCategoryExpanded(codigo: string): boolean {
    return this.expandedCategories()[codigo] === true;
  }

  onCategoryExpandedChange(codigo: string, expanded: boolean): void {
    this.expandedCategories.update((current) => ({
      ...current,
      [codigo]: expanded,
    }));
  }

  isAddFormOpen(codigo: string): boolean {
    return this.addFormOpen()[codigo] === true;
  }

  onAddFormOpenChange(codigo: string, isFormOpen: boolean): void {
    this.addFormOpen.update((current) => ({
      ...current,
      [codigo]: isFormOpen,
    }));
  }

  directActivitiesForCodigo(codigo: string): DirectLearningActivity[] {
    return this.directByCodigo()[codigo] ?? [];
  }

  setDirectActivitiesForCodigo(
    codigo: string,
    activities: DirectLearningActivity[],
  ): void {
    this.directByCodigo.update((current) => ({
      ...current,
      [codigo]: activities,
    }));
  }

  private onDetailLoad(): void {
    if (
      this.detailResource.isLoading() ||
      this.activitiesModalityResource.isLoading()
    ) {
      untracked(() => this.clearActivitySignals());
      return;
    }
    const detail = this.detailResource.value();
    const componenteByCodigo = buildComponenteByCodigo(
      this.activitiesModalityResource.value().tipoActividades ?? [],
    );
    untracked(() =>
      this.applyLoadedDetail(detail, componenteByCodigo),
    );
  }

  private onExpandInit(): void {
    if (
      this.isLoadingActivityCategories() ||
      this.expandedInitialized()
    ) {
      return;
    }
    const codigos = this.visibleDirectItems().map(
      (item) => item.codigo,
    );
    untracked(() => {
      this.expandedCategories.set(this.expandAll(codigos));
      this.addFormOpen.set(createInitialAddFormOpen(codigos));
      this.expandedInitialized.set(true);
    });
  }

  private onNoveltySync(): void {
    const formaPago =
      this.loadRestrictionResource.value()?.formaPago;
    this.totalAssignedHours();
    this.professor();
    this.contractModality();
    const { saveRequest, updateRequests, deleteIds, hasChanges } =
      this.distribution();
    const canSave =
      this.withinWeeklyLimit() &&
      hasChanges &&
      this.canViewDirects();
    if (!canSave) {
      untracked(() => {
        this.noveltyState.clear();
        this.budgetStore.clearDraft();
      });
      return;
    }
    untracked(() => {
      this.noveltyState.setChangeDirectActivities(
        saveRequest,
        updateRequests,
        deleteIds,
      );
      this.writeBudgetDraft(formaPago);
    });
  }

  private buildSaveInput(): SaveDetailProfessorPreloadInput {
    const coordination = this.coordination();
    return {
      idCargaDocente: this.professor()?.idCargaDocente ?? 0,
      idCentroCosto: coordination?.centroCosto?.id ?? null,
      centroCostoDescripcion:
        coordination?.centroCosto?.descripcion ?? null,
      activityTypes: this.resolveActivityTypesForSave(),
      directByCodigo: this.directByCodigo(),
      criteriaByCodigo: this.criteriaByCodigo(),
      projectsByCodigo: this.projectsByCodigo(),
    };
  }

  private writeBudgetDraft(
    formaPago: string | null | undefined,
  ): void {
    const professor = this.professor();
    const idCargaDocente = professor?.idCargaDocente;
    if (
      professor == null ||
      idCargaDocente == null ||
      !isCatedraFormaPago(formaPago)
    ) {
      this.budgetStore.clearDraft();
      return;
    }
    const totalNuevo = computeProfessorContractTotal({
      formaPago,
      fechaInicio: professor.fechaInicio,
      fechaFin: professor.fechaFin,
      valorHora: professor.valorHora,
      semanas: professor.semanas,
      horasActividades: this.totalAssignedHours(),
    });
    this.budgetStore.setDraft({
      idCargaDocente,
      totalAnterior: this.budgetStore.totalAnteriorOf(idCargaDocente),
      totalNuevo,
    });
  }

  private applyLoadedDetail(
    detail: DetailProfessorPreloadApi,
    componenteByCodigo: Record<string, ActivityFormType>,
  ): void {
    const state = mapDetailProfessorPreloadToModalState(
      detail,
      componenteByCodigo,
    );
    const loadedDetails = new Map<
      number,
      DetailProfessorPreloadItemApi
    >();
    forNext(detail, (item) => {
      loadedDetails.set(
        item.idDetalleCargaDocente,
        structuredClone(item),
      );
    });
    this.loadedDetailsById.set(loadedDetails);
    this.directByCodigo.set(state.directByCodigo);
    this.criteriaByCodigo.set(state.criteriaByCodigo);
    this.projectsByCodigo.set(state.projectsByCodigo);
    this.hasSavedDetail.set(state.hasSavedDetail);
  }

  private hoursForItem(
    formType: ActivityFormType,
    codigo: string,
  ): number {
    if (formType === 'direct') {
      return this.sumHours(
        this.directByCodigo()[codigo],
        (item) => item.horasPresenciales,
      );
    }
    if (formType === 'criteria') {
      return this.sumHours(
        this.criteriaByCodigo()[codigo],
        (item) => item.horasDedicacion,
      );
    }
    return this.sumHours(
      this.projectsByCodigo()[codigo],
      (item) => item.horasDedicacion ?? 0,
    );
  }

  private sumHours<T>(
    items: T[] | undefined,
    readHours: (item: T) => number,
  ): number {
    let total = 0;
    forNext(items, (item) => {
      total += readHours(item);
    });
    return total;
  }

  private expandAll(codigos: string[]): Record<string, boolean> {
    const state: Record<string, boolean> = {};
    forNext(codigos, (codigo) => {
      state[codigo] = true;
    });
    return state;
  }

  private resolveActivityTypesForSave(): TipoActividad[] {
    const catalog = this.activityTypesResource.value();
    const modalityTypes =
      this.activitiesModalityResource.value().tipoActividades ?? [];
    const byCodigo = new Map<string, TipoActividad>();
    forNext(catalog, (type) => {
      byCodigo.set(type.codigo, type);
    });
    forNext(modalityTypes, (item, index) => {
      if (byCodigo.has(item.codigo)) {
        return;
      }
      byCodigo.set(item.codigo, {
        id: item.id,
        idPadre: null,
        nombre: item.nombre,
        descripcion: item.nombre,
        orden: String(index),
        codigo: item.codigo,
        componente: item.componente,
      });
    });
    return Array.from(byCodigo.values());
  }

  private areNoveltyActivities(): boolean {
    return this.detailResource.value()[0]?.esDeNovedad === 1;
  }

  private getDeletedDetailsIds(): number[] {
    if (!this.areNoveltyActivities()) {
      return [];
    }
    const currentIds = new Set<number>();
    this.collectCurrentDetailIds(currentIds);
    const deletedIds: number[] = [];
    forNext(
      Array.from(this.loadedDetailsById().keys()),
      (idDetalle) => {
        if (!currentIds.has(idDetalle)) {
          deletedIds.push(idDetalle);
        }
      },
    );
    return deletedIds;
  }

  private collectCurrentDetailIds(currentIds: Set<number>): void {
    forNext(Object.values(this.directByCodigo()), (activities) => {
      forNext(activities, (activity) => {
        if (activity.idDetalleCargaDocente != null) {
          currentIds.add(activity.idDetalleCargaDocente);
        }
      });
    });
    forNext(Object.values(this.criteriaByCodigo()), (activities) => {
      forNext(activities, (activity) => {
        if (activity.idDetalleCargaDocente != null) {
          currentIds.add(activity.idDetalleCargaDocente);
        }
      });
    });
    forNext(Object.values(this.projectsByCodigo()), (projects) => {
      forNext(projects, (project) => {
        if (project.idDetalleCargaDocente != null) {
          currentIds.add(project.idDetalleCargaDocente);
        }
      });
    });
  }

  private clearActivitySignals(): void {
    this.directByCodigo.set({});
    this.criteriaByCodigo.set({});
    this.projectsByCodigo.set({});
    this.loadedDetailsById.set(new Map());
  }
}
