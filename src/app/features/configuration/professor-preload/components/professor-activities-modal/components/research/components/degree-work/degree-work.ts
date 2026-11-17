import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode } from '../../../../../../model/professor-activities.model';

@Component({
  selector: 'app-degree-work',
  templateUrl: './degree-work.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DegreeWork {
  readonly activity = input.required<ActivityTypeNode>();
}
