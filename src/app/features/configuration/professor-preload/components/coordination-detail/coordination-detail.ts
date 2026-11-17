import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { Button } from '../../../../../shared/ui/button/button';
import { CoordinationItem } from '../../model/coordination.model';
import { LinkageType } from '../linkage-type/linkage-type';
import { CoordinationSummary } from '../coordination-summary/coordination-summary';
import { TotalCoordination } from '../total-coordination/total-coordination';

@Component({
  selector: 'app-coordination-detail',
  imports: [Button, LinkageType, CoordinationSummary, TotalCoordination],
  templateUrl: './coordination-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinationDetail {
  coordination = input.required<CoordinationItem>();

  back = output<void>();
}
