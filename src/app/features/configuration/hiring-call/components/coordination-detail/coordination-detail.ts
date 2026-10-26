import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { Button } from '../../../../../shared/ui/button/button';
import { CoordinationItem } from '../../../professor-preload/model/coordination.model';
import { HiringContractModalityDetail } from '../hiring-contract-modality-detail/hiring-contract-modality-detail';

@Component({
  selector: 'app-hiring-coordination-detail',
  imports: [Button, HiringContractModalityDetail],
  templateUrl: './coordination-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinationDetail {
  readonly coordination = input.required<CoordinationItem>();
  readonly back = output<void>();
}
