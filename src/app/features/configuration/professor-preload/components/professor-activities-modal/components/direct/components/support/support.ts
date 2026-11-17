import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode } from '../../../../../../model/professor-activities.model';

@Component({
  selector: 'app-support',
  templateUrl: './support.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Support {
  readonly activity = input.required<ActivityTypeNode>();
}
