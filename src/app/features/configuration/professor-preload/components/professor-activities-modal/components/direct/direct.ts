import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ActivityTypeNode, activityEmptyLabel } from '../../../../model/professor-activities.model';
import { Subject } from './components/subject/subject';
import { Support } from './components/support/support';

@Component({
  selector: 'app-direct',
  imports: [Subject, Support],
  templateUrl: './direct.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Direct {
  readonly activity = input.required<ActivityTypeNode>();
  readonly emptyLabel = activityEmptyLabel;

  componentKey(node: ActivityTypeNode): string {
    return (node.componente ?? '').trim().toUpperCase();
  }
}
