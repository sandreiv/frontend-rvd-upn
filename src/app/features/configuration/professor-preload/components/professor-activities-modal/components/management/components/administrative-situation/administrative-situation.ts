import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode } from '../../../../../../model/professor-activities.model';

@Component({
  selector: 'app-administrative-situation',
  templateUrl: './administrative-situation.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdministrativeSituation {
  readonly activity = input.required<ActivityTypeNode>();
}
