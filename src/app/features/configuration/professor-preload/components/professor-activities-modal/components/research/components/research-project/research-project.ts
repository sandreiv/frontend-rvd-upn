import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode } from '../../../../../../model/professor-activities.model';

@Component({
  selector: 'app-research-project',
  templateUrl: './research-project.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchProject {
  readonly activity = input.required<ActivityTypeNode>();
}
