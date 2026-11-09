import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode, activityEmptyLabel } from '../../../../model/professor-activities.model';
import { ActivityBranch } from '../activity-branch/activity-branch';

@Component({
  selector: 'app-management',
  imports: [ActivityBranch],
  templateUrl: './management.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Management {
  readonly activity = input.required<ActivityTypeNode>();
  readonly emptyLabel = activityEmptyLabel;
}
