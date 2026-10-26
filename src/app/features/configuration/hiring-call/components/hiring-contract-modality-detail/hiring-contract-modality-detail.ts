import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, map, Observable } from 'rxjs';
import { forNext } from '../../../../../core/utils/for-next.function';
import { Dropdown } from '../../../../../shared/ui/dropdown/dropdown/dropdown';
import { Item } from '../../../../../shared/ui/dropdown/item/item';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { AppIconName } from '../../../../../shared/ui/icon/icons';
import { TabBar } from '../../../../../shared/ui/tab-bar/tab-bar';
import {
  TabBarId,
  TabBarItem,
} from '../../../../../shared/ui/tab-bar/tab-bar.types';
import { PtdModal } from '../ptd-modal/ptd-modal';
import { formatSentenceValue } from '../../../../../shared/utils/normalized-text.util';
import { resolveModalityKind } from '../../../professor-preload/model/professor-form.config';
import {
  CAREER_PROFESSOR_TAB_ID,
  CAREER_PROFESSOR_TAB_LABEL,
  CoordinationContractModality,
  CoordinationItem,
  ModalityProfessor,
} from '../../../professor-preload/model/coordination.model';
import { HiringCallService } from '../../data/hiring-call.service';
import { DraftContract } from '../draft-contract/draft-contract';
import { PermissionService } from '../../../../../core/service/permission-service';

type BadgeTone = 'success' | 'brand' | 'warning' | 'error' | 'gray';

interface StatusBadge {
  label: string;
  badgeClass: string;
  dotClass: string;
}

interface ProfessorMenuAction {
  id: string;
  label: string;
  icon: AppIconName;
  className?: string;
  tooltip?: string;
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

const NN_LABEL = 'NN';
const ON_REGISTER_STATE = '0';

const STIPULATED_PTD_STATE = '0';
const ACCEPTED_PTD_STATE = '1';
const REJECTED_PTD_STATE = '2';

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
  selector: 'app-hiring-contract-modality-detail',
  imports: [TabBar, Dropdown, Item, Icon, PtdModal, DraftContract],
  templateUrl: './hiring-contract-modality-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HiringContractModalityDetail {
  private readonly hiringCallService = inject(HiringCallService);
  private readonly permissions = inject(PermissionService);

  readonly coordination = input.required<CoordinationItem>();
  readonly refreshKey = input(0);

  readonly selectedContractModalityId = signal<TabBarId | null>(null);
  readonly openMenuKey = signal<string | null>(null);
  readonly isPtdModalOpen = signal(false);
  readonly ptdProfessorId = signal<number | null>(null);
  readonly ptdPeriodId = signal<number | null>(null);
  readonly draftContractProfessorId = signal<number | null>(null);
  readonly isDraftContractModalOpen = signal(false);

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
      this.hiringCallService.listCareerProfessors(params.idCarga),
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

  readonly ptdStatesProfessorsResource = rxResource({
    params: () => {
      const idPeriodoUniversitario = this.coordination().idPeriodoUniversidad;

      if (idPeriodoUniversitario == null) {
        return undefined;
      }

      return { idPeriodoUniversitario };
    },
    stream: ({ params }) => this.hiringCallService.getPtdStatesProfessors(params.idPeriodoUniversitario),
    defaultValue: []
  });

  readonly modalityProfessorsMap = computed(() =>
    this.modalityProfessorsResource.value(),
  );

  readonly ptdStatesByProfessorMap = computed(() => {
    const states = this.ptdStatesProfessorsResource.value();
    const result: Record<number, string> = {};

    forNext(states, (item) => {
      result[item.idPersonaGeneral] = item.estado;
    });
    return result;
  });

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

  readonly currentProfessorRows = computed<ModalityProfessorRow[]>(() =>
    this.buildProfessorRows(this.modalityProfessors()),
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

  readonly isLoadingProfessors = computed(() =>
    this.modalityProfessorsResource.isLoading(),
  );

  readonly selectedModalityLabel = computed(() => {
    if (this.isCareerTabSelected()) {
      return CAREER_PROFESSOR_TAB_LABEL;
    }
    const selectedId = this.selectedContractModalityId();
    const modality = this.sortedContractModalities().find(
      (item) => item.id === selectedId,
    );
    return formatSentenceValue(modality?.nombre) || 'esta modalidad';
  });

  readonly isCareerTabSelected = computed(
    () => this.selectedContractModalityId() === CAREER_PROFESSOR_TAB_ID,
  );

  readonly isCargaEnAvalDesarrollo = computed(() => (this.coordination().estadoCarga === 'AVAL DESARROLLO'));

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
  }

  onContractModalityChange(id: TabBarId | null): void {
    this.selectedContractModalityId.set(id);
    this.closeProfessorMenu();
  }

  toggleProfessorMenu(menuKey: string): void {
    this.openMenuKey.update((current) =>
      current === menuKey ? null : menuKey,
    );
  }

  closeProfessorMenu(): void {
    this.openMenuKey.set(null);
  }

  resolveProfessorMenuAction(professor: ModalityProfessor): ProfessorMenuAction[] {
    const hasLoad = professor.tieneCarga === true;

    if (!hasLoad || !this.isCargaEnAvalDesarrollo()) return [];

    const actions: ProfessorMenuAction[] = [];
    if (this.permissions.canSavePtd()) {
      actions.push({
        id: 'plan-trabajo',
        label: 'Plan de trabajo',
        icon: 'file',
      });
    }

    if (this.permissions.canSaveContract()) {
      actions.push({
        id: 'diligenciar-contrato',
        label: 'Diligenciar contrato',
        icon: 'file',
      });
    }

    if (this.permissions.canReviewPtd()) {
      actions.push({
        id: 'revisar-ptd',
        label: 'Revisar plan de trabajo',
        icon: 'eye',
      });
    }

    return actions;
  }

  onProfessorMenuAction(
    actionId: string,
    professor: ModalityProfessor,
  ): void {
    this.closeProfessorMenu();

    if (actionId === 'plan-trabajo') {
      this.ptdProfessorId.set(professor.idCargaDocente);
      this.ptdPeriodId.set(this.coordination().idPeriodoUniversidad);
      this.isPtdModalOpen.set(true);
    }
    if (actionId === 'diligenciar-contrato') {
      this.draftContractProfessorId.set(professor.idCargaDocente);
      this.isDraftContractModalOpen.set(true);
    }
    if (actionId === 'revisar-ptd') {
      
    }
  }

  closePtdModal(): void {
    this.isPtdModalOpen.set(false);
    this.ptdProfessorId.set(null);
    this.ptdPeriodId.set(null);
  }

  closeDraftContractModal(): void {
    this.isDraftContractModalOpen.set(false);
    this.draftContractProfessorId.set(null);
  }

  professorStatusBadge(professor: ModalityProfessor): StatusBadge | null {
    if (!professor.idPersonaGeneral) {
      return null;
    }

    const estadoPTD = this.ptdStatesByProfessorMap()[professor.idPersonaGeneral];
    switch (estadoPTD) {
      case STIPULATED_PTD_STATE:
        return this.buildStatusBadge('Plan estipulado', 'warning');
      case ACCEPTED_PTD_STATE:
        return this.buildStatusBadge('Plan aceptado', 'success');
      case REJECTED_PTD_STATE:
        return this.buildStatusBadge('Plan rechazado', 'error');
      default:
        return this.buildStatusBadge('Sin definir', 'gray');
    }
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
        this.hiringCallService
          .listProfessorsByModality(params.idCarga, id)
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
      const menuKey = `professor-${rowId}`;
      rows.push({
        rowKey: menuKey,
        menuKey,
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
      (professor) => professor.estado !== ON_REGISTER_STATE,
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
      result[entry.id] = entry.professors;
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
}
