import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode, activityEmptyLabel } from '../../../../model/professor-activities.model';
import { ActivityBranch } from '../activity-branch/activity-branch';

@Component({
  selector: 'app-extension',
  imports: [ActivityBranch],
  templateUrl: './extension.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Extension {
  readonly activity = input.required<ActivityTypeNode>();
  readonly emptyLabel = activityEmptyLabel;
}
