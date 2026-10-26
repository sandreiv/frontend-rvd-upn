import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';
import { Button } from '../../../../../shared/ui/button/button';
import { Dropdown } from '../../../../../shared/ui/dropdown/dropdown/dropdown';
import { Item } from '../../../../../shared/ui/dropdown/item/item';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { AppIconName } from '../../../../../shared/ui/icon/icons';
import { TabBar } from '../../../../../shared/ui/tab-bar/tab-bar';
import { Tooltip } from '../../../../../shared/ui/tooltip/tooltip';
import { NewModal } from '../../../../../shared/ui/new-modal/new-modal';
import {
  TabBarId,
  TabBarItem,
} from '../../../../../shared/ui/tab-bar/tab-bar.types';
import { CoordinationService } from '../../data/coordination.service';
import { PermissionService } from '../../../../../core/service/permission-service';
import { AuthService } from '../../../../../core/service/auth-service';
import {
  CAREER_PROFESSOR_TAB_ID,
  CAREER_PROFESSOR_TAB_LABEL,
  CoordinationContractModality,
  CoordinationItem,
  ModalityProfessor,
  ProfessorCargaDocenteSummary,
  ProfessorSearchResult,
} from '../../model/coordination.model';
import {
  mapProfessorSearchToModalityProfessor,
  resolveModalityFromCarga,
} from '../../model/professor-search.mapper';
import { SaveCareerProfessorPreloadRequest } from '../../model/save-career-professor-preload.model';
import { ProfessorAddModal } from '../professor-add-modal/professor-add-modal';
import { ProfessorActivitiesModal } from '../professor-activities-modal/professor-activities-modal';
import { ProfessorSummary } from '../professor-summary/professor-summary';
import { resolveModalityKind } from '../../model/professor-form.config';

export type ProfessorManagementStatus =
  | 'completo'
  | 'incompleto'
  | 'sin-asignar';

type TcoFilter = 'todos' | 'duracion' | 'estado';
type TcoDurationFilter = 'todos' | 'cuatroMeses' | 'onceMeses';
type TcoStateFilter = 'todos' | 'enRegistro' | 'porVerificar' | 'verificado' | 'devuelto' | 'aprobado';

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

const ACTIVATE_LOAD_TOOLTIP = 'Activar carga permite agregar las actividades al docente de tipo planta';

type BadgeTone = 'success' | 'brand' | 'warning' | 'error' | 'gray';

export interface StatusBadge {
  label: string;
  badgeClass: string;
  dotClass: string;
}

export interface ModalityProfessorRow {
  rowKey: string;
  menuKey: string;
  displayName: string;
  professor: ModalityProfessor;
}

const NN_LABEL = 'NN';

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
    badge:
      'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    dot: 'bg-brand-600 dark:bg-brand-400',
  },
  warning: {
    badge:
      'bg-warning-50 text-warning-700 ' +
      'dark:bg-warning-500/15 dark:text-warning-400',
    dot: 'bg-warning-500 dark:bg-warning-400',
  },
  error: {
    badge:
      'bg-error-50 text-error-700 ' +
      'dark:bg-error-500/15 dark:text-error-400',
    dot: 'bg-error-500 dark:bg-error-400',
  },
  gray: {
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    dot: 'bg-gray-400 dark:bg-gray-500',
  },
};

const UNASSIGNED_DOT =
  `${DOT_BASE} border border-dashed border-gray-400 dark:border-gray-500`;

const ON_REGISTER_STATE = '0';
const PENDING_VERIFY_STATE = '1';
const VERIFIED_STATE = '2';
const RETURNED_STATE = '3';
const APPROVED_STATE = '4';

@Component({
  selector: 'app-contract-modality-detail',
  imports: [
    Button,
    Dropdown,
    Item,
    Icon,
    TabBar,
    Tooltip,
    NewModal,
    ProfessorAddModal,
    ProfessorActivitiesModal,
    ProfessorSummary,
  ],
  templateUrl: './contract-modality-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContractModalityDetail {
  private readonly authService = inject(AuthService);
  private readonly coordinationService = inject(CoordinationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly permissions = inject(PermissionService);

  coordination = input.required<CoordinationItem>();
  coordinationsCatalog = input<CoordinationItem[]>([]);
  /**
   * Permisos de edición recibidos desde el detalle de coordinación.
   * Estos valores permiten evitar condiciones repetidas en la vista y centralizan
   * el bloqueo de acciones de escritura en precarga docente.
   */
  canEditPreassignment = input(true);
  editBlockReason = input<string | null>(null);
  refreshKey = input(0);
  hasProfessorsChange = output<boolean>();
  preloadChanged = output<void>();
  anyProfessorsVerified = output<boolean>();
  allProfessorsApproved = output<boolean>();

  readonly selectedContractModalityId = signal<TabBarId | null>(null);
  readonly tcoFilter = signal<TcoFilter>('todos');
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
      id: 'enRegistro',
      label: 'En registro',
      icon: 'orbit',
    },
    {
      id: 'porVerificar',
      label: 'Por verificar',
      icon: 'orbit',
    },
    {
      id: 'verificado',
      label: 'Verificado',
      icon: 'orbit',
    },
    {
      id: 'devuelto',
      label: 'Devuelto',
      icon: 'orbit',
    },
    {
      id: 'aprobado',
      label: 'Aprobado',
      icon: 'orbit',
    },
  ];

  readonly isProfessorAddModalOpen = signal(false);
  readonly isActivitiesModalOpen = signal(false);
  readonly isSummaryModalOpen = signal(false);
  readonly professorModalMode = signal<'create' | 'edit'>('create');
  readonly editingModalityProfessor = signal<ModalityProfessor | null>(null);
  readonly activitiesProfessor = signal<ModalityProfessor | null>(null);
  readonly summaryProfessor = signal<ModalityProfessor | null>(null);
  readonly activitiesCoordination = signal<CoordinationItem | null>(null);
  readonly activitiesContractModality = signal<CoordinationContractModality | null>(null);
  readonly isExistingLoadAlertOpen = signal(false);
  readonly pendingExistingLoadProfessor = signal<ProfessorSearchResult | null>(null);
  readonly openTcoFilterMenu = signal<TcoFilter | null>(null);
  readonly openMenuKey = signal<string | null>(null);
  readonly writeBlockReason = computed(
    () =>
      this.editBlockReason() ??
      'La coordinación no está habilitada para edición en esta convocatoria.',
  );

  readonly contractModalities = computed(
    () => this.coordination().modalidadesContratacion,
  );

  readonly sortedContractModalities = computed(() =>
    this.sortContractModalities(this.contractModalities()),
  );

  readonly assignableModalities = computed(() =>
    this.sortedContractModalities(),
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
      this.coordinationService.listCareerProfessorLoads(params.idCarga),
    defaultValue: [] as ModalityProfessor[],
  });

  readonly careerProfessors = computed(() =>
    this.careerProfessorsResource.value(),
  );

  readonly modalityProfessorsResource = rxResource({
    params: () => {
      /*if (!this.permissions.canListProfessors()) {
        return undefined;
      }*/

      const modalities = this.sortedContractModalities();
      const idCarga = this.coordination().idCarga;
      if (!modalities.length || idCarga == null) {
        return undefined;
      }
      return {
        idCarga,
        modalityIds: modalities.map((modality) => modality.id),
      };
    },
    stream: ({ params }) =>
      forkJoin(
        params.modalityIds.map((id) =>
          this.coordinationService
            .listProfessorsByModality(params.idCarga, id)
            .pipe(map((professors) => ({ id, professors }))),
        ),
      ).pipe(map((entries) => this.toModalityProfessorsMap(entries))),
    defaultValue: {} as Record<number, ModalityProfessor[]>,
  });

  readonly modalityProfessorsMap = computed(() =>
    this.modalityProfessorsResource.value(),
  );

  readonly professorsWithLoad = computed(() => {
    const professors = Object.values(this.modalityProfessorsMap())
      .flat()
      .filter((professor) => professor.tieneCarga === true);
    const career = this.careerProfessors().filter(
      (professor) => professor.tieneCarga === true,
    );
    return professors.concat(career);
  });

  readonly hasLoadedProfessors = computed(
    () => this.professorsWithLoad().length > 0,
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
    const tabs = this.sortedContractModalities().map((modality) =>
      this.toModalityTabItem(modality, professorsByModality),
    );
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

  readonly isCargaEnRegistro = computed(() => (this.coordination().estadoCarga === 'REGISTRADO'));
  readonly isCoordinator = computed(() => {
    const rolesUsuario = this.authService.getRoles();

    return rolesUsuario.includes('Coordinador');
  })

  readonly isTiempoCompletoOcasionalSelected = computed(() => {
    const selectedId = this.selectedContractModalityId();

    const modality = this.sortedContractModalities().find(
      (item) => item.id === selectedId,
    );

    return (
      modality != null &&
      resolveModalityKind(modality.nombre) === 'tiempoCompletoOcasional'
    );
  });

  readonly selectedContractModality = computed(() => {
    if (this.isCareerTabSelected()) {
      return null;
    }

    const selectedId = this.selectedContractModalityId();
    return (
      this.assignableModalities().find((item) => item.id === selectedId) ??
      null
    );
  });

  readonly selectedModalityForModals = computed(() =>
    this.selectedContractModality(),
  );

  readonly selectedModalityLabel = computed(() => {
    if (this.isCareerTabSelected()) {
      return CAREER_PROFESSOR_TAB_LABEL;
    }
    return this.selectedContractModality()?.nombre ?? '-';
  });

  readonly activitiesModalCoordination = computed(() => {
    const resolved = this.activitiesCoordination();
    if (resolved) {
      return resolved;
    }
    return this.coordination();
  });

  readonly activitiesModalContractModality = computed(() => {
    const resolved = this.activitiesContractModality();
    if (resolved) {
      return resolved;
    }
    return this.selectedModalityForModals();
  });

  readonly anyRequiredProfessorsVerified = computed(() => {
    const professors = this.professorsWithLoad();
    if (professors.length === 0) return false;
    return professors.some((professor) => professor.estado === VERIFIED_STATE);
  });

  readonly allRequiredProfessorsApproved = computed(() => {
    const professors = this.professorsWithLoad();
    if (professors.length === 0) return false;
    return professors.every((professor) => professor.estado === APPROVED_STATE);
  });


  constructor() {
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
      this.hasProfessorsChange.emit(this.hasLoadedProfessors());
    });

    effect(() => {
      this.anyProfessorsVerified.emit(
        this.anyRequiredProfessorsVerified()
      );
    });

    effect(() => {
      this.allProfessorsApproved.emit(
        this.allRequiredProfessorsApproved()
      );
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

  onContractModalityChange(modalityId: TabBarId | null): void {
    this.selectedContractModalityId.set(modalityId);
    this.tcoFilter.set('todos');
    this.tcoDurationFilter.set('todos');
    this.tcoStateFilter.set('todos');
  }

  onProfessorAddModalOpen(): void {
    if (!this.canEditPreassignment()) {
      return;
    }

    this.professorModalMode.set('create');
    this.editingModalityProfessor.set(null);
    this.isProfessorAddModalOpen.set(true);
  }

  closeProfessorAddModal(): void {
    this.isProfessorAddModalOpen.set(false);
    this.professorModalMode.set('create');
    this.editingModalityProfessor.set(null);
  }

  onProfessorSaved(): void {
    this.closeProfessorAddModal();
    this.reloadProfessorLists();
    this.notifyPreloadChanged();
  }

  onExistingLoadSelected(professor: ProfessorSearchResult): void {
    this.pendingExistingLoadProfessor.set(professor);
    this.isExistingLoadAlertOpen.set(true);
  }

  closeExistingLoadAlert(): void {
    this.isExistingLoadAlertOpen.set(false);
    this.pendingExistingLoadProfessor.set(null);
  }

  confirmExistingLoadContinue(): void {
    const search = this.pendingExistingLoadProfessor();
    const carga = search?.cargaDocente;
    if (!search || !carga) {
      return;
    }

    const professor = mapProfessorSearchToModalityProfessor(search);
    if (!professor) {
      return;
    }

    this.resolveActivitiesContext(carga)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ coordination, modality }) => {
        this.closeExistingLoadAlert();
        this.closeProfessorAddModal();
        this.activitiesCoordination.set(coordination);
        this.activitiesContractModality.set(modality);
        this.activitiesProfessor.set(professor);
        this.isActivitiesModalOpen.set(true);
      });
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
      const estado = professor.estado.trim();

      if (filter === 'enRegistro') {
        return estado === ON_REGISTER_STATE;
      } else if (filter === 'porVerificar') {
        return estado === PENDING_VERIFY_STATE;
      } else if (filter === 'verificado') {
        return estado === VERIFIED_STATE;
      } else if (filter === 'devuelto') {
        return estado === RETURNED_STATE;
      } else {
        return estado === APPROVED_STATE;
      }
    });
  }
  
  private buildProfessorRows(
    professors: ModalityProfessor[],
  ): ModalityProfessorRow[] {
    return professors.map((professor) => {
      const rowId = professor.idCargaDocente || professor.idPersonaGeneral;
      return {
        rowKey: `professor-${rowId}`,
        menuKey: `professor-${rowId}`,
        displayName: this.resolveProfessorName(professor),
        professor,
      };
    });
  }

  private sortContractModalities(modalities: CoordinationContractModality[]): CoordinationContractModality[] {
    return [...modalities].sort(
      (left, right) =>
        this.resolveModalitySortOrder(left) -
        this.resolveModalitySortOrder(right),
    );
  }

  private resolveModalitySortOrder(modality: CoordinationContractModality): number {
    const kind = resolveModalityKind(modality.nombre);
    if (kind === 'tiempoCompletoOcasional') {
      return 0;
    }
    if (kind === 'catedra') {
      return 1;
    }

    return 3;
  }

  private toModalityTabItem(modality: CoordinationContractModality, professorsByModality: Record<number, ModalityProfessor[]>): TabBarItem {
    const professors = professorsByModality[modality.id] ?? [];
    const verified = professors.filter(
      (professor) => professor.estado !== ON_REGISTER_STATE,
    ).length;

    return {
      id: modality.id,
      label: modality.nombre,
      badge: `${verified}/${professors.length}`,
    };
  }

  private toModalityProfessorsMap(entries: { id: number; professors: ModalityProfessor[] }[],): Record<number, ModalityProfessor[]> {
    return entries.reduce<Record<number, ModalityProfessor[]>>(
      (accumulator, entry) => {
        accumulator[entry.id] = entry.professors;
        return accumulator;
      },
      {},
    );
  }

  professorStatusBadge(professor: ModalityProfessor): StatusBadge | null {
    return this.modalityStatusBadge(professor);
  }

  private buildStatusBadge(
    label: string,
    tone: BadgeTone,
    dotClass?: string,
  ): StatusBadge {
    const palette = BADGE_TONES[tone];
    return {
      label,
      badgeClass: `${BADGE_BASE} ${palette.badge}`,
      dotClass: dotClass ?? `${DOT_BASE} ${palette.dot}`,
    };
  }

  modalityStatusBadge(
    professor: ModalityProfessor,
  ): StatusBadge | null {
    if (!professor.estado) {
      return null;
    }

    switch (professor.estado) {
      case ON_REGISTER_STATE:
        return this.buildStatusBadge('En registro', 'gray');
      case PENDING_VERIFY_STATE:
        return this.buildStatusBadge('Enviado para verificar', 'warning');
      case VERIFIED_STATE:
        return this.buildStatusBadge('Verificado', 'brand');
      case RETURNED_STATE:
        return this.buildStatusBadge('Devuelto', 'error');
      case APPROVED_STATE:
        return this.buildStatusBadge('Aprobada', 'success');
      default:
        return this.buildStatusBadge('Estado desconocido', 'gray');
    }
  }

  activitiesStatusBadge(professor: ModalityProfessor): StatusBadge | null {
    if (professor.tieneDetalleActividades !== true) {
      return null;
    }

    return this.buildStatusBadge('Con actividades', 'brand');
  }

  canOpenProfessorMenu(professor: ModalityProfessor): boolean {
    if (professor.tieneCarga) return true;

    return this.isCoordinator() && this.isCargaEnRegistro();
  }

  resolveProfessorActions(professor: {
    tieneDetalleActividades?: boolean;
    tieneCarga?: boolean;
  }): ProfessorMenuAction[] {
    const canEdit = this.canEditPreassignment();
    const hasDetail = professor.tieneDetalleActividades === true;

    const activitiesAction: ProfessorMenuAction = {
      id: 'actividades',
      label: canEdit
        ? hasDetail
          ? 'Gestionar actividades'
          : 'Agregar actividades'
        : 'Ver actividades',
      icon: canEdit ? (hasDetail ? 'pencil' : 'plus') : 'eyeOpen',
    };

    const summaryAction: ProfessorMenuAction = {
      id: 'resumen',
      label: 'Ver resumen',
      icon: 'file',
    };

    if (this.isCareerTabSelected()) {
      if (professor.tieneCarga === false) {
        return [
          {
            id: 'activar-carga',
            label: 'Activar carga',
            icon: 'briefcase',
            tooltip: canEdit ? ACTIVATE_LOAD_TOOLTIP : this.writeBlockReason(),
            className: canEdit ? undefined : 'cursor-not-allowed opacity-50',
          },
        ];
      }

      return [activitiesAction, summaryAction];
    }

    const actions: ProfessorMenuAction[] = [
      {
        id: 'detalle',
        label: 'Ver detalle preasignación',
        icon: 'userCircle',
      },
      activitiesAction,
      summaryAction,
    ];

    if (this.permissions.canDeleteProfessor() && this.isCargaEnRegistro()) {
      actions.push({
        id: 'eliminar',
        label: 'Eliminar',
        icon: 'delete',
        tooltip: canEdit ? undefined : this.writeBlockReason(),
        className: canEdit
          ? 'text-error-600 dark:text-error-400'
          : 'cursor-not-allowed opacity-50 text-error-600 dark:text-error-400',
      });
    }

    return actions;
  }

  resolveProfessorName(professor: ModalityProfessor): string {
    if (professor.idPersonaGeneral == null) {
      return NN_LABEL;
    }
    return professor.nombreCompleto?.trim() || NN_LABEL;
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

  onProfessorMenuAction(actionId: string, professor: ModalityProfessor): void {
    this.closeProfessorMenu();

    const writeActions = ['activar-carga', 'eliminar'];
    if (writeActions.includes(actionId) && !this.canEditPreassignment()) {
      return;
    }

    if (actionId === 'detalle') {
      this.openProfessorDetail(professor);
      return;
    }

    if (actionId === 'actividades') {
      this.openActivitiesModal(professor);
      return;
    }

    if (actionId === 'resumen') {
      this.openSummaryModal(professor);
      return;
    }

    if (actionId === 'activar-carga') {
      this.activateCareerProfessorLoad(professor);
      return;
    }

    if (actionId === 'eliminar') {
      this.deleteModalityProfessor(professor.idCargaDocente);
    }
  }

  openActivitiesModal(professor: ModalityProfessor): void {
    const coordination = this.coordination();
    const modality =
      coordination.modalidadesContratacion.find(
        (item) => item.id === professor.idModalidadContratacion,
      ) ?? this.selectedModalityForModals();

    this.activitiesCoordination.set(coordination);
    this.activitiesContractModality.set(modality);
    this.activitiesProfessor.set(professor);
    this.isActivitiesModalOpen.set(true);
  }

  closeActivitiesModal(): void {
    this.isActivitiesModalOpen.set(false);
    this.activitiesProfessor.set(null);
    this.activitiesCoordination.set(null);
    this.activitiesContractModality.set(null);
  }

  openSummaryModal(professor: ModalityProfessor): void {
    this.summaryProfessor.set(professor);
    this.isSummaryModalOpen.set(true);
  }

  closeSummaryModal(): void {
    this.isSummaryModalOpen.set(false);
    this.summaryProfessor.set(null);
  }

  onActivitiesSaved(): void {
    this.reloadProfessorLists();
    this.notifyPreloadChanged();
  }

  private reloadProfessorLists(): void {
    this.modalityProfessorsResource.reload();
    this.careerProfessorsResource.reload();
  }

  private notifyPreloadChanged(): void {
    this.preloadChanged.emit();
  }

  private openProfessorDetail(professor: ModalityProfessor): void {
    this.editingModalityProfessor.set(professor);
    this.professorModalMode.set('edit');
    this.isProfessorAddModalOpen.set(true);
  }

  private deleteModalityProfessor(idCargaDocente: number | null): void {
    if (idCargaDocente == null) {
      return;
    }

    this.coordinationService
      .deleteProfessor(idCargaDocente)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.reloadProfessorLists();
        this.notifyPreloadChanged();
      });
  }

  private activateCareerProfessorLoad(professor: ModalityProfessor): void {
    const request = this.buildActivateCareerProfessorLoadRequest(professor);
    if (!request) {
      return;
    }

    this.coordinationService
      .saveCareerProfessorPreload(request)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.reloadProfessorLists();
        this.notifyPreloadChanged();
      });
  }

  private buildActivateCareerProfessorLoadRequest(
    professor: ModalityProfessor,
  ): SaveCareerProfessorPreloadRequest | null {
    const coordination = this.coordination();
    const idConvocatoria = coordination.idConvocatoria;
    const idPersonaGeneral = professor.idPersonaGeneral;

    const idCarga = coordination.idCarga;
    if (
      idConvocatoria == null ||
      idPersonaGeneral == null ||
      idCarga == null
    ) {
      return null;
    }

    return {
      idCarga,
      idConvocatoria,
      idPersonaGeneral,
    };
  }

  private resolveActivitiesContext(
    carga: NonNullable<ProfessorSearchResult['cargaDocente']>,
  ): Observable<{
    coordination: CoordinationItem;
    modality: CoordinationContractModality;
  }> {
    return this.findCoordinationForCarga(carga).pipe(
      map((coordination) => ({
        coordination,
        modality: resolveModalityFromCarga(coordination, carga),
      })),
    );
  }

  private findCoordinationForCarga(
    carga: ProfessorCargaDocenteSummary,
  ): Observable<CoordinationItem> {
    const current = this.coordination();
    const idCoordinacion = carga.idCoordinacion;
    const idPeriodoUniversidad = current.idPeriodoUniversidad;

    if (idCoordinacion === current.id) {
      return of(current);
    }

    if (carga.idConvocatoria != null && idPeriodoUniversidad != null) {
      return this.coordinationService
        .getCoordinations(idPeriodoUniversidad, carga.idConvocatoria)
        .pipe(
          switchMap((items) => {
            const match = this.findCoordinationInList(
              items,
              idCoordinacion,
            );
            if (match) {
              return of(match);
            }
            return this.findCoordinationFallback(idCoordinacion, current);
          }),
        );
    }

    return this.findCoordinationFallback(idCoordinacion, current);
  }

  private findCoordinationFallback(
    idCoordinacion: number,
    current: CoordinationItem,
  ): Observable<CoordinationItem> {
    const catalogMatch = this.findCoordinationInList(
      this.coordinationsCatalog(),
      idCoordinacion,
    );

    if (catalogMatch) {
      return of(catalogMatch);
    }

    const idPeriodoUniversidad = current.idPeriodoUniversidad;
    const idConvocatoria = current.idConvocatoria;

    if (idPeriodoUniversidad == null) {
      return of(current);
    }

    const scoped$ = this.coordinationService.getCoordinations(
      idPeriodoUniversidad,
      idConvocatoria,
    );

    return scoped$.pipe(
      switchMap((scopedItems) => {
        const scopedMatch = this.findCoordinationInList(
          scopedItems,
          idCoordinacion,
        );
        if (scopedMatch) {
          return of(scopedMatch);
        }

        return this.coordinationService
          .getCoordinations(idPeriodoUniversidad)
          .pipe(
            map(
              (allItems) =>
                this.findCoordinationInList(allItems, idCoordinacion) ??
                current,
            ),
          );
      }),
    );
  }

  private findCoordinationInList(
    items: CoordinationItem[],
    idCoordinacion: number,
  ): CoordinationItem | undefined {
    return items.find((item) => item.id === idCoordinacion);
  }
}
