import { ChangeDetectionStrategy, Component, computed, effect, inject, input, output, signal, untracked } from '@angular/core';
import { Icon } from '../../../../../../../../shared/ui/icon/icon';
import { CollapsibleSection } from '../../../../../../../../shared/components/form/collapsible-section/collapsible-section';
import { AlterationProjectActivityCard } from './components/alteration-project-activity-card';
import { DetailProfessorPreloadApi, DetailProfessorPreloadItemApi } from '../../../../../model/detail-professor-preload.model';
import { CoordinationService } from '../../../../../data/coordination.service';
import { PreloadCallService } from '../../../../../../preload-call/data/preload-call.service';
import { CoordinationContractModality, CoordinationItem, ModalityProfessor, WorkDate } from '../../../../../model/coordination.model';
import { ProfessorProjectRow, ProyectoDocenteDto } from '../../../../../model/professor-projects.model';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActividadModalidadDTO, ActivityFormType, TipoActividad } from '../../../../../model/professor-activities.model';
import { catchError, of } from 'rxjs';
import { PreloadCallDetailFecha } from '../../../../../../preload-call/model/preload-call.model';
import { buildCareerActivityItems, buildComponenteByCodigo, buildVisibleActivityItems, createInitialAddFormOpen, resolveInitialExpandedCategories } from '../../../../../model/professor-activities.config';
import { buildProjectHierarchyRows } from '../../../../../model/professor-projects.mapper';
import { DirectLearningActivity, SimpleActivity } from '../../../../../model/professor-activities-modal.models';
import { CAREER_PROFESSOR_MAX_ACTIVITY_HOURS } from '../../../../../model/career-professor.config';
import { parseMaxWeeklyHours } from '../../../../../model/professor-form.config';
import { mapDetailProfessorPreloadToModalState } from '../../../../../model/professor-activities-load.mapper';
import { SaveDetailProfessorPreloadInput } from '../../../../../model/professor-activities-save.mapper';
import { buildNoveltyActivityDistributionRequest, hasNoveltyChanges } from '../../../../../model/professor-activities-novelty-save.mapper';
import { NoveltyComponentState } from '../novelty-component-state';
import { AlterationCriteriaActivityCard } from './components/alteration-criteria-activity-card';

const NN_LABEL = 'NN';

@Component({
  selector: 'app-change-project-activities',
  imports: [Icon, CollapsibleSection, AlterationProjectActivityCard, AlterationCriteriaActivityCard],
  templateUrl: './change-project-activities.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeProjectActivities {
  private readonly coordinationService = inject(CoordinationService);
  private readonly preloadCallService = inject(PreloadCallService);
  private readonly noveltyState = inject(NoveltyComponentState);

  professor = input<ModalityProfessor | null>(null);
  contractModality = input<CoordinationContractModality | null>(null);
  coordination = input<CoordinationItem | null>(null);

  close = output<void>();
  saved = output<void>();

  readonly isSaving = signal(false);
  readonly hasSavedDetail = signal(false);

  readonly directByCodigo = signal<Record<string, DirectLearningActivity[]>>({});
  readonly criteriaByCodigo = signal<Record<string, SimpleActivity[]>>({});
  readonly projectsByCodigo = signal<Record<string, ProfessorProjectRow[]>>({});
  private readonly expandedCategoriesInitialized = signal(false);

  private readonly loadedDetailsById = signal<Map<number, DetailProfessorPreloadItemApi>>(new Map());

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

  readonly professorProjectsResource = rxResource({
    params: () => {
      const idPersonaGeneral = this.professor()?.idPersonaGeneral;
      const idConvocatoria = this.coordination()?.idConvocatoria;

      if (
        idPersonaGeneral == null ||
        idConvocatoria == null
      ) {
        return undefined;
      }

      return {
        idPersonaGeneral,
        idConvocatoria,
      };
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

  readonly expandedCategories = signal<Record<string, boolean>>({});
  readonly addFormOpen = signal<Record<string, boolean>>({});

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

  readonly visibleNoveltyItems = computed(() =>
      this.visibleActivityItems().filter(
          (item) => item.formType === 'project' || item.formType === 'criteria',
      ),
  );

  readonly canViewActivities = computed(() => this.visibleNoveltyItems().length > 0);

  readonly coordinationDates = computed(() => {
    const fechas = this.preloadCallDetailResource.value()?.fechas ?? [];

    return fechas.find((fecha) =>
          String(fecha.codigo).trim().toUpperCase() === 'CNV',
    ) ?? null;
  })

  readonly readOnly = computed(() => {
    const fechaFin = this.dateOnly(this.coordinationDates()?.fechaFin);

    if (fechaFin == null) {
      return false;
    }

    return fechaFin < this.todayLocalDate();
  });
  readonly activityCardsReadOnlyReason = computed(() => {
    if (!this.readOnly()) {
      return '';
    }

    const fechaFin = this.dateOnly(this.coordinationDates()?.fechaFin);

    if (fechaFin == null) {
      return 'La coordinación no está habilitada para edición en esta convocatoria.';
    }

    return `La fecha límite para modificar actividades expiró el ${this.formatDate(fechaFin)}.`;
  });
  readonly isActivityCardsReadOnly = computed(() => this.readOnly());

  readonly projectAssociationDates = computed(() => {
    const fechas = this.preloadCallDetailResource.value()?.fechas ?? [];

    const findByCode = (codigo: 'CTEI' | 'ISU') =>
      fechas.find(
        (fecha) =>
          String(fecha.codigo).trim().toUpperCase() === codigo,
      ) ?? null;

    return {
      CTEI: findByCode('CTEI'),
      ISU: findByCode('ISU'),
    } satisfies Record<
      'CTEI' | 'ISU',
      PreloadCallDetailFecha | null
    >;
  });

  readonly projectHierarchyRowsByCodigo = computed(() => {
    const proyectos = this.professorProjectsResource.value();
    const idPersonaGeneral = this.professor()?.idPersonaGeneral;
    const items = this.visibleNoveltyItems();
    const result: Record<string, ProfessorProjectRow[]> = {};

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (item.formType !== 'project') {
        continue;
      }
      result[item.codigo] = buildProjectHierarchyRows(
        proyectos,
        item.codigo,
        idPersonaGeneral,
      );
    }

    return result;
  });

  readonly professorDisplayName = computed(() =>
    this.resolveProfessorName(this.professor()),
  );

  readonly modalTitle = computed(() => {
    return this.hasSavedDetail()
      ? 'Gestionar actividades del docente'
      : 'Agregar actividades del docente';
  });

  readonly contractModalityLabel = computed(
    () => this.contractModality()?.nombre?.trim() || '-',
  );

  readonly coordinationLabel = computed(() => {
    const item = this.coordination();
    if (!item) {
      return '-';
    }
    return item.descripcion?.trim() || item.nombre?.trim() || '-';
  });

  readonly periodLabel = computed(
    () => this.coordination()?.periodoUniversidad?.trim() || '',
  );

  readonly categoryHours = computed((): Record<string, number> => {
    const hours: Record<string, number> = {};
    const items = this.visibleActivityItems();

    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      if (item.formType === 'direct') {
        hours[item.codigo] = this.sumDirectHours(
          this.directByCodigo()[item.codigo] ?? [],
        );
        continue;
      }
      if (item.formType === 'criteria') {
        hours[item.codigo] = this.sumSimpleHours(
          this.criteriaByCodigo()[item.codigo] ?? [],
        );
        continue;
      }
      hours[item.codigo] = this.sumProjectHours(
        this.projectsByCodigo()[item.codigo] ?? [],
      );
    }

    return hours;
  });

  readonly totalAssignedHours = computed(() =>
    Object.values(this.categoryHours()).reduce(
      (total, value) => total + value,
      0,
    ),
  );

  readonly professorWorkDate = computed(() => {
    const idFechasConvocatoria = this.professor()?.idFechasConvocatoria;
    if (idFechasConvocatoria == null) {
      return null;
    }

    return (
      this.workDatesResource
        .value()
        .find((item) => item.id === idFechasConvocatoria) ?? null
    );
  });

  readonly weeklyHoursLabel = computed(() => {
    const horasDeExcepcion = String(
      this.professor()?.horasDeExcepcion ?? '',
    ).trim();

    if (horasDeExcepcion) {
      return horasDeExcepcion;
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

  readonly inWeeklyLimit = computed(() => {
    const limit = this.weeklyHoursLimit();
    if (this.contractModality() == null) {
      return limit == null || this.totalAssignedHours() <= limit;
    }
    if (limit == null) {
      return false;
    }

    return this.totalAssignedHours() === limit;
  });

  // Determina si hay proyectos huerfanos por estado no activo o cambio de docente
  readonly invalidAssociatedProjects = computed(() => {
    const invalid: ProfessorProjectRow[] = [];

    const hierarchyByCodigo = this.projectHierarchyRowsByCodigo();
    const associatedByCodigo = this.projectsByCodigo();

    for (const codigo of Object.keys(associatedByCodigo)) {
      const associatedRows = associatedByCodigo[codigo] ?? [];
      const hierarchyRows = hierarchyByCodigo[codigo] ?? [];

      const hierarchyIds = new Set(hierarchyRows.map((row) => row.idPersonaProyecto));

      for (const row of associatedRows) {
        if (!hierarchyIds.has(row.idPersonaProyecto)) {
          invalid.push(row);
        }
      }
    }

    return invalid;
  });

  private readonly distribution = computed(() => {
    const input = this.buildSaveInput();
    const loadedDetails = this.loadedDetailsById()
    const distribution = buildNoveltyActivityDistributionRequest(input, loadedDetails);
    
    return {
      ...distribution,
      deleteIds: this.getDeletedDetailsIds(),
      hasChanges: hasNoveltyChanges(input, loadedDetails)
    };
  })


  constructor() {
    effect(() => {
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
      untracked(() => this.applyLoadedDetail(detail, componenteByCodigo));
    });

    effect(() => {
      if (this.isLoadingActivityCategories()) {
        return;
      }

      const items = this.visibleNoveltyItems();
      const hasProject = items.some((item) => item.formType === 'project');
      if (hasProject && this.professorProjectsResource.isLoading()) {
        return;
      }

      if (this.expandedCategoriesInitialized()) {
        return;
      }

      const codigos = items.map((item) => item.codigo);
      const rows = this.projectHierarchyRowsByCodigo();
      untracked(() => {
        this.expandedCategories.set(
          resolveInitialExpandedCategories(codigos, rows),
        );
        this.addFormOpen.set(createInitialAddFormOpen(codigos));
        this.expandedCategoriesInitialized.set(true);
      });
    });

    effect(() => {
      const { saveRequest, updateRequests, deleteIds, hasChanges } = this.distribution();
      const tieneProyectosInvalidos = this.invalidAssociatedProjects().length > 0;
      // Comprueba si ha hecho un cambio real y no si tiene valores dentro del save o update
      // Esto evita que la primera vez cuando vienen de los detalles originales, el boton aparezca habilitado sin realizar cambios
      const noveltyHasChanges = hasChanges || deleteIds.length > 0;
      

      if (!this.inWeeklyLimit() || !noveltyHasChanges || tieneProyectosInvalidos) {
        untracked(() => this.noveltyState.clear());
        return;
      }

      if (this.visibleNoveltyItems().length === 0) {
        untracked(() => this.noveltyState.clear());
        return;
      }

      untracked(() =>
        this.noveltyState.setChangeProjectActivities(
          saveRequest,
          updateRequests,
          deleteIds
        ),
      );
    })
  }

  onCategoryExpandedChange(codigo: string, expanded: boolean): void {
    this.expandedCategories.update((current) => ({
      ...current,
      [codigo]: expanded,
    }));
  }

  isCategoryExpanded(codigo: string): boolean {
    return this.expandedCategories()[codigo] === true;
  }

  isAddFormOpen(codigo: string): boolean {
    return this.addFormOpen()[codigo] === true;
  }

  onAddFormOpenChange(codigo: string, isFormOpen: boolean): void {
    if (this.isActivityCardsReadOnly() && isFormOpen) {
      return;
    }

    this.addFormOpen.update((current) => ({
      ...current,
      [codigo]: isFormOpen,
    }));
  }

  hoursLabel(hours: number): string {
    return `${hours ?? 0}h`;
  }

  criteriaActivitiesForCodigo(codigo: string): SimpleActivity[] {
    return this.criteriaByCodigo()[codigo] ?? [];
  }

  setCriteriaActivitiesForCodigo(
    codigo: string,
    activities: SimpleActivity[],
  ): void {
    if (this.isActivityCardsReadOnly()) {
      return;
    }

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

  areNoveltyActivities(): boolean {
    return this.detailResource.value().some(detail => detail.esDeNovedad === 1);
  }

  isProjectAssociationExpired(codigo: string): boolean {
    const projectCode = this.resolveProjectActivityCode(codigo);

    if (projectCode == null) {
      return false;
    }

    const fechaFin = this.dateOnly(
      this.projectAssociationDates()[projectCode]?.fechaFin,
    );

    if (fechaFin == null) {
      return false;
    }

    return fechaFin < this.todayLocalDate();
  }

  projectAssociationExpiredReason(codigo: string): string | null {
    const projectCode = this.resolveProjectActivityCode(codigo);

    if (
      projectCode == null ||
      !this.isProjectAssociationExpired(projectCode)
    ) {
      return null;
    }

    const fechaFin = this.dateOnly(
      this.projectAssociationDates()[projectCode]?.fechaFin,
    );

    if (fechaFin == null) {
      return null;
    }

    const label = projectCode === 'CTEI' ? 'CTeI' : 'ISU';

    return `La fecha límite para asociar proyectos ${label} expiró el ${this.formatDate(fechaFin)}.`;
  }

  private buildSaveInput(): SaveDetailProfessorPreloadInput {
    const coordination = this.coordination();

    return {
      idCargaDocente: this.professor()?.idCargaDocente ?? 0,
      idCentroCosto: coordination?.centroCosto?.id ?? null,
      centroCostoDescripcion: coordination?.centroCosto?.descripcion ?? null,
      activityTypes: this.resolveActivityTypesForSave(),
      directByCodigo: this.directByCodigo(),
      criteriaByCodigo: this.criteriaByCodigo(),
      projectsByCodigo: this.projectsByCodigo(),
    };
  }

  private applyLoadedDetail(
    detail: DetailProfessorPreloadApi,
    componenteByCodigo: Record<string, ActivityFormType>,
  ): void {
    const state = mapDetailProfessorPreloadToModalState(
      detail,
      componenteByCodigo,
    );

    const loadedDetails = new Map<number, DetailProfessorPreloadItemApi>();
    for (let index = 0; index < detail.length; index += 1) {
      const item = detail[index];
      loadedDetails.set(item.idDetalleCargaDocente, structuredClone(item));
    }
    
    this.loadedDetailsById.set(loadedDetails);
    this.directByCodigo.set(state.directByCodigo);
    this.criteriaByCodigo.set(state.criteriaByCodigo);
    this.projectsByCodigo.set(state.projectsByCodigo);
    this.hasSavedDetail.set(state.hasSavedDetail);
  }

  private resolveProfessorName(
    professor: ModalityProfessor | null,
  ): string {
    if (!professor || professor.idPersonaGeneral == null) {
      return NN_LABEL;
    }
    return professor.nombreCompleto?.trim() || NN_LABEL;
  }

  private sumDirectHours(items: DirectLearningActivity[]): number {
    return items.reduce(
      (total, item) => total + item.horasPresenciales,
      0,
    );
  }

  private sumSimpleHours(items: SimpleActivity[]): number {
    return items.reduce(
      (total, item) => total + item.horasDedicacion,
      0,
    );
  }

  private sumProjectHours(rows: ProfessorProjectRow[]): number {
    return rows.reduce(
      (total, row) => total + (row.horasDedicacion ?? 0),
      0,
    );
  }

  private resolveProjectActivityCode(
    codigo: string,
  ): 'CTEI' | 'ISU' | null {
    const normalized = codigo.trim().toUpperCase();

    return normalized === 'CTEI' || normalized === 'ISU'
      ? normalized
      : null;
  }

  private dateOnly(
    value: string | null | undefined,
  ): string | null {
    const normalized = value?.trim();

    if (!normalized) {
      return null;
    }

    const match = normalized.match(/^(\d{4}-\d{2}-\d{2})/);

    return match?.[1] ?? null;
  }

  private todayLocalDate(): string {
    const today = new Date();

    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatDate(value: string): string {
    const [year, month, day] = value.split('-');

    return `${day}/${month}/${year}`;
  }

  private clearActivitySignals(): void {
    this.directByCodigo.set({});
    this.criteriaByCodigo.set({});
    this.projectsByCodigo.set({});
  }

  private resolveActivityTypesForSave(): TipoActividad[] {
    const catalog = this.activityTypesResource.value();
    const modalityTypes = this.activitiesModalityResource.value().tipoActividades ?? [];
    const byCodigo = new Map<string, TipoActividad>();

    for (let index = 0; index < catalog.length; index += 1) {
      const type = catalog[index];
      byCodigo.set(type.codigo, type);
    }

    for (let index = 0; index < modalityTypes.length; index += 1) {
      const item = modalityTypes[index];
      if (byCodigo.has(item.codigo)) {
        continue;
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
    }

    return Array.from(byCodigo.values());
  }

  // Comprueba en general (No solo proyectos) que IDs se eliminan, util para las siguientes novedades en las actividades
  private getDeletedDetailsIds(): number[] {
    if (!this.areNoveltyActivities()) {
      return [];
    }

    const currentDetailIds = new Set<number>();

    for (const activities of Object.values(this.directByCodigo())) {
      for (const activity of activities) {
        if (activity.idDetalleCargaDocente != null) {
          currentDetailIds.add(activity.idDetalleCargaDocente);
        }
      }
    }
    for (const activities of Object.values(this.criteriaByCodigo())) {
      for (const activity of activities) {
        if (activity.idDetalleCargaDocente != null) {
          currentDetailIds.add(activity.idDetalleCargaDocente);
        }
      }
    }
    for (const projects of Object.values(this.projectsByCodigo())) {
      for (const project of projects) {
        if (project.idDetalleCargaDocente != null) {
          currentDetailIds.add(project.idDetalleCargaDocente);
        }
      }
    }

    const deletedIds: number[] = [];

    for (const idDetalle of this.loadedDetailsById().keys()) {
      if (!currentDetailIds.has(idDetalle)) {
        deletedIds.push(idDetalle);
      }
    }

    return deletedIds;
  }
}
