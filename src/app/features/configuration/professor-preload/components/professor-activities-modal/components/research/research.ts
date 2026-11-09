import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode, activityEmptyLabel } from '../../../../model/professor-activities.model';
import { ActivityBranch } from '../activity-branch/activity-branch';

@Component({
  selector: 'app-research',
  imports: [ActivityBranch],
  templateUrl: './research.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Research {
  readonly activity = input.required<ActivityTypeNode>();
  readonly emptyLabel = activityEmptyLabel;
}
