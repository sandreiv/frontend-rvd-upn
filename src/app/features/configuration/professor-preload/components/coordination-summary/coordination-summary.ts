import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CoordinationItem } from '../../model/coordination.model';

@Component({
  selector: 'app-coordination-summary',
  imports: [],
  templateUrl: './coordination-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinationSummary {

  coordination = input.required<CoordinationItem>();
}
