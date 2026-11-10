import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode } from '../../../../../model/professor-activities.model';

@Component({
  selector: 'app-extension-activity',
  templateUrl: './extension-activity.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExtensionActivity {
  readonly activity = input.required<ActivityTypeNode>();
}
