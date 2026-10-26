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
import { Icon } from '../../../../../../../../../shared/ui/icon/icon';
import { CollapsibleSection } from '../../../../../../../../../shared/components/form/collapsible-section/collapsible-section';

import { CoordinationService } from '../../../../../../data/coordination.service';

import {
  ContractModalityItem,
  CoordinationItem,
  ModalityProfessor,
  WorkDate,
} from '../../../../../../model/coordination.model';
import {
  buildComponenteByCodigo,
  buildVisibleActivityItems,
  createInitialAddFormOpen,
  resolveInitialExpandedCategories,
} from '../../../../../../model/professor-activities.config';
import {
  DirectLearningActivity,
  SimpleActivity,
} from '../../../../../../model/professor-activities-modal.models';
import {
  ActividadModalidadDTO,
  ActivityFormType,
  TipoActividad,
} from '../../../../../../model/professor-activities.model';
import {
  mapDetailProfessorPreloadToModalState,
  toNoveltyActivityDraft,
} from '../../../../../../model/professor-activities-load.mapper';
import { DetailProfessorPreloadApi } from '../../../../../../model/detail-professor-preload.model';
import { buildProjectHierarchyRows } from '../../../../../../model/professor-projects.mapper';
import {
  ProfessorProjectRow,
  ProyectoDocenteDto,
} from '../../../../../../model/professor-projects.model';

import { forNext } from '../../../../../../../../../core/utils/for-next.function';
import { parseMaxWeeklyHours } from '../../../../../../model/professor-form.config';
import { SaveDetailProfessorPreloadInput } from '../../../../../../model/professor-activities-save.mapper';
import { PreloadCallService } from '../../../../../../../preload-call/data/preload-call.service';
import { PreloadCallDetailFecha } from '../../../../../../../preload-call/model/preload-call.model';
import { CriteriaActivityCard } from '../../../../../professor-activities-modal/components/criteria-activity-card/criteria-activity-card';
import { DirectActivityCard } from '../../../../../professor-activities-modal/components/direct-activity-card/direct-activity-card';
import { ProjectActivityCard } from '../../../../../professor-activities-modal/components/project-activity-card/project-activity-card';

const EMPTY_MODALITY_ACTIVITIES: ActividadModalidadDTO = {
  idModalidadContratacion: 0,
  tipoActividades: [],
};

@Component({
  selector: 'app-change-contract-modality-activities',
  imports: [
    Icon,
    CollapsibleSection,
    DirectActivityCard,
    CriteriaActivityCard,
    ProjectActivityCard,
  ],
  templateUrl: './change-contract-modality-activities.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeContractModalityActivities {
  private readonly coordinationService = inject(CoordinationService);
  private readonly preloadCallService = inject(PreloadCallService);

  readonly professor = input<ModalityProfessor | null>(null);
  readonly coordination = input<CoordinationItem | null>(null);
  readonly contractModality = input<ContractModalityItem | null>(null);
  readonly selectedWorkDate = input<WorkDate | null>(null);

  readonly directByCodigo = signal<
    Record<string, DirectLearningActivity[]>
  >({});
  readonly criteriaByCodigo = signal<Record<string, SimpleActivity[]>>({});
  readonly projectsByCodigo = signal<
    Record<string, ProfessorProjectRow[]>
  >({});
  readonly expandedCategories = signal<Record<string, boolean>>({});
  readonly addFormOpen = signal<Record<string, boolean>>({});
  readonly hasSavedDetail = signal(false);
  private readonly expandedInitialized = signal(false);

  readonly activityTypesResource = rxResource({
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
      this.coordinationService
        .listActivitiesModality(params.idModalidadContratacion)
        .pipe(catchError(() => of(EMPTY_MODALITY_ACTIVITIES))),
    defaultValue: EMPTY_MODALITY_ACTIVITIES,
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
        .listDetailProfessorPreload(params.idCargaDocente)
        .pipe(catchError(() => of([] as DetailProfessorPreloadApi))),
    defaultValue: [] as DetailProfessorPreloadApi,
  });

  readonly professorProjectsResource = rxResource({
    params: () => {
      const idPersonaGeneral = this.professor()?.idPersonaGeneral;
      const idConvocatoria = this.coordination()?.idConvocatoria;
      if (idPersonaGeneral == null || idConvocatoria == null) {
        return undefined;
      }
      return { idPersonaGeneral, idConvocatoria };
    },
    stream: ({ params }) =>
      this.coordinationService.listProjectsProfessor(
        params.idPersonaGeneral,
        params.idConvocatoria,
      ),
    defaultValue: [] as ProyectoDocenteDto[],
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

  readonly preloadCallDetailResource = rxResource({
    params: () => {
      const idConvocatoria = this.coordination()?.idConvocatoria;
      if (idConvocatoria == null) {
        return undefined;
      }
      return { idConvocatoria };
    },
    stream: ({ params }) =>
      this.preloadCallService.getPreloadCallDetails(params.idConvocatoria),
  });

  readonly isLoading = computed(
    () =>
      this.detailResource.isLoading() ||
      this.activitiesModalityResource.isLoading(),
  );

  readonly visibleActivityItems = computed(() =>
    buildVisibleActivityItems(
      this.activitiesModalityResource.value().tipoActividades ?? [],
      this.activityTypesResource.value(),
    ),
  );

  readonly directActivityContext = computed(() => {
    const coordination = this.coordination();
    const modalityId = this.contractModality()?.id;
    if (
      !coordination?.id ||
      coordination.idNivelEducativo == null ||
      coordination.idPeriodoUniversidad == null ||
      modalityId == null
    ) {
      return null;
    }
    return {
      idCoordinacion: coordination.id,
      idNivelEducativo: coordination.idNivelEducativo,
      idPeriodoUniversidad: coordination.idPeriodoUniversidad,
      idModalidadContratacion: modalityId,
      idCargaDocente: null,
    };
  });

  readonly allDirectActivities = computed(() => {
    const rows: DirectLearningActivity[] = [];
    const byCodigo = this.directByCodigo();
    forNext(Object.keys(byCodigo), (codigo) => {
      forNext(byCodigo[codigo], (activity) => rows.push(activity));
    });
    return rows;
  });

  readonly projectHierarchyRowsByCodigo = computed(() => {
    const result: Record<string, ProfessorProjectRow[]> = {};
    const proyectos = this.professorProjectsResource.value();
    const idPersona = this.professor()?.idPersonaGeneral;
    forNext(this.visibleActivityItems(), (item) => {
      if (item.formType !== 'project') {
        return;
      }
      result[item.codigo] = buildProjectHierarchyRows(
        proyectos,
        item.codigo,
        idPersona,
      );
    });
    return result;
  });

  readonly categoryHours = computed(() => {
    const hours: Record<string, number> = {};
    forNext(this.visibleActivityItems(), (item) => {
      hours[item.codigo] = this.hoursForItem(item.formType, item.codigo);
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

  readonly weeklyHoursLimit = computed(() => {
    const exception = String(
      this.professor()?.horasDeExcepcion ?? '',
    ).trim();
    if (exception) {
      return parseMaxWeeklyHours(exception);
    }
    const selected = this.selectedWorkDate();
    if (selected) {
      return parseMaxWeeklyHours(selected.rangoHoras);
    }
    return parseMaxWeeklyHours(
      this.workDatesResource.value()[0]?.rangoHoras,
    );
  });

  constructor() {
    effect(() => {
      this.contractModality()?.id;
      this.professor()?.idCargaDocente;
      untracked(() => this.expandedInitialized.set(false));
    });

    effect(() => {
      if (this.isLoading()) {
        untracked(() => this.clearActivitySignals());
        return;
      }
      const detail = this.detailResource.value();
      const componenteByCodigo = buildComponenteByCodigo(
        this.activitiesModalityResource.value().tipoActividades ?? [],
      );
      untracked(() => this.applyLoadedDetail(detail, componenteByCodigo));
    });

    effect(() => {
      if (this.isLoading() || this.expandedInitialized()) {
        return;
      }
      const items = this.visibleActivityItems();
      const hasProject = items.some((item) => item.formType === 'project');
      if (hasProject && this.professorProjectsResource.isLoading()) {
        return;
      }
      const codigos = items.map((item) => item.codigo);
      untracked(() => {
        this.expandedCategories.set(
          resolveInitialExpandedCategories(
            codigos,
            this.projectHierarchyRowsByCodigo(),
          ),
        );
        this.addFormOpen.set(createInitialAddFormOpen(codigos));
        this.expandedInitialized.set(true);
      });
    });
  }

  hoursLabel(hours: number): string {
    return `${hours ?? 0}h`;
  }

  activitySnapshot(): SaveDetailProfessorPreloadInput | null {
    if (this.isLoading()) {
      return null;
    }

    return {
      idCargaDocente: this.professor()?.idCargaDocente ?? 0,
      idCentroCosto: this.coordination()?.centroCosto?.id ?? null,
      centroCostoDescripcion:
        this.coordination()?.centroCosto?.descripcion ?? null,
      activityTypes: this.activityTypesResource.value(),
      directByCodigo: this.directByCodigo(),
      criteriaByCodigo: this.criteriaByCodigo(),
      projectsByCodigo: this.projectsByCodigo(),
    };
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

  criteriaActivitiesForCodigo(codigo: string): SimpleActivity[] {
    return this.criteriaByCodigo()[codigo] ?? [];
  }

  setCriteriaActivitiesForCodigo(
    codigo: string,
    activities: SimpleActivity[],
  ): void {
    this.criteriaByCodigo.update((current) => ({
      ...current,
      [codigo]: activities,
    }));
  }

  projectHierarchyRowsForCodigo(codigo: string): ProfessorProjectRow[] {
    return this.projectHierarchyRowsByCodigo()[codigo] ?? [];
  }

  associatedProjectsForCodigo(codigo: string): ProfessorProjectRow[] {
    return this.projectsByCodigo()[codigo] ?? [];
  }

  setAssociatedProjectsForCodigo(
    codigo: string,
    rows: ProfessorProjectRow[],
  ): void {
    this.projectsByCodigo.update((current) => ({
      ...current,
      [codigo]: rows,
    }));
  }

  isProjectAssociationExpired(codigo: string): boolean {
    const fechaFin = this.projectFechaFin(codigo);
    return fechaFin != null && fechaFin < this.todayLocalDate();
  }

  projectAssociationExpiredReason(codigo: string): string | null {
    const fechaFin = this.projectFechaFin(codigo);
    if (fechaFin == null || !this.isProjectAssociationExpired(codigo)) {
      return null;
    }
    const label = codigo.trim().toUpperCase() === 'ISU' ? 'ISU' : 'CTeI';
    return `La fecha límite para asociar proyectos ${label} expiró el ${this.formatDate(fechaFin)}.`;
  }

  private hoursForItem(formType: ActivityFormType, codigo: string): number {
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

  private applyLoadedDetail(
    detail: DetailProfessorPreloadApi,
    componenteByCodigo: Record<string, ActivityFormType>,
  ): void {
    const state = mapDetailProfessorPreloadToModalState(
      detail,
      componenteByCodigo,
    );
    const draft = toNoveltyActivityDraft(
      state,
      Object.keys(componenteByCodigo),
    );
    this.directByCodigo.set(draft.directByCodigo);
    this.criteriaByCodigo.set(draft.criteriaByCodigo);
    this.projectsByCodigo.set(draft.projectsByCodigo);
    this.hasSavedDetail.set(draft.hasSavedDetail);
  }

  private clearActivitySignals(): void {
    this.directByCodigo.set({});
    this.criteriaByCodigo.set({});
    this.projectsByCodigo.set({});
  }

  private projectFechaFin(codigo: string): string | null {
    const normalized = codigo.trim().toUpperCase();
    if (normalized !== 'CTEI' && normalized !== 'ISU') {
      return null;
    }
    const fechas = this.preloadCallDetailResource.value()?.fechas ?? [];
    const match = fechas.find((fecha: PreloadCallDetailFecha) => {
      return String(fecha.codigo).trim().toUpperCase() === normalized;
    });
    return match?.fechaFin?.trim().substring(0, 10) ?? null;
  }

  private todayLocalDate(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');
    return `${day}/${month}/${year}`;
  }
}
