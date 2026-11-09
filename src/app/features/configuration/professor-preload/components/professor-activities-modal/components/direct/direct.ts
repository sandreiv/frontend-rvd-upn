import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode, activityEmptyLabel } from '../../../../model/professor-activities.model';
import { ActivityBranch } from '../activity-branch/activity-branch';

@Component({
  selector: 'app-direct',
  imports: [ActivityBranch],
  templateUrl: './direct.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Direct {
  readonly activity = input.required<ActivityTypeNode>();
  readonly emptyLabel = activityEmptyLabel;
}
