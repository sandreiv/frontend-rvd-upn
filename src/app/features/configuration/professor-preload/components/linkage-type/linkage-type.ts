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
import { catchError, forkJoin, map, of } from 'rxjs';
import { TabBar } from '../../../../../shared/ui/tab-bar/tab-bar';
import {
  TabBarId,
  TabBarItem,
} from '../../../../../shared/ui/tab-bar/tab-bar.types';
import { CoordinationService } from '../../data/coordination.service';
import { CoordinationItem } from '../../model/coordination.model';
import {
  LinkageTypeItem,
  linkageTypeLabel,
} from '../../model/linkage-type.model';
import {
  ProfessorLoadBadgeTone,
  ProfessorLoadItem,
  professorLoadDisplayName,
  professorLoadStatus,
} from '../../model/professor-load.model';
import { isPlantLinkage as plantLinkage } from '../../model/professor-form.config';
import { Button } from '../../../../../shared/ui/button/button';
import { Dropdown } from '../../../../../shared/ui/dropdown/dropdown/dropdown';
import { Item } from '../../../../../shared/ui/dropdown/item/item';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { AppIconName } from '../../../../../shared/ui/icon/icons';
import { ProfessorActivitiesModal } from '../professor-activities-modal/professor-activities-modal';
import { ProfessorAddModal } from '../professor-add-modal/professor-add-modal';

type BadgeTone = ProfessorLoadBadgeTone;

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
}

const BADGE_BASE =
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium';

const DOT_BASE = 'size-1.5 rounded-full';

const BADGE_TONES: Record<BadgeTone, { badge: string; dot: string }> = {
  success: {
    badge:
      'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400',
    dot: 'bg-success-600 dark:bg-success-400',
  },
  brand: {
    badge:
      'bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400',
    dot: 'bg-brand-600 dark:bg-brand-400',
  },
  warning: {
    badge:
      'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400',
    dot: 'bg-warning-500 dark:bg-warning-400',
  },
  error: {
    badge:
      'bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400',
    dot: 'bg-error-500 dark:bg-error-400',
  },
  gray: {
    badge: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
    dot: 'bg-gray-400 dark:bg-gray-500',
  },
};

const ON_REGISTER_STATE = '0';

@Component({
  selector: 'app-linkage-type',
  imports: [
    TabBar,
    Button,
    Dropdown,
    Item,
    Icon,
    ProfessorAddModal,
    ProfessorActivitiesModal,
  ],
  templateUrl: './linkage-type.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkageType {
  private readonly coordinationService = inject(CoordinationService);

  readonly coordination = input.required<CoordinationItem>();
  readonly selectedLinkageTypeId = signal<TabBarId | null>(null);
  readonly isProfessorAddModalOpen = signal(false);
  readonly isActivitiesModalOpen = signal(false);
  readonly activitiesProfessor = signal<ProfessorLoadItem | null>(null);
  readonly professorsRefresh = signal(0);
  readonly openMenuKey = signal<string | null>(null);

  readonly linkageTypesResource = rxResource({
    params: () => {
      const idConvocatoria = this.coordination().idConvocatoria;
      if (idConvocatoria == null) {
        return undefined;
      }

      return { idConvocatoria };
    },
    stream: ({ params }) =>
      this.coordinationService.listLinkageTypes(params.idConvocatoria),
    defaultValue: [] as LinkageTypeItem[],
  });

  readonly linkageTypes = computed(() => this.linkageTypesResource.value());

  readonly isLoadingLinkageTypes = computed(() =>
    this.linkageTypesResource.isLoading(),
  );

  readonly professorsResource = rxResource({
    params: () => {
      const linkageTypes = this.linkageTypes().filter(
        (item) => item.idTipoVinculacionConvocatoria != null,
      );
      if (!linkageTypes.length) {
        return undefined;
      }

      return {
        linkageTypes,
        idCoordinacion: this.coordination().id,
        refresh: this.professorsRefresh(),
      };
    },
    stream: ({ params }) =>
      forkJoin(
        params.linkageTypes.map((item) =>
          this.coordinationService
            .listProfessors(item.idTipoVinculacionConvocatoria)
            .pipe(
              map((professors) => ({
                id: item.id,
                professors: professors.filter(
                  (professor) =>
                    professor.idCoordinacion === params.idCoordinacion,
                ),
              })),
              catchError(() =>
                of({ id: item.id, professors: [] as ProfessorLoadItem[] }),
              ),
            ),
        ),
      ).pipe(map((entries) => this.toProfessorsMap(entries))),
    defaultValue: {} as Record<number, ProfessorLoadItem[]>,
  });

  readonly professorsByLinkageType = computed(() =>
    this.professorsResource.value(),
  );

  readonly isLoadingProfessors = computed(() =>
    this.professorsResource.isLoading(),
  );

  readonly currentProfessors = computed(() => {
    const selectedId = this.selectedLinkageTypeId();
    if (selectedId == null) {
      return [];
    }

    return this.professorsByLinkageType()[Number(selectedId)] ?? [];
  });

  readonly selectedLinkageTypeLabel = computed(() => {
    const linkageType = this.selectedLinkageType();
    return linkageType ? linkageTypeLabel(linkageType) : '-';
  });

  readonly linkageTypeTabs = computed<TabBarItem[]>(() => {
    const professorsByType = this.professorsByLinkageType();

    return this.linkageTypes().map((item) => {
      const professors = professorsByType[item.id] ?? [];
      const verified = professors.filter(
        (professor) =>
          (professor.estadoCarga?.orden ?? '').trim() !== ON_REGISTER_STATE,
      ).length;

      return {
        id: item.id,
        label: linkageTypeLabel(item),
        badge: `${verified}/${professors.length}`,
      };
    });
  });

  readonly hasAnyLinkageType = computed(
    () => this.linkageTypeTabs().length > 0,
  );

  readonly selectedLinkageType = computed(() => {
    const selectedId = this.selectedLinkageTypeId();
    return (
      this.linkageTypes().find((item) => item.id === selectedId) ?? null
    );
  });

  readonly isPlantLinkage = computed(() =>
    plantLinkage(this.selectedLinkageType()?.esPlanta),
  );

  constructor() {
    effect(() => {
      const tabs = this.linkageTypeTabs();
      const currentId = this.selectedLinkageTypeId();

      if (!tabs.length) {
        this.selectedLinkageTypeId.set(null);
        return;
      }

      const hasCurrent = tabs.some((tab) => tab.id === currentId);
      if (!hasCurrent) {
        this.selectedLinkageTypeId.set(tabs[0].id);
      }
    });
  }

  onLinkageTypeChange(linkageTypeId: TabBarId | null): void {
    this.selectedLinkageTypeId.set(linkageTypeId);
    this.closeProfessorMenu();
  }

  onProfessorAddModalOpen(): void {
    this.isProfessorAddModalOpen.set(true);
  }

  closeProfessorAddModal(): void {
    this.isProfessorAddModalOpen.set(false);
    this.professorsRefresh.update((value) => value + 1);
  }

  professorMenuKey(professor: ProfessorLoadItem): string {
    return `professor-${professor.idCargaDocente}`;
  }

  toggleProfessorMenu(menuKey: string): void {
    this.openMenuKey.update((current) =>
      current === menuKey ? null : menuKey,
    );
  }

  closeProfessorMenu(): void {
    this.openMenuKey.set(null);
  }

  resolveProfessorActions(): ProfessorMenuAction[] {
    const actions: ProfessorMenuAction[] = [];

    if (!this.isPlantLinkage()) {
      actions.push({
        id: 'detalle',
        label: 'Ver detalle',
        icon: 'userCircle',
      });
    }

    actions.push(
      {
        id: 'actividades',
        label: 'Gestionar actividades',
        icon: 'pencil',
      },
      {
        id: 'eliminar',
        label: 'Eliminar',
        icon: 'delete',
        className: 'text-error-600 dark:text-error-400',
      },
    );

    return actions;
  }

  onProfessorMenuAction(actionId: string, professor: ProfessorLoadItem): void {
    this.closeProfessorMenu();

    if (actionId !== 'actividades') {
      return;
    }

    this.activitiesProfessor.set(professor);
    this.isActivitiesModalOpen.set(true);
  }

  closeActivitiesModal(): void {
    this.isActivitiesModalOpen.set(false);
    this.activitiesProfessor.set(null);
  }

  professorDisplayName(professor: ProfessorLoadItem): string {
    return professorLoadDisplayName(professor);
  }

  professorStatusBadge(professor: ProfessorLoadItem): StatusBadge | null {
    const status = professorLoadStatus(professor.estadoCarga);
    if (!status) {
      return null;
    }

    return this.buildStatusBadge(status.label, status.tone);
  }

  activitiesStatusBadge(professor: ProfessorLoadItem): StatusBadge | null {
    if (professor.tieneActividades !== 1) {
      return null;
    }

    return this.buildStatusBadge('Con actividades', 'brand');
  }

  private toProfessorsMap(
    entries: { id: number; professors: ProfessorLoadItem[] }[],
  ): Record<number, ProfessorLoadItem[]> {
    return entries.reduce<Record<number, ProfessorLoadItem[]>>(
      (accumulator, entry) => {
        accumulator[entry.id] = entry.professors;
        return accumulator;
      },
      {},
    );
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
