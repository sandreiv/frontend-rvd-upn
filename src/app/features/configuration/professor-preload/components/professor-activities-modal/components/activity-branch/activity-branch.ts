import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode } from '../../../../model/professor-activities.model';

@Component({
  selector: 'app-activity-branch',
  imports: [ActivityBranch],
  templateUrl: './activity-branch.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityBranch {
  readonly nodes = input<ActivityTypeNode[]>([]);
  readonly emptyLabel = input('Sin actividades hijas para mostrar.');
}
