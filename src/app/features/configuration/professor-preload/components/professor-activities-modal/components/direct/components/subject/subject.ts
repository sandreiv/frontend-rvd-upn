import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode } from '../../../../../../model/professor-activities.model';

@Component({
  selector: 'app-subject',
  imports: [Subject],
  templateUrl: './subject.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subject {
  readonly activity = input.required<ActivityTypeNode>();
}
