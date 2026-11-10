import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { CoordinationService } from '../../data/coordination.service';
import { LinkageTypeItem } from '../../model/linkage-type.model';
import { ProfessorLoadItem, professorLoadDisplayName } from '../../model/professor-load.model';
import {
  ActivityRestrictionItem,
  ActivityTypeNode,
  visibleActivityTree,
} from '../../model/professor-activities.model';
import { ActivityTree } from './components/activity-tree/activity-tree';

interface ActivityCatalog {
  activities: ActivityTypeNode[];
  restrictions: ActivityRestrictionItem[];
}

const EMPTY_CATALOG: ActivityCatalog = {
  activities: [],
  restrictions: [],
};

@Component({
  selector: 'app-professor-activities-modal',
  imports: [Modal, Button, Icon, ActivityTree],
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
  readonly close = output<void>();

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

  readonly professorDisplayName = computed(() => {
    const professor = this.professor();
    return professor ? professorLoadDisplayName(professor) : 'NN';
  });

  readonly linkageText = computed(() => this.linkageLabel().trim() || '-');

  readonly coordinationText = computed(() => this.coordinationLabel().trim() || '-');

  readonly isLoadingActivities = computed(() => this.activitiesResource.isLoading());

  readonly activitiesError = computed(() => this.activitiesResource.error());

  readonly visibleActivities = computed(() => {
    const catalog = this.activitiesResource.value();
    return visibleActivityTree(catalog.activities, catalog.restrictions);
  });
}
