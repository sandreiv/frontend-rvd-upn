import { describe, expect, it } from 'vitest';
import {
  computeContractValues,
  countInclusiveDays,
} from './professor-form.config';

describe('countInclusiveDays', () => {
  it('cuenta inicio y fin en el rango 08/06/2026-10/11/2026', () => {
    expect(countInclusiveDays('2026-06-08', '2026-11-10')).toBe(156);
  });

  it('cuenta un dia cuando inicio y fin son iguales', () => {
    expect(countInclusiveDays('2026-06-08', '2026-06-08')).toBe(1);
  });

  it('usa solo la fecha de un ISO con hora', () => {
    expect(
      countInclusiveDays(
        '2026-06-08T05:00:00',
        '2026-11-10T05:00:00',
      ),
    ).toBe(156);
  });

  it('retorna 0 si la fecha fin es anterior al inicio', () => {
    expect(countInclusiveDays('2026-11-10', '2026-06-08')).toBe(0);
  });
});

describe('computeContractValues con dias inclusivos', () => {
  it('calcula el contrato TCO de 445 con 156 dias', () => {
    const result = computeContractValues(2_631_640, 156);

    expect(result.valorContrato).toBe(13_684_528);
    expect(result.valorPrestaciones).toBe(2_910_242.95);
    expect(result.totalContrato).toBe(16_594_770.95);
  });

  it('redondea cada prestacion a 2 decimales como en BD', () => {
    const result = computeContractValues(2_990_500, 156);

    expect(result.valorContrato).toBe(15_550_600);
    expect(result.valorPrestaciones).toBe(3_307_094.26);
    expect(result.totalContrato).toBe(18_857_694.26);
  });
});
