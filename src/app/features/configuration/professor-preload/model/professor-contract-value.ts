import { forNext } from '../../../../core/utils/for-next.function';
import {
  computeContractValues,
  countInclusiveDays,
} from './professor-form.config';

export interface ProfessorContractValueInput {
  formaPago?: string | null;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  asignacionSalarial?: number | null;
  valorHora?: number | null;
  semanas?: number | string | null;
  horasActividades?: number | null;
}

/**
 * Misma regla que ValorContratacionCalculator.isCatedra:
 * RESTRICCIONCARGA.RECA_FORMAPAGO = CATEDRA.
 */
export function isCatedraFormaPago(
  formaPago: string | null | undefined,
): boolean {
  return (formaPago ?? '').trim().toUpperCase() === 'CATEDRA';
}

/**
 * Total del contrato alineado con CargaBudgetService:
 * CATEDRA horas x valorHora x semanas, resto TCO.
 * La carga de planta llega con valor nulo y no entra a este cálculo.
 */
export function computeProfessorContractTotal(
  input: ProfessorContractValueInput,
): number {
  if (isCatedraFormaPago(input.formaPago)) {
    return computeCatedraTotal(input);
  }
  return computeTcoTotal(input);
}

export function sumDetalleHours(
  detalles: { horas?: number | null }[] | null | undefined,
): number {
  let total = 0;
  forNext(detalles, (item) => {
    const horas = Number(item.horas);
    if (Number.isFinite(horas)) {
      total += horas;
    }
  });
  return total;
}

function computeCatedraTotal(
  input: ProfessorContractValueInput,
): number {
  const hours = Number(input.horasActividades);
  const weeks = Number(input.semanas);
  const valorHora = Number(input.valorHora);
  if (
    !Number.isFinite(hours) ||
    !Number.isFinite(weeks) ||
    !Number.isFinite(valorHora)
  ) {
    return 0;
  }
  return roundTo2(hours * weeks * valorHora);
}

function computeTcoTotal(
  input: ProfessorContractValueInput,
): number {
  const asignacion = Number(input.asignacionSalarial);
  if (
    !Number.isFinite(asignacion) ||
    !input.fechaInicio ||
    !input.fechaFin
  ) {
    return 0;
  }
  const days = countInclusiveDays(
    input.fechaInicio,
    input.fechaFin,
  );
  return computeContractValues(asignacion, days).totalContrato;
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}
