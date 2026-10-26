import { computed, Injectable, signal } from '@angular/core';
import { forNext } from '../../../../../../../core/utils/for-next.function';
import {
  CargaBudget,
  NoveltyBudgetDraft,
} from '../../../../model/carga-budget.model';

@Injectable()
export class NoveltyBudgetStore {
  readonly budget = signal<CargaBudget | null>(null);
  readonly draft = signal<NoveltyBudgetDraft | null>(null);

  readonly valorCargaEfectivo = computed(
    () => this.budget()?.valorCarga ?? 0,
  );

  readonly valorAutorizado = computed(
    () => this.budget()?.valorAutorizado ?? null,
  );

  readonly valorProyectado = computed(() => {
    const draft = this.draft();
    const suma = this.valorCargaEfectivo();
    if (draft == null) {
      return suma;
    }
    return suma - draft.totalAnterior + draft.totalNuevo;
  });

  readonly excede = computed(() => {
    const autorizado = this.valorAutorizado();
    if (autorizado == null) {
      return false;
    }
    return this.valorProyectado() > autorizado;
  });

  totalAnteriorOf(idCargaDocente: number): number {
    let found = 0;
    forNext(this.budget()?.docentes, (item) => {
      if (item.idCargaDocente === idCargaDocente) {
        found = item.totalContrato;
      }
    });
    return found;
  }

  setBudget(budget: CargaBudget | null): void {
    this.budget.set(budget);
  }

  setDraft(draft: NoveltyBudgetDraft): void {
    this.draft.set(draft);
  }

  clearDraft(): void {
    this.draft.set(null);
  }
}
