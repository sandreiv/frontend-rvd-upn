import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AlterationContractModalityDetail } from '../alteration-contract-modality-detail/alteration-contract-modality-detail';
import { CoordinationItem } from '../../../../model/coordination.model';
import { formatCurrencyCOP } from '../../../../model/professor-form.config';
import { CoordinationService } from '../../../../data/coordination.service';
import { Button } from '../../../../../../../shared/ui/button/button';
import { NoveltyBudgetStore } from '../alteration-professor-novelties/novelty-budget.store';

@Component({
  selector: 'app-alteration-detail',
  imports: [AlterationContractModalityDetail, Button],
  providers: [NoveltyBudgetStore],
  templateUrl: './alteration-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlterationDetail {
  private readonly coordinationService = inject(CoordinationService);
  readonly budgetStore = inject(NoveltyBudgetStore);

  readonly coordination = input.required<CoordinationItem>();
  readonly back = output<void>();
  readonly valorChange = output<number | null>();

  readonly valorCarga = computed(
    () => formatCurrencyCOP(this.budgetStore.valorProyectado()) || '-',
  );

  readonly valorAutorizado = computed(() => {
    const autorizado = this.budgetStore.valorAutorizado();
    if (autorizado != null) {
      return formatCurrencyCOP(autorizado) || '-';
    }
    return formatCurrencyCOP(this.coordination().valorAutorizado) || '-';
  });

  readonly excedePresupuesto = computed(() => this.budgetStore.excede());

  constructor() {
    effect(() => {
      const idCarga = this.coordination().idCarga;
      untracked(() => void this.loadBudget(idCarga));
    });
    effect(() => {
      const draft = this.budgetStore.draft();
      const valor = this.budgetStore.budget()?.valorCarga ?? null;
      if (draft == null) {
        untracked(() => this.valorChange.emit(valor));
      }
    });
  }

  private async loadBudget(idCarga: number | null): Promise<void> {
    if (idCarga == null) {
      this.budgetStore.setBudget(null);
      this.valorChange.emit(null);
      return;
    }
    try {
      const budget = await firstValueFrom(
        this.coordinationService.getCargaBudget(idCarga),
      );
      this.budgetStore.setBudget(budget);
    } catch (error) {
      console.error(error);
    }
  }
}
