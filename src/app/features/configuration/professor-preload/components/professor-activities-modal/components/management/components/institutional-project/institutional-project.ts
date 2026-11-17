import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode } from '../../../../../../model/professor-activities.model';

@Component({
  selector: 'app-institutional-project',
  templateUrl: './institutional-project.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstitutionalProject {
  readonly activity = input.required<ActivityTypeNode>();
}
