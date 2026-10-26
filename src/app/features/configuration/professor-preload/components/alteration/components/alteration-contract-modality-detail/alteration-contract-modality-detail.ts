
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import {
  CAREER_PROFESSOR_TAB_ID,
  CAREER_PROFESSOR_TAB_LABEL,
  CoordinationContractModality,
  CoordinationItem,
  ModalityProfessor,
} from '../../../../model/coordination.model';
import { CoordinationService } from '../../../../data/coordination.service';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom, Observable, map, forkJoin, switchMap, finalize } from 'rxjs';
import {NOVELTY_APPROVED_STATE,NOVELTY_PENDING_REVIEW_STATE,NOVELTY_REJECTED_STATE,} from '../../../../model/professor-novelty-state';
import { NoveltyBudgetStore } from '../alteration-professor-novelties/novelty-budget.store';
import { forNext } from '../../../../../../../core/utils/for-next.function';
import { TabBarId, TabBarItem } from '../../../../../../../shared/ui/tab-bar/tab-bar.types';
import { formatSentenceValue } from '../../../../../../../shared/utils/normalized-text.util';
import { resolveModalityKind } from '../../../../model/professor-form.config';
import { TabBar } from '../../../../../../../shared/ui/tab-bar/tab-bar';
import { PermissionService } from '../../../../../../../core/service/permission-service';
import { AuthService } from '../../../../../../../core/service/auth-service';
import { Button } from "../../../../../../../shared/ui/button/button";
import { Icon } from "../../../../../../../shared/ui/icon/icon";
import { AppIconName } from '../../../../../../../shared/ui/icon/icons';
import { Dropdown } from "../../../../../../../shared/ui/dropdown/dropdown/dropdown";
import { Item } from "../../../../../../../shared/ui/dropdown/item/item";
import { Tooltip } from '../../../../../../../shared/ui/tooltip/tooltip';
import { AlterationProfessorNovelties } from '../alteration-professor-novelties/alteration-professor-novelties';
import { NewModal } from '../../../../../../../shared/ui/new-modal/new-modal';
import { ProfessorAddModal } from '../alteration-professor-add-modal/alteration-professor-add-modal';
import { NoveltySummary } from '../novelty-summary/novelty-summary';
import { DocumentPreview } from '../../../../../../../shared/components/form/document-preview/document-preview';
import {NoveltyGeneralHistory,} from '../novelty-general-history/novelty-general-history';

type BadgeTone = 'success' | 'brand' | 'warning' | 'error' | 'gray';

type TcoFilter = 'todos' | 'duracion' | 'estado';
type TcoDurationFilter = 'todos' | 'cuatroMeses' | 'onceMeses';
type TcoStateFilter ='todos' | 'enRevision' | 'aprobado' | 'rechazado';

interface StatusBadge {
  label: string;
  badgeClass: string;
  dotClass: string;
}

interface ModalityProfessorRow {
  rowKey: string;
  menuKey: string;
  displayName: string;
  professor: ModalityProfessor;
}

interface ModalityProfessorsEntry {
  id: number;
  professors: ModalityProfessor[];
}

interface ProfessorMenuAction {
  id: string;
  label: string;
  icon: AppIconName;
  className?: string;
  tooltip?: string;
}

interface TcoFilterSwitchItem {
  id: TcoFilter;
  label: string;
  icon: AppIconName;
}

interface TcoDurationSwitchItem {
  id: TcoDurationFilter;
  label: string;
  icon: AppIconName;
}

interface TcoStateSwitchItem {
  id: TcoStateFilter;
  label: string;
  icon: AppIconName;
}

const NN_LABEL = 'NN';
const CADO_ON_REGISTER_STATE = '0';

const BADGE_BASE =
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ' +
  'text-xs font-medium';
const DOT_BASE = 'size-1.5 rounded-full';

const BADGE_TONES: Record<BadgeTone, { badge: string; dot: string }> = {
  success: {
    badge:
      'bg-success-50 text-success-700 ' +
      'dark:bg-success-500/15 dark:text-success-400',
    dot: 'bg-success-600 dark:bg-success-400',
  },
  brand: {
    badge: 'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    dot: 'bg-brand-600 dark:bg-brand-400',
  },
  warning: {
    badge:
      'bg-warning-50 text-warning-700 ' +
      'dark:bg-warning-500/15 dark:text-warning-400',
    dot: 'bg-warning-500 dark:bg-warning-400',
  },
  error: {
    badge: 'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
    dot: 'bg-error-500 dark:bg-error-400',
  },
  gray: {
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    dot: 'bg-gray-400 dark:bg-gray-500',
  },
};
@Component({
  selector: 'app-alteration-contract-modality-detail',
  imports: [TabBar, Button, Icon, Dropdown, Item, Tooltip, AlterationProfessorNovelties, NewModal, ProfessorAddModal, NoveltySummary, DocumentPreview, NoveltyGeneralHistory],
  templateUrl: './alteration-contract-modality-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlterationContractModalityDetail {
  private readonly coordinationService = inject(CoordinationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly authService = inject(AuthService);
  private readonly budgetStore = inject(NoveltyBudgetStore, {
    optional: true,
  });
  readonly permissions = inject(PermissionService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly coordination = input.required<CoordinationItem>();
  readonly refreshKey = input(0);
  readonly isCoordinator = computed(() => {
    const roles =
      this.authService.currentUser()?.roles ?? [];

    return roles.some(
      (role) =>
        role.trim().toUpperCase() ===
        'COORDINADOR',
    );
  });

  readonly isDeleteProfessorModalOpen = signal(false);
  readonly isAddProfessorModalOpen = signal(false);
  readonly isSummaryModalOpen = signal(false);
  readonly showNoveltyPdfPreview = signal(false);
  readonly noveltyPdfLoading = signal(false);
  readonly noveltyPdfError = signal<string | null>(null);
  readonly noveltyPdfFileName = signal('Documento PDF');
  readonly noveltyPdfPreviewUrl = signal<SafeResourceUrl | null>(null);
  readonly deleteProfessorTarget = signal<ModalityProfessor | null>(null);
  readonly summaryProfessor = signal<ModalityProfessor | null>(null);
  readonly isRequestingDeleteProfessor = signal(false);
  readonly noveltyHistoryRefreshKey = signal(0);

  readonly selectedContractModalityId = signal<TabBarId | null>(null);
  readonly openMenuKey = signal<string | null>(null);
  readonly isNoveltiesModalOpen = signal(false);
  readonly noveltiesProfessor = signal<ModalityProfessor | null>(null);
  readonly tcoFilter = signal<TcoFilter>('todos');
  readonly openTcoFilterMenu = signal<TcoFilter | null>(null);
  readonly tcoFilterItems: TcoFilterSwitchItem[] = [
    {
      id: 'todos',
      label: 'Todos',
      icon: 'adjustmentsHorizontal',
    },
    {
      id: 'duracion',
      label: 'Duración',
      icon: 'calendar',
    },
    {
      id: 'estado',
      label: 'Estado',
      icon: 'orbit',
    },
  ];
  readonly tcoDurationFilter = signal<TcoDurationFilter>('todos');
  readonly tcoDurationSwitchItems: TcoDurationSwitchItem[] = [
    {
      id: 'cuatroMeses',
      label: '4 meses',
      icon: 'calendar',
    },
    {
      id: 'onceMeses',
      label: '11 meses',
      icon: 'calendar',
    },
  ];
  readonly tcoStateFilter = signal<TcoStateFilter>('todos');

  readonly tcoStateSwitchItems: TcoStateSwitchItem[] = [
    {
      id: 'enRevision',
      label: 'En revisión',
      icon: 'orbit',
    },
    {
      id: 'aprobado',
      label: 'Aprobada',
      icon: 'orbit',
    },
    {
      id: 'rechazado',
      label: 'Rechazada',
      icon: 'orbit',
    },
  ];

  readonly contractModalities = computed(
    () => this.coordination().modalidadesContratacion,
  );

  readonly sortedContractModalities = computed(() =>
    this.sortContractModalities(this.contractModalities()),
  );

  readonly careerProfessorsResource = rxResource({
    params: () => {
      const idCarga = this.coordination().idCarga;
      if (idCarga == null) {
        return undefined;
      }
      return { idCarga, refreshKey: this.refreshKey() };
    },
    stream: ({ params }) =>
      this.coordinationService.listCareerAlterationProfessors(params.idCarga),
    defaultValue: [] as ModalityProfessor[],
  });

  readonly careerProfessors = computed(() =>
    this.careerProfessorsResource.value(),
  );

  readonly modalityProfessorsResource = rxResource({
    params: () => this.resolveProfessorsParams(),
    stream: ({ params }) => this.loadProfessorsByModality(params),
    defaultValue: {} as Record<number, ModalityProfessor[]>,
  });

  readonly modalityProfessorsMap = computed(() =>
    this.modalityProfessorsResource.value(),
  );

  readonly modalityProfessors = computed<ModalityProfessor[]>(() => {
    if (this.isCareerTabSelected()) {
      return this.careerProfessors();
    }
    const selectedId = this.selectedContractModalityId();
    if (selectedId == null) {
      return [];
    }
    return this.modalityProfessorsMap()[Number(selectedId)] ?? [];
  });

  readonly filteredModalityProfessors = computed(() => {
    const professors = this.modalityProfessors();

    switch (this.tcoFilter()) {
      case 'duracion' :
        return this.filterProfessorsByTcoDuration(professors);

      case 'estado' :
        return this.filterProfessorsByTcoState(professors);
      
      default :
        return professors;
    }
 });

  readonly currentProfessorRows = computed<ModalityProfessorRow[]>(() =>
    this.buildProfessorRows(this.filteredModalityProfessors()),
  );

  readonly modalityTabs = computed<TabBarItem[]>(() => {
    const professorsByModality = this.modalityProfessorsMap();
    const tabs: TabBarItem[] = [];
    forNext(this.sortedContractModalities(), (modality) => {
      tabs.push(this.toModalityTabItem(modality, professorsByModality));
    });
    const careerCount = this.careerProfessors().length;
    if (careerCount > 0) {
      tabs.push({
        id: CAREER_PROFESSOR_TAB_ID,
        label: CAREER_PROFESSOR_TAB_LABEL,
        badge: `${careerCount}`,
      });
    }
    return tabs;
  });

  readonly hasAnyModality = computed(() => this.modalityTabs().length > 0);

  readonly isCareerTabSelected = computed(
    () => this.selectedContractModalityId() === CAREER_PROFESSOR_TAB_ID,
  );

  readonly isCargaEnAvalDesarrollo = computed(() => (this.coordination().estadoCarga === 'AVAL DESARROLLO'));

  readonly selectedContractModality = computed(() => {
    if (this.isCareerTabSelected()) {
      return null;
    }
    const selectedId = Number(this.selectedContractModalityId());
    if (!Number.isFinite(selectedId) || selectedId <= 0) {
      return null;
    }
    return (
      this.sortedContractModalities().find((item) => {
        return item.id === selectedId;
      }) ?? null
    );
  });

  readonly isTiempoCompletoOcasionalSelected = computed(() => {
    const modality = this.selectedContractModality();
    return (
      modality != null &&
      resolveModalityKind(modality.nombre) === 'tiempoCompletoOcasional'
    );
  });

  readonly isLoadingProfessors = computed(() =>
    this.modalityProfessorsResource.isLoading(),
  );

  readonly selectedModalityLabel = computed(() => {
    return (
      formatSentenceValue(this.selectedContractModality()?.nombre) ||
      'esta modalidad'
    );
  });

  readonly deleteProfessorMessage = computed(() => {
    const professor = this.deleteProfessorTarget();

    if (!professor) {
      return '¿Desea enviar a aprobación la eliminación del docente?';
    }

    const professorName = this.resolveProfessorName(professor);

    return `¿Desea enviar a aprobación la eliminación del docente "${professorName}"?`;
  });

  private noveltyPdfObjectUrl: string | null = null;
  private noveltyPdfRequestId = 0;

  constructor() {
    this.destroyRef.onDestroy(() => this.revokeNoveltyPdfObjectUrl());

    effect(() => {
      const tabs = this.modalityTabs();
      const currentId = this.selectedContractModalityId();

      if (!tabs.length) {
        this.selectedContractModalityId.set(null);
        return;
      }

      const hasCurrent = tabs.some((tab) => tab.id === currentId);
      if (!hasCurrent) {
        this.selectedContractModalityId.set(tabs[0].id);
      }
    });

    effect(() => {
      this.refreshKey();
      this.modalityProfessorsResource.reload();
    });
  }

  toggleTcoFilterMenu(filter: TcoFilter): void {
    if (filter === 'todos') {
      this.tcoFilter.set('todos');
      this.openTcoFilterMenu.set(null);
      this.tcoDurationFilter.set('todos');
      this.tcoStateFilter.set('todos');
      return;
    }

    this.openTcoFilterMenu.update((current) =>
      current === filter ? null : filter,
    );
  }

  closeTcoFilterMenu(): void {
    this.openTcoFilterMenu.set(null);
  }

  onContractModalityChange(id: TabBarId | null): void {
    this.selectedContractModalityId.set(id);
    this.tcoFilter.set('todos');
    this.tcoDurationFilter.set('todos');
    this.tcoStateFilter.set('todos');
  }

  setTcoDurationFilter(filter: TcoDurationFilter): void {
    this.tcoFilter.set('duracion');
    this.tcoDurationFilter.set(filter);
    this.openTcoFilterMenu.set(null);
    this.tcoStateFilter.set('todos');
  }

  setTcoStateFilter(filter: TcoStateFilter): void {
    this.tcoFilter.set('estado');
    this.tcoStateFilter.set(filter);
    this.openTcoFilterMenu.set(null);
    this.tcoDurationFilter.set('todos');
  }

  openAddProfessorModal(): void {
    if (!this.selectedContractModality()) {
      return;
    }

    this.isAddProfessorModalOpen.set(true);
  }

  closeAddProfessorModal(): void {
    this.isAddProfessorModalOpen.set(false);
  }

  onProfessorSaved(): void {
    this.closeAddProfessorModal();

    this.modalityProfessorsResource.reload();
    this.careerProfessorsResource.reload();

    this.reloadNoveltyHistory();

    void this.refreshBudget();
  }

  canOpenProfessorMenu(professor: ModalityProfessor): boolean {
    return this.resolveProfessorActions(professor).length > 0;
  }

  toggleProfessorMenu(menuKey: string, professor?: ModalityProfessor): void {
    if (professor && !this.canOpenProfessorMenu(professor)) return;

    this.openMenuKey.update((current) =>
      current === menuKey ? null : menuKey,
    );
  }

  closeProfessorMenu(): void {
    this.openMenuKey.set(null);
  }

  resolveProfessorActions(professor: {
    tieneDetalleActividades?: boolean;
    tieneCarga?: boolean;
    estadoNovedad?: string | number | null;
  }): ProfessorMenuAction[] {
    const hasLoad = professor.tieneCarga === true;

    if (!hasLoad || !this.isCargaEnAvalDesarrollo()) return [];

    const actions: ProfessorMenuAction[] = [];
    if (this.permissions.canListProfessorNovelty()) {
      actions.push({
        id: 'resumen',
        label: 'Ver resumen',
        icon: 'file',
      });
    }

    if (this.permissions.canDownloadProfessorNoveltyPdf()) {
      actions.push({
        id: 'reporte-novedad',
        label: 'Reporte novedad',
        icon: 'file',
      });
    }

    if (this.permissions.canSaveContractModalityProfessor()) {
      actions.push({
        id: 'novedad',
        label: 'Gestionar novedad',
        icon: 'newspaper',
      });
    }

    if (!this.isCareerTabSelected() && this.permissions.canDeleteProfessor()) {
      actions.push({
        id: 'eliminar',
        label: 'Eliminar',
        icon: 'delete',
        className: 'text-error-600 dark:text-error-400',
      });
    }

    return actions;
  }

  onProfessorMenuAction(actionId: string, professor: ModalityProfessor): void {
    this.closeProfessorMenu();

    if (actionId === 'novedad') {
      this.openNoveltiesModal(professor);
      return;
    }

    if (actionId === 'resumen') {
      this.openSummaryModal(professor);
      return;
    }

    if (actionId === 'reporte-novedad') {
      void this.openNoveltyPdfReport(professor);
      return;
    }

    if (actionId === 'eliminar') {
      this.openDeleteProfessorModal(professor);
    }
  }

  openNoveltiesModal(professor: ModalityProfessor): void {
    const modalityId = this.selectedContractModality()?.id;
    this.noveltiesProfessor.set(
      modalityId == null
        ? professor
        : { ...professor, idModalidadContratacion: modalityId },
    );
    this.isNoveltiesModalOpen.set(true);
  }

  closeNoveltiesModal(): void {
    this.isNoveltiesModalOpen.set(false);
    this.noveltiesProfessor.set(null);
  }

  openSummaryModal(professor: ModalityProfessor): void {
    this.summaryProfessor.set(professor);
    this.isSummaryModalOpen.set(true);
  }

  closeSummaryModal(): void {
    this.isSummaryModalOpen.set(false);
    this.summaryProfessor.set(null);
  }

  async openNoveltyPdfReport(
    professor: ModalityProfessor,
  ): Promise<void> {
    const idCargaDocente =
      professor.idCargaDocente;

    if (
      idCargaDocente == null ||
      !this.permissions
        .canDownloadProfessorNoveltyPdf() ||
      this.noveltyPdfLoading()
    ) {
      return;
    }

    await this.openNoveltyPdfPreview(
      this.coordinationService
        .downloadNoveltyPdfReport(
          idCargaDocente,
        ),
      `novedad-carga-docente-${idCargaDocente}.pdf`,
    );
  }

  async openHistoricalNoveltyPdfReport(
    idNovedadCargaDocente: number,
  ): Promise<void> {
    if (
      idNovedadCargaDocente == null ||
      !Number.isFinite(
        idNovedadCargaDocente,
      ) ||
      !this.permissions
        .canDownloadProfessorNoveltyPdf() ||
      this.noveltyPdfLoading()
    ) {
      return;
    }

    await this.openNoveltyPdfPreview(
      this.coordinationService
        .downloadHistoricalNoveltyPdfReport(
          idNovedadCargaDocente,
        ),
      `novedad-historica-${idNovedadCargaDocente}.pdf`,
    );
  }

  private async openNoveltyPdfPreview(
    request$: Observable<{
      blob: Blob;
      fileName: string;
    }>,
    fallbackFileName: string,
  ): Promise<void> {
    const requestId =
      ++this.noveltyPdfRequestId;

    this.revokeNoveltyPdfObjectUrl();

    this.noveltyPdfError.set(null);
    this.noveltyPdfPreviewUrl.set(null);
    this.noveltyPdfFileName.set(
      fallbackFileName,
    );

    this.noveltyPdfLoading.set(true);
    this.showNoveltyPdfPreview.set(true);

    try {
      const file = await firstValueFrom(
        request$,
      );

      if (
        requestId !==
        this.noveltyPdfRequestId
      ) {
        return;
      }

      const blob =
        file.blob.type ===
        'application/pdf'
          ? file.blob
          : new Blob(
              [file.blob],
              {
                type: 'application/pdf',
              },
            );

      const url =
        URL.createObjectURL(blob);

      this.noveltyPdfObjectUrl = url;

      this.noveltyPdfFileName.set(
        file.fileName ||
        fallbackFileName,
      );

      this.noveltyPdfPreviewUrl.set(
        this.sanitizer
          .bypassSecurityTrustResourceUrl(
            url,
          ),
      );

    } catch (error) {
      if (
        requestId !==
        this.noveltyPdfRequestId
      ) {
        return;
      }

      console.error(error);

      this.noveltyPdfError.set(
        'No fue posible cargar la previsualización del documento.',
      );

    } finally {
      if (
        requestId ===
        this.noveltyPdfRequestId
      ) {
        this.noveltyPdfLoading.set(false);
      }
    }
  }

  closeNoveltyPdfPreview(): void {
    this.noveltyPdfRequestId++;
    this.showNoveltyPdfPreview.set(false);
    this.noveltyPdfLoading.set(false);
    this.noveltyPdfError.set(null);
    this.noveltyPdfPreviewUrl.set(null);
    this.revokeNoveltyPdfObjectUrl();
  }

  downloadNoveltyPdfPreview(): void {
    if (!this.noveltyPdfObjectUrl) {
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = this.noveltyPdfObjectUrl;
    anchor.download = this.noveltyPdfFileName();
    anchor.click();
  }

  private revokeNoveltyPdfObjectUrl(): void {
    if (!this.noveltyPdfObjectUrl) {
      return;
    }

    URL.revokeObjectURL(this.noveltyPdfObjectUrl);
    this.noveltyPdfObjectUrl = null;
  }

  onNoveltyReviewChanged(): void {
    this.modalityProfessorsResource.reload();
    this.careerProfessorsResource.reload();

    this.reloadNoveltyHistory();

    void this.refreshBudget();
  }

  onNoveltySaved(): void {
    this.modalityProfessorsResource.reload();
    this.careerProfessorsResource.reload();

    this.reloadNoveltyHistory();

    this.closeNoveltiesModal();

    void this.refreshBudget();
  }

  private async refreshBudget(): Promise<void> {
    const idCarga = this.coordination().idCarga;
    if (idCarga == null || this.budgetStore == null) {
      return;
    }
    try {
      const budget = await firstValueFrom(
        this.coordinationService.getCargaBudget(idCarga),
      );
      this.budgetStore.setBudget(budget);
    } catch (error) {
      console.error(error);
    }
  }

  openDeleteProfessorModal(professor: ModalityProfessor): void {
    if (professor.idCargaDocente == null) {
      return;
    }

    this.deleteProfessorTarget.set(professor);
    this.isDeleteProfessorModalOpen.set(true);
  }

  closeDeleteProfessorModal(): void {
    if (this.isRequestingDeleteProfessor()) {
      return;
    }

    this.isDeleteProfessorModalOpen.set(false);
    this.deleteProfessorTarget.set(null);
  }
  

  professorStatusBadge(
    professor: ModalityProfessor,
  ): StatusBadge | null {
    const estadoNovedad =
      professor.estadoNovedad == null
        ? ''
        : String(professor.estadoNovedad).trim();

    switch (estadoNovedad) {
      case NOVELTY_PENDING_REVIEW_STATE:
        return this.buildStatusBadge(
          'En revisión',
          'gray',
        );

      case NOVELTY_APPROVED_STATE:
        return this.buildStatusBadge(
          'Aprobada',
          'success',
        );

      case NOVELTY_REJECTED_STATE:
      return this.buildStatusBadge(
        'Rechazada',
        'error',
      );

      default:
        return null;
    }
  }

  private filterProfessorsByTcoDuration(
    professors: ModalityProfessor[],
  ): ModalityProfessor[] {
    if (!this.isTiempoCompletoOcasionalSelected()) {
      return professors;
    }

    const filter = this.tcoDurationFilter();

    if (filter === 'todos') {
      return professors;
    }

    return professors.filter((professor) => {
      const onceMeses = String(professor.onceMeses ?? '').trim();

      if (filter === 'onceMeses') {
        return onceMeses === '1';
      }

      return onceMeses !== '1';
    });
  }

  private filterProfessorsByTcoState(
    professors: ModalityProfessor[],
  ): ModalityProfessor[] {
    if (!this.isTiempoCompletoOcasionalSelected()) {
      return professors;
    }

    const filter = this.tcoStateFilter();

    if (filter === 'todos') {
      return professors;
    }

    return professors.filter((professor) => {
      const estadoNovedad =
        professor.estadoNovedad == null
          ? ''
          : String(professor.estadoNovedad).trim();

      if (filter === 'enRevision') {
        return (
          estadoNovedad ===
          NOVELTY_PENDING_REVIEW_STATE
        );
      }

      if (filter === 'aprobado') {
        return (
          estadoNovedad ===
          NOVELTY_APPROVED_STATE
        );
      }

      return (
        estadoNovedad ===
        NOVELTY_REJECTED_STATE
      );
    });
  }

  private resolveProfessorsParams(): {
    idCarga: number;
    modalityIds: number[];
    refreshKey: number;
  } | undefined {
    const modalities = this.sortedContractModalities();
    const idCarga = this.coordination().idCarga;
    if (!modalities.length || idCarga == null) {
      return undefined;
    }

    const modalityIds: number[] = [];
    forNext(modalities, (modality) => {
      modalityIds.push(modality.id);
    });

    return {
      idCarga,
      modalityIds,
      refreshKey: this.refreshKey(),
    };
  }

  private loadProfessorsByModality(params: {
    idCarga: number;
    modalityIds: number[];
  }): Observable<Record<number, ModalityProfessor[]>> {
    const requests: Observable<ModalityProfessorsEntry>[] = [];
    forNext(params.modalityIds, (id) => {
      requests.push(
        this.coordinationService
          .listAlterationProfessorsByModality(params.idCarga, id)
          .pipe(map((professors) => ({ id, professors }))),
      );
    });

    return forkJoin(requests).pipe(
      map((entries) => this.toModalityProfessorsMap(entries)),
    );
  }

  private buildProfessorRows(
    professors: ModalityProfessor[],
  ): ModalityProfessorRow[] {
    const rows: ModalityProfessorRow[] = [];

    forNext(professors, (professor, index) => {
      const rowId =
        professor.idCargaDocente || professor.idPersonaGeneral || index;
      rows.push({
        rowKey: `professor-${rowId}`,
        menuKey: `professor-${rowId}`,
        displayName: this.resolveProfessorName(professor),
        professor,
      });
    });

    return rows;
  }

  private sortContractModalities(
    modalities: CoordinationContractModality[],
  ): CoordinationContractModality[] {
    return [...modalities].sort(
      (left, right) =>
        this.resolveModalitySortOrder(left) -
        this.resolveModalitySortOrder(right),
    );
  }

  private resolveModalitySortOrder(
    modality: CoordinationContractModality,
  ): number {
    const kind = resolveModalityKind(modality.nombre);
    if (kind === 'tiempoCompletoOcasional') {
      return 0;
    }
    if (kind === 'catedra') {
      return 1;
    }

    return 3;
  }

  private toModalityTabItem(
    modality: CoordinationContractModality,
    professorsByModality: Record<number, ModalityProfessor[]>,
  ): TabBarItem {
    const professors = professorsByModality[modality.id] ?? [];
    const verified = professors.filter(
      (professor) =>
        professor.estado !== CADO_ON_REGISTER_STATE,
    ).length;

    return {
      id: modality.id,
      label: modality.nombre,
      badge: `${verified}/${professors.length}`,
    };
  }

  private toModalityProfessorsMap(
    entries: ModalityProfessorsEntry[],
  ): Record<number, ModalityProfessor[]> {
    const result: Record<number, ModalityProfessor[]> = {};
    forNext(entries, (entry) => {
      const professors: ModalityProfessor[] = [];
      forNext(entry.professors, (professor) => {
        professors.push({
          ...professor,
          idModalidadContratacion: entry.id,
        });
      });
      result[entry.id] = professors;
    });
    return result;
  }

  private resolveProfessorName(professor: ModalityProfessor): string {
    if (professor.idPersonaGeneral == null) {
      return NN_LABEL;
    }
    return professor.nombreCompleto?.trim() || NN_LABEL;
  }

  private buildStatusBadge(label: string, tone: BadgeTone): StatusBadge {
    const palette = BADGE_TONES[tone];
    return {
      label,
      badgeClass: `${BADGE_BASE} ${palette.badge}`,
      dotClass: `${DOT_BASE} ${palette.dot}`,
    };
  }

  private reloadNoveltyHistory(): void {
    this.noveltyHistoryRefreshKey.update(
      (value) => value + 1,
    );
  }

  confirmDeleteProfessor(): void {
    if (this.isRequestingDeleteProfessor()) {
      return;
    }

    const professor = this.deleteProfessorTarget();
    const idCargaDocente = professor?.idCargaDocente;
    const idModalidadContratacion = this.isCareerTabSelected()
      ? null
      : professor?.idModalidadContratacion;

    if (idCargaDocente == null) {
      return;
    }

    if (!this.isCareerTabSelected() && idModalidadContratacion == null) {
      return;
    }

    this.isRequestingDeleteProfessor.set(true);

      this.coordinationService.getDeleteNovelties(idModalidadContratacion)
      .pipe(
        map((novelties) =>
          novelties.find(
            (novelty) => novelty.componente === 'delete-professor',
          ),
        ),
        switchMap((novelty) => {
          if (!novelty) {
            throw new Error(
              'No se encontró la novedad configurada para eliminar docente.',
            );
          }

          return this.coordinationService.requestDeleteProfessor({
            idCargaDocente,
            idNovedad: novelty.id,
          });
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() =>
          this.isRequestingDeleteProfessor.set(false)
        ),
      )
      .subscribe({
        next: () => {
          this.isDeleteProfessorModalOpen.set(false);
          this.deleteProfessorTarget.set(null);
          this.modalityProfessorsResource.reload();
          this.careerProfessorsResource.reload();
          this.reloadNoveltyHistory();
          void this.refreshBudget();
        },
      });
  }

  isRejectedNovelty(
    professor: ModalityProfessor,
  ): boolean {
    const estadoNovedad =
      professor.estadoNovedad == null
        ? ''
        : String(professor.estadoNovedad).trim();

    return estadoNovedad === NOVELTY_REJECTED_STATE;
  }

  rejectionReasonTooltip(
    professor: ModalityProfessor,
  ): string {
    if (!this.isRejectedNovelty(professor)) {
      return '';
    }

    const motivo = professor.motivoRechazo?.trim();
    return motivo
      ? `Motivo del rechazo: ${motivo}`
      : '';
  }


}
