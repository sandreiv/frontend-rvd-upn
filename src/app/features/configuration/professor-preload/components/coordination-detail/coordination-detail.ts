import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { Button } from '../../../../../shared/ui/button/button';
import { CoordinationItem } from '../../model/coordination.model';

@Component({
  selector: 'app-coordination-detail',
  imports: [Button],
  templateUrl: './coordination-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinationDetail {
  coordination = input.required<CoordinationItem>();

  back = output<void>();
}
