import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin, tap } from 'rxjs';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { Option, Select } from '../../../../../shared/components/form/select/select';
import { forNext } from '../../../../../core/utils/for-next.function';
import { CoordinationService } from '../../data/coordination.service';
import { LinkageTypeItem } from '../../model/linkage-type.model';
import { ProfessorLoadItem, professorLoadDisplayName } from '../../model/professor-load.model';
import {
  ActivityRestrictionItem,
  ActivityTypeNode,
  activityRootIds,
  visibleActivityTree,
} from '../../model/professor-activities.model';
import { ProfessorLoadDetailItem } from '../../model/professor-load-detail.model';
import { ActivityTree } from './components/activity-tree/activity-tree';

interface ActivityCatalog {
  activities: ActivityTypeNode[];
  restrictions: ActivityRestrictionItem[];
}

const EMPTY_CATALOG: ActivityCatalog = {
  activities: [],
  restrictions: [],
};

const EMPTY_DETAILS: ProfessorLoadDetailItem[] = [];

@Component({
  selector: 'app-professor-activities-modal',
  imports: [Modal, Button, Icon, Select, ActivityTree],
  templateUrl: './professor-activities-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorActivitiesModal {
  private readonly coordinationService = inject(CoordinationService);

  readonly isOpen = input(false);
  readonly professor = input<ProfessorLoadItem | null>(null);
  readonly linkageType = input<LinkageTypeItem | null>(null);
  readonly linkageLabel = input('');
  readonly coordinationLabel = input('');
  readonly periodLabel = input('');
  readonly idCoordinacion = input<number | null>(null);
  readonly idUnidadRegional = input<number | null>(null);
  readonly idPeriodoUniversidad = input<number | null>(null);
  readonly idConvocatoria = input<number | null>(null);
  readonly close = output<void>();

  private readonly manualActivityIds = signal<number[]>([]);
  private readonly removedActivityIds = signal<number[]>([]);
  private readonly resolvedDetailId = signal<number | null>(null);
  private readonly selectorKey = signal(0);

  constructor() {
    effect(() => {
      if (!this.isOpen()) {
        this.manualActivityIds.set([]);
        this.removedActivityIds.set([]);
        this.resolvedDetailId.set(null);
        this.selectorKey.update((key) => key + 1);
      }
    });
  }

  readonly activitiesResource = rxResource({
    params: () => {
      if (!this.isOpen()) {
        return undefined;
      }

      const idTipoVinculacion = this.linkageType()?.id;
      if (idTipoVinculacion == null) {
        return undefined;
      }

      return { idTipoVinculacion };
    },
    stream: ({ params }) =>
      forkJoin({
        activities: this.coordinationService.listActivityTypes(),
        restrictions: this.coordinationService.listActivityRestrictions(params.idTipoVinculacion),
      }),
    defaultValue: EMPTY_CATALOG,
  });

  readonly detailResource = rxResource({
    params: () => {
      if (!this.isOpen()) {
        return undefined;
      }

      const idCargaDocente = this.professor()?.idCargaDocente;
      if (idCargaDocente == null) {
        return undefined;
      }

      return { idCargaDocente };
    },
    stream: ({ params }) =>
      this.coordinationService.listDetailProfessorLoad(params.idCargaDocente).pipe(
        tap(() => this.resolvedDetailId.set(params.idCargaDocente)),
      ),
    defaultValue: EMPTY_DETAILS,
  });

  readonly professorDisplayName = computed(() => {
    const professor = this.professor();
    return professor ? professorLoadDisplayName(professor) : 'NN';
  });

  readonly linkageText = computed(() => this.linkageLabel().trim() || '-');

  readonly coordinationText = computed(() => this.coordinationLabel().trim() || '-');

  readonly isLoadingActivities = computed(
    () => this.activitiesResource.isLoading() || this.isLoadingInitialDetails(),
  );

  readonly activitiesError = computed(() => this.activitiesResource.error());

  readonly visibleActivities = computed(() => {
    const catalog = this.activitiesResource.value();
    return visibleActivityTree(catalog.activities, catalog.restrictions);
  });

  readonly savedDetails = computed(() => this.detailResource.value());

  readonly addedActivityIds = computed(() => this.visibleActivityIds());

  readonly activityOptions = computed((): Option[] => {
    const added = new Set(this.addedActivityIds());
    const options: Option[] = [];

    forNext(this.visibleActivities(), (activity) => {
      if (added.has(activity.id)) {
        return;
      }

      options.push({
        value: String(activity.id),
        label: activity.nombre?.trim() || 'Actividad',
      });
    });

    return options;
  });

  readonly addedActivities = computed(() => {
    const byId = new Map(this.visibleActivities().map((activity) => [activity.id, activity]));
    const added: ActivityTypeNode[] = [];

    forNext(this.addedActivityIds(), (id) => {
      const activity = byId.get(id);
      if (activity) {
        added.push(activity);
      }
    });

    return added;
  });

  readonly rootsWithSavedDetails = computed(
    () => new Set(activityRootIds(this.visibleActivities(), this.savedLeafIds())),
  );

  readonly selectorVersion = computed(() => this.selectorKey());

  readonly activityPlaceholder = computed(() =>
    this.activityOptions().length
      ? 'Seleccione el tipo de actividad'
      : 'Todas las actividades fueron agregadas',
  );

  onActivitySelected(value: string): void {
    const id = Number(value);
    if (!Number.isInteger(id) || this.addedActivityIds().includes(id)) {
      return;
    }

    const available = this.visibleActivities().some((activity) => activity.id === id);
    if (!available) {
      return;
    }

    this.removedActivityIds.update((ids) => ids.filter((item) => item !== id));
    this.manualActivityIds.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
    this.selectorKey.update((key) => key + 1);
  }

  removeActivity(id: number): void {
    this.manualActivityIds.update((ids) => ids.filter((item) => item !== id));
    this.removedActivityIds.update((ids) => (ids.includes(id) ? ids : [...ids, id]));
  }

  hasSavedDetails(activityId: number): boolean {
    return this.rootsWithSavedDetails().has(activityId);
  }

  reloadSavedDetails(): void {
    if (this.professor()?.idCargaDocente == null) {
      return;
    }

    this.detailResource.reload();
  }

  private isLoadingInitialDetails(): boolean {
    const idCargaDocente = this.professor()?.idCargaDocente;
    if (idCargaDocente == null) {
      return false;
    }

    return this.resolvedDetailId() !== idCargaDocente && this.detailResource.isLoading();
  }

  private visibleActivityIds(): number[] {
    const removed = new Set(this.removedActivityIds());
    const ids: number[] = [];

    forNext(activityRootIds(this.visibleActivities(), this.savedLeafIds()), (id) => {
      if (!removed.has(id)) {
        ids.push(id);
      }
    });

    forNext(this.manualActivityIds(), (id) => {
      if (!removed.has(id) && !ids.includes(id)) {
        ids.push(id);
      }
    });

    return ids;
  }

  private savedLeafIds(): number[] {
    const ids: number[] = [];

    forNext(this.detailResource.value(), (detail) => {
      forNext(detail.detalles, (item) => {
        const id = item.tipoActividad?.id;
        if (id != null && !ids.includes(id)) {
          ids.push(id);
        }
      });
    });

    return ids;
  }
}
