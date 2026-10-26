import { describe, expect, it } from 'vitest';
import {
  computeProfessorContractTotal,
  isCatedraFormaPago,
  sumDetalleHours,
} from './professor-contract-value';

describe('isCatedraFormaPago', () => {
  it('reconoce CATEDRA de la restriccion de carga', () => {
    expect(isCatedraFormaPago('CATEDRA')).toBe(true);
    expect(isCatedraFormaPago('catedra')).toBe(true);
    expect(isCatedraFormaPago('SALARIO')).toBe(false);
    expect(isCatedraFormaPago(null)).toBe(false);
  });
});

describe('computeProfessorContractTotal', () => {
  it('calcula TCO cuando formaPago no es CATEDRA', () => {
    const total = computeProfessorContractTotal({
      formaPago: 'SALARIO',
      fechaInicio: '2026-06-08',
      fechaFin: '2026-11-10',
      asignacionSalarial: 2_631_640,
    });

    expect(total).toBe(16_594_770.95);
  });

  it('calcula catedra cuando formaPago es CATEDRA', () => {
    const total = computeProfessorContractTotal({
      formaPago: 'CATEDRA',
      horasActividades: 8,
      semanas: 16,
      valorHora: 50_000,
    });

    expect(total).toBe(6_400_000);
  });

});

describe('sumDetalleHours', () => {
  it('suma horas de los detalles del borrador', () => {
    expect(
      sumDetalleHours([{ horas: 4 }, { horas: 2 }, { horas: 2 }]),
    ).toBe(8);
  });
});
