import { describe, expect, it } from 'vitest';
import { NoveltyBudgetStore } from './novelty-budget.store';

describe('NoveltyBudgetStore', () => {
  it('proyecta valorCarga menos anterior mas nuevo', () => {
    const store = new NoveltyBudgetStore();
    store.setBudget({
      valorCarga: 22_994_770.95,
      valorAutorizado: 30_000_000,
      docentes: [
        { idCargaDocente: 101, totalContrato: 16_594_770.95 },
        { idCargaDocente: 102, totalContrato: 6_400_000 },
      ],
    });
    store.setDraft({
      idCargaDocente: 101,
      totalAnterior: 16_594_770.95,
      totalNuevo: 6_400_000,
    });

    expect(store.valorProyectado()).toBe(12_800_000);
    expect(store.excede()).toBe(false);
  });

  it('marca excede cuando el proyectado supera el autorizado', () => {
    const store = new NoveltyBudgetStore();
    store.setBudget({
      valorCarga: 16_594_770.95,
      valorAutorizado: 1_000_000,
      docentes: [
        { idCargaDocente: 101, totalContrato: 16_594_770.95 },
      ],
    });
    store.setDraft({
      idCargaDocente: 101,
      totalAnterior: 16_594_770.95,
      totalNuevo: 6_400_000,
    });

    expect(store.excede()).toBe(true);
  });
});
