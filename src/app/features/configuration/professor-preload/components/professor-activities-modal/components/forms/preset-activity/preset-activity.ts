import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode } from '../../../../../model/professor-activities.model';

@Component({
  selector: 'app-preset-activity',
  templateUrl: './preset-activity.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresetActivity {
  readonly activity = input.required<ActivityTypeNode>();
}
