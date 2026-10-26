import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import {
  PermissionService,
} from '../../../../../../../core/service/permission-service';

import { rxResource } from '@angular/core/rxjs-interop';

import { CoordinationService } from '../../../../data/coordination.service';

import {
  GeneralNoveltyHistoryItem,
  NoveltyHistoryState,
} from '../../../../model/novelty-history.model';

import {
  NOVELTY_APPROVED_STATE,
  NOVELTY_PENDING_REVIEW_STATE,
  NOVELTY_REJECTED_STATE,
} from '../../../../model/professor-novelty-state';

import { Icon } from '../../../../../../../shared/ui/icon/icon';

import {
  Dropdown,
} from '../../../../../../../shared/ui/dropdown/dropdown/dropdown';

import {
  Item,
} from '../../../../../../../shared/ui/dropdown/item/item';

import {
  Tooltip,
} from '../../../../../../../shared/ui/tooltip/tooltip';

type NoveltyHistoryStateFilter =
  'todos' | NoveltyHistoryState;

type HistoryDropdown =
  'professor' | 'novelty';

type BadgeTone =
  'success' | 'error' | 'gray';

interface StatusBadge {
  label: string;
  badgeClass: string;
  dotClass: string;
}

interface ProfessorFilterOption {
  idPersonaGeneral: number;
  nombre: string;
}

interface NoveltyFilterOption {
  idNovedadCatalogo: number;
  nombre: string;
}

interface StateFilterOption {
  id: NoveltyHistoryStateFilter;
  label: string;
}

const BADGE_BASE =
  'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 ' +
  'text-xs font-medium';

const DOT_BASE =
  'size-1.5 rounded-full';

const BADGE_TONES: Record<
  BadgeTone,
  { badge: string; dot: string }
> = {
  success: {
    badge:
      'bg-success-50 text-success-700 ' +
      'dark:bg-success-500/15 dark:text-success-400',
    dot:
      'bg-success-600 dark:bg-success-400',
  },

  error: {
    badge:
      'bg-error-50 text-error-700 ' +
      'dark:bg-error-500/15 dark:text-error-400',
    dot:
      'bg-error-500 dark:bg-error-400',
  },

  gray: {
    badge:
      'bg-gray-100 text-gray-600 ' +
      'dark:bg-gray-800 dark:text-gray-300',
    dot:
      'bg-gray-400 dark:bg-gray-500',
  },
};

@Component({
  selector: 'app-novelty-general-history',

  imports: [
    Icon,
    Dropdown,
    Item,
    Tooltip,
  ],

  templateUrl:
    './novelty-general-history.html',

  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class NoveltyGeneralHistory {

  private readonly coordinationService =
    inject(CoordinationService);

  private readonly permissions =
    inject(PermissionService);  

  readonly idCarga =
    input<number | null>(null);

  readonly refreshKey =
    input(0);
  
  readonly reportRequested =
    output<number>();  

  readonly stateFilter =
    signal<NoveltyHistoryStateFilter>(
      'todos',
    );

  readonly professorFilter =
    signal<number | null>(null);

  readonly noveltyFilter =
    signal<number | null>(null);

  readonly openDropdown =
    signal<HistoryDropdown | null>(null);

  readonly stateFilterOptions:
    StateFilterOption[] = [
      {
        id: 'todos',
        label: 'Todos',
      },
      {
        id: '0',
        label: 'En revisión',
      },
      {
        id: '1',
        label: 'Aprobadas',
      },
      {
        id: '2',
        label: 'Rechazadas',
      },
    ];

  readonly historyResource = rxResource({
    params: () => {
      const idCarga = this.idCarga();

      if (idCarga == null) {
        return undefined;
      }

      return {
        idCarga,
        refreshKey: this.refreshKey(),
      };
    },

    stream: ({ params }) =>
      this.coordinationService
        .listGeneralNoveltyHistory(
          params.idCarga,
        ),

    defaultValue:
      [] as GeneralNoveltyHistoryItem[],
  });

  readonly history =
    computed(() =>
      this.historyResource.value(),
    );

  readonly professorOptions =
    computed<ProfessorFilterOption[]>(() => {
        const unique =
        new Map<number, string>();

        for (const item of this.history()) {

        if (item.idPersonaGeneral == null) {
            continue;
        }

        unique.set(
            item.idPersonaGeneral,
            item.nombreDocente?.trim() || 'NN',
        );
        }

        return Array
        .from(unique.entries())
        .map(
            ([idPersonaGeneral, nombre]) => ({
            idPersonaGeneral,
            nombre,
            }),
        )
        .sort(
            (left, right) =>
            left.nombre.localeCompare(
                right.nombre,
                'es',
            ),
        );
    });

  readonly noveltyOptions =
    computed<NoveltyFilterOption[]>(() => {
      const unique =
        new Map<number, string>();

      for (const item of this.history()) {
        if (
          item.idNovedadCatalogo == null
        ) {
          continue;
        }

        unique.set(
          item.idNovedadCatalogo,
          item.tipoNovedad,
        );
      }

      return Array
        .from(unique.entries())
        .map(
          ([idNovedadCatalogo, nombre]) => ({
            idNovedadCatalogo,
            nombre,
          }),
        )
        .sort(
          (left, right) =>
            left.nombre.localeCompare(
              right.nombre,
              'es',
            ),
        );
    });

  readonly selectedProfessorLabel =
    computed(() => {
        const selected =
        this.professorFilter();

        if (selected == null) {
        return 'Todos los docentes';
        }

        return (
        this.professorOptions().find(
            (item) =>
            item.idPersonaGeneral === selected,
        )?.nombre ??
        'Todos los docentes'
        );
    });

  readonly selectedNoveltyLabel =
    computed(() => {
      const selected =
        this.noveltyFilter();

      if (selected == null) {
        return 'Todas las novedades';
      }

      return (
        this.noveltyOptions().find(
          (item) =>
            item.idNovedadCatalogo ===
            selected,
        )?.nombre ??
        'Todas las novedades'
      );
    });

  readonly filteredHistory =
    computed(() => {
      const state =
        this.stateFilter();

      const professor =
        this.professorFilter();

      const novelty =
        this.noveltyFilter();

      return this.history().filter(
        (item) => {

          const matchesState =
            state === 'todos' ||
            item.estadoNovedad === state;

          /*
           * El filtro de docente usa CADO_ID,
           * no PEGE_ID.
           *
           * De esta forma todas las novedades
           * de una misma asignación permanecen
           * agrupadas incluso si existieron
           * solicitudes de cambio de docente.
           */
          const matchesProfessor =
          professor == null ||
          item.idPersonaGeneral === professor;

          const matchesNovelty =
            novelty == null ||
            item.idNovedadCatalogo === novelty;

          return (
            matchesState &&
            matchesProfessor &&
            matchesNovelty
          );
        },
      );
    });

  setStateFilter(
    filter: NoveltyHistoryStateFilter,
  ): void {
    this.stateFilter.set(filter);
  }

  setProfessorFilter(
    idPersonaGeneral: number | null,
    ): void {
    this.professorFilter.set(
     idPersonaGeneral,
    );

    this.openDropdown.set(null);
  }

  setNoveltyFilter(
    idNovedadCatalogo: number | null,
  ): void {
    this.noveltyFilter.set(
      idNovedadCatalogo,
    );

    this.openDropdown.set(null);
  }

  toggleDropdown(
    dropdown: HistoryDropdown,
  ): void {
    this.openDropdown.update(
      (current) =>
        current === dropdown
          ? null
          : dropdown,
    );
  }

  closeDropdown(
    dropdown: HistoryDropdown,
  ): void {
    if (
      this.openDropdown() === dropdown
    ) {
      this.openDropdown.set(null);
    }
  }

  historyStatusBadge(
    state: NoveltyHistoryState,
  ): StatusBadge {

    switch (state) {

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
    }
  }

  rejectionTooltip(
    item: GeneralNoveltyHistoryItem,
  ): string {

    if (
      item.estadoNovedad !==
        NOVELTY_REJECTED_STATE ||
      !item.motivoRechazo?.trim()
    ) {
      return '';
    }

    return (
      'Motivo del rechazo: ' +
      item.motivoRechazo.trim()
    );
  }

  hasRejectionReason(
    item: GeneralNoveltyHistoryItem,
  ): boolean {
    return (
      item.estadoNovedad ===
        NOVELTY_REJECTED_STATE &&
      !!item.motivoRechazo?.trim()
    );
  }

  canViewHistoricalReport(
    item: GeneralNoveltyHistoryItem,
    ): boolean {
    return (
        item.estadoNovedad ===
        NOVELTY_APPROVED_STATE &&
        item.idNovedadCargaDocente != null &&
        this.permissions
        .canDownloadProfessorNoveltyPdf()
    );
  }

  requestHistoricalReport(
    item: GeneralNoveltyHistoryItem,
    ): void {
    if (
        !this.canViewHistoricalReport(item)
    ) {
        return;
    }

    this.reportRequested.emit(
        item.idNovedadCargaDocente,
    );
  }

  /**
   * El backend envía LocalDateTime sin zona:
   * 2026-10-07T10:32:18
   *
   * Se formatea directamente para evitar
   * desplazamientos de zona horaria.
   */
  formatDateTime(
    value: string | null | undefined,
  ): string {

    if (!value) {
      return '-';
    }

    const match = value.match(
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/,
    );

    if (!match) {
      return value;
    }

    const [
      ,
      year,
      month,
      day,
      hour,
      minute,
      second = '00',
    ] = match;

    return (
      `${day}/${month}/${year} ` +
      `${hour}:${minute}:${second}`
    );
  }

  private buildStatusBadge(
    label: string,
    tone: BadgeTone,
  ): StatusBadge {

    const palette =
      BADGE_TONES[tone];

    return {
      label,

      badgeClass:
        `${BADGE_BASE} ${palette.badge}`,

      dotClass:
        `${DOT_BASE} ${palette.dot}`,
    };
  }
}