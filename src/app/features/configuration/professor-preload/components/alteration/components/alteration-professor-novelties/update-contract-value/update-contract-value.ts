import { ChangeDetectionStrategy, Component, effect, inject, input } from '@angular/core';
import { Icon } from '../../../../../../../../shared/ui/icon/icon';
import { NoveltyComponentState } from '../novelty-component-state';
import { CoordinationContractModality } from '../../../../../model/coordination.model';

@Component({
  selector: 'app-update-contract-value',
  imports: [Icon],
  templateUrl: './update-contract-value.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateContractValue {
  private readonly noveltyState = inject(NoveltyComponentState);

  contractModality = input<CoordinationContractModality | null>(null);

  constructor() {
    effect(() => {
      if (this.contractModality()?.nombre === 'Tiempo completo ocasional') {
        this.noveltyState.setUpdateContractValue();
      }
    })
  }
}
