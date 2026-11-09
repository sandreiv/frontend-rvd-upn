import { AddProfessorPayload } from './add-professor.model';

export type ContractModalityKind = 'catedra' | 'tiempoCompletoOcasional';

export interface ProfessorFieldConfig {
  key: string;
  label: string;
  control: 'number' | 'select' | 'text';
  placeholder?: string;
  readonly?: boolean;
  role?: 'categoria';
}





export function resolveWeeklyHoursLabel(
  rangoHoras: string | null | undefined,
  exceptionHours: string | null | undefined,
): string {
  const exception = String(exceptionHours ?? '').trim();
  if (exception) {
    return exception;
  }

  return rangoHoras?.trim() ?? '';
}



function resolveAssignmentField(
  field: ProfessorFieldConfig,
  kind: ContractModalityKind,
  hasIdentifiedProfessor: boolean,
  lockFechaLabor: boolean,
): ProfessorFieldConfig {
  if (field.key === 'categoriaCatedratico') {
    return resolveCategoriaField(field, kind, hasIdentifiedProfessor);
  }

  if (field.key === 'numeroPuntos' && !hasIdentifiedProfessor) {
    return { ...field, readonly: false };
  }

  if (field.key === 'fechaLabor' && lockFechaLabor) {
    return { ...field, control: 'text', readonly: true };
  }

  return field;
}

function resolveCategoriaField(
  field: ProfessorFieldConfig,
  kind: ContractModalityKind,
  hasIdentifiedProfessor: boolean,
): ProfessorFieldConfig {
  if (kind === 'catedra' && hasIdentifiedProfessor) {
    return {
      ...field,
      control: 'select',
      readonly: false,
      placeholder: 'Seleccione la categoría',
    };
  }

  if (kind === 'tiempoCompletoOcasional' && !hasIdentifiedProfessor) {
    return {
      ...field,
      control: 'select',
      readonly: false,
      placeholder: 'Seleccione la categoría',
    };
  }

  return field;
}

export function formatWorkDateRange(fechaInicio: string, fechaFin: string): string {
  return `${formatWorkDate(fechaInicio)} - ${formatWorkDate(fechaFin)}`;
}

/**
 * Detecta si el periodo universitario de la convocatoria es el
 * segundo periodo del año (ej. "2026-2").
 */
export function isSecondUniversityPeriod(
  periodoUniversidad: string | null | undefined,
): boolean {
  if (!periodoUniversidad?.trim()) {
    return false;
  }

  const periodPart = periodoUniversidad
    .trim()
    .split('-')
    .at(-1)
    ?.trim();

  return periodPart === '2';
}

export function isOnceMesesProfessor(
  onceMeses: string | null | undefined,
): boolean {
  return String(onceMeses ?? '').trim() === '1';
}

export function parseMaxWeeklyHours(rangoHoras: string | null | undefined): number | null {
  if (!rangoHoras?.trim()) {
    return null;
  }

  const parts = rangoHoras.split('-').map((part) => part.trim());
  const max = Number(parts[parts.length - 1]);

  return Number.isFinite(max) ? max : null;
}

export function parseMinWeeklyHours(
  rangoHoras: string | null | undefined,
): number | null {
  if (!rangoHoras?.trim()) {
    return null;
  }

  const parts = rangoHoras
    .split('-')
    .map((part) => part.trim());

  const min = Number(parts[0]);

  return Number.isFinite(min)
    ? min
    : null;
}

function formatWorkDate(value: string): string {
  const datePart = value.substring(0, 10);
  const [year, month, day] = datePart.split('-');

  if (!year || !month || !day) {
    return value;
  }

  return `${day}/${month}/${year}`;
}


const MS_PER_DAY = 1000 * 60 * 60 * 24;

export interface ContractValues {
  valorContrato: number;
  valorPrestaciones: number;
  totalContrato: number;
}

export function countWeeks(fechaInicio: string, fechaFin: string): number | null {
  const days = countInclusiveDays(fechaInicio, fechaFin);
  if (days <= 0) {
    return null;
  }

  return Math.ceil(days / 7);
}

/**
 * Cuenta dias de labor incluyendo fecha inicio y fecha fin,
 * igual que ValorContratacionCalculator del backend.
 */
export function countInclusiveDays(
  fechaInicio: string,
  fechaFin: string,
): number {
  const inicio = parseUtcDate(fechaInicio);
  const fin = parseUtcDate(fechaFin);
  if (inicio == null || fin == null || fin < inicio) {
    return 0;
  }

  return Math.round((fin - inicio) / MS_PER_DAY) + 1;
}

export function diffInDays(fechaInicio: string, fechaFin: string): number {
  return countInclusiveDays(fechaInicio, fechaFin);
}

function parseUtcDate(value: string): number | null {
  const datePart = value?.trim().substring(0, 10);
  if (!datePart) {
    return null;
  }

  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) {
    return null;
  }

  const utc = Date.UTC(year, month - 1, day);
  return Number.isNaN(utc) ? null : utc;
}

export function computeContractValues(
  asignacionSalarial: number,
  cantidadDias: number,
): ContractValues {
  const cesantiasRaw =
    (asignacionSalarial * cantidadDias) / 360;
  const cesantias = roundTo2(cesantiasRaw);
  const intereses = roundTo2(
    ((cesantiasRaw * cantidadDias) / 360) * 0.12,
  );
  const valorVacaciones = roundTo2(
    (asignacionSalarial * cantidadDias) / 720,
  );
  const valorContrato = roundTo2(
    (asignacionSalarial / 30) * cantidadDias,
  );
  const valorPrestaciones = roundTo2(
    cesantias + intereses + cesantias + valorVacaciones,
  );

  return {
    valorContrato,
    valorPrestaciones,
    totalContrato: roundTo2(valorContrato + valorPrestaciones),
  };
}

function roundTo2(value: number): number {
  return Math.round(value * 100) / 100;
}

const currencyFormatter = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrencyCOP(value: number | string | null): string {
  if (value == null || value === '') {
    return '';
  }

  const numeric = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(numeric)) {
    return '';
  }

  return currencyFormatter.format(numeric);
}

export type PaymentForm = 'SALARIO' | 'CATEDRA';

export interface ContractValueQuery {
  idTipoVinculacion: number;
  fechaInicio: string;
  fechaFin: string;
  asignacionSalarial?: number;
  puntos?: string;
  valorPunto?: number;
  horasSemanales?: number;
  semanas?: number;
  valorHora?: number;
}

export interface ContractValue {
  valorContrato: number | null;
  totalPrestaciones: number | null;
  totalContrato: number | null;
}

export interface ContractFormSnapshot {
  formaPago: string | null;
  idTipoVinculacion: number | null;
  fechaInicio: string;
  fechaFin: string;
  numeroPuntos: string;
  valorPunto: string;
  asignacionSalarial: string;
  semanas: string;
  horasSemanales: string;
  valorHora: string;
}

const SALARIO_ASSIGNMENT_FIELDS: ProfessorFieldConfig[] = [
  { key: 'numeroPuntos', label: 'Número de puntos', control: 'number', readonly: true },
  { key: 'valorPunto', label: 'Valor punto', control: 'text', readonly: true },
  { key: 'asignacionSalarial', label: 'Asignación salarial', control: 'text', readonly: true },
  { key: 'categoriaCatedratico', label: 'Categoría del docente', control: 'text', readonly: true },
  { key: 'fechaLabor', label: 'Fecha labor', control: 'select' },
  { key: 'semanas', label: 'Número de semanas', control: 'number', readonly: false },
  { key: 'vacaciones', label: 'Días de vacaciones', control: 'number' },
  { key: 'valorContrato', label: 'Valor del contrato', control: 'text', readonly: true },
  { key: 'valorPrestaciones', label: 'Valor prestaciones', control: 'text', readonly: true },
  { key: 'totalContrato', label: 'Total del contrato', control: 'text', readonly: false },
  { key: 'horasSemanales', label: 'Horas semanales', control: 'text', readonly: true },
];

const CATEDRA_ASSIGNMENT_FIELDS: ProfessorFieldConfig[] = [
  { key: 'categoriaCatedratico', label: 'Categoría del docente', control: 'text', readonly: true },
  { key: 'fechaLabor', label: 'Fecha labor', control: 'select' },
  { key: 'semanas', label: 'Número de semanas', control: 'number', readonly: false },
];

export interface ContractHours {
  minimo: string | null;
  maximo: string | null;
}

export function formatContractHours(
  minimo: string | null | undefined,
  maximo: string | null | undefined,
): string {
  const minimum = minimo?.trim() ?? '';
  const maximum = maximo?.trim() ?? '';

  if (!minimum) {
    return maximum;
  }

  if (!maximum) {
    return minimum;
  }

  return `${minimum} - ${maximum}`;
}

export function resolvePaymentForm(
  formaPago: string | null | undefined,
): PaymentForm | null {
  const value = formaPago?.trim().toLocaleUpperCase('es-CO') ?? '';
  if (value === 'SALARIO' || value === 'CATEDRA') {
    return value;
  }

  return null;
}

export function isPlantLinkage(esPlanta: number | null | undefined): boolean {
  return esPlanta === 1;
}

export function assignmentFieldsForPayment(
  formaPago: string | null | undefined,
  esPlanta?: number | null,
): ProfessorFieldConfig[] {
  if (isPlantLinkage(esPlanta)) {
    return [];
  }

  if (resolvePaymentForm(formaPago) === 'CATEDRA') {
    return CATEDRA_ASSIGNMENT_FIELDS;
  }

  return SALARIO_ASSIGNMENT_FIELDS;
}

export function professorFormFieldKeys(): string[] {
  return [...SALARIO_ASSIGNMENT_FIELDS, ...CATEDRA_ASSIGNMENT_FIELDS]
    .map((field) => field.key)
    .filter(
      (key, index, keys) => key !== 'fechaLabor' && keys.indexOf(key) === index,
    );
}

export function isLockedAssignmentField(key: string): boolean {
  const field = [...SALARIO_ASSIGNMENT_FIELDS, ...CATEDRA_ASSIGNMENT_FIELDS].find(
    (item) => item.key === key,
  );

  return field?.readonly === true;
}

export function parseCurrencyCOP(value: string | number | null | undefined): number | null {
  if (value == null || value === '') {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const numeric = Number(normalized);

  return Number.isFinite(numeric) ? numeric : null;
}

export function buildContractValueQuery(
  snapshot: ContractFormSnapshot,
): ContractValueQuery | null {
  const paymentForm = resolvePaymentForm(snapshot.formaPago);
  const fechaInicio = snapshot.fechaInicio.trim();
  const fechaFin = snapshot.fechaFin.trim();

  if (
    paymentForm == null ||
    snapshot.idTipoVinculacion == null ||
    !isValidDateRange(fechaInicio, fechaFin)
  ) {
    return null;
  }

  if (paymentForm === 'SALARIO') {
    return buildSalaryQuery(snapshot, fechaInicio, fechaFin);
  }

  return buildLectureQuery(snapshot, fechaInicio, fechaFin);
}

function buildSalaryQuery(
  snapshot: ContractFormSnapshot,
  fechaInicio: string,
  fechaFin: string,
): ContractValueQuery | null {
  const asignacionSalarial = parseCurrencyCOP(snapshot.asignacionSalarial);
  const valorPunto = parseCurrencyCOP(snapshot.valorPunto);
  const puntos = snapshot.numeroPuntos.trim();

  if (asignacionSalarial == null && (valorPunto == null || !puntos)) {
    return null;
  }

  return {
    idTipoVinculacion: snapshot.idTipoVinculacion as number,
    fechaInicio,
    fechaFin,
    ...(asignacionSalarial != null ? { asignacionSalarial } : {}),
    ...(valorPunto != null ? { valorPunto } : {}),
    ...(puntos ? { puntos } : {}),
  };
}

function buildLectureQuery(
  snapshot: ContractFormSnapshot,
  fechaInicio: string,
  fechaFin: string,
): ContractValueQuery | null {
  const horasSemanales = parseWeeklyHours(snapshot.horasSemanales);
  const semanas = parseDecimal(snapshot.semanas);
  const valorHora =
    parseDecimal(snapshot.valorHora) ?? parseCurrencyCOP(snapshot.valorHora);

  if (
    horasSemanales == null ||
    horasSemanales <= 0 ||
    semanas == null ||
    semanas <= 0 ||
    valorHora == null
  ) {
    return null;
  }

  return {
    idTipoVinculacion: snapshot.idTipoVinculacion as number,
    fechaInicio,
    fechaFin,
    horasSemanales,
    semanas,
    valorHora,
  };
}

function parseWeeklyHours(value: string): number | null {
  const parts = value
    .split('-')
    .map((part) => part.trim())
    .filter((part) => part.length > 0);
  const hours = parts.length > 1 ? parts[parts.length - 1] : value;

  return parseDecimal(hours ?? '');
}

function parseDecimal(value: string): number | null {
  const text = value.trim();
  if (!text) {
    return null;
  }

  const numeric = Number(text.replace(',', '.'));
  return Number.isFinite(numeric) ? numeric : null;
}

export interface AddProfessorFormSnapshot {
  plant: boolean;
  formaPago: string | null;
  idPersonaGeneral: number;
  idTipoVinculacionConvocatoria: number;
  idCategoriaCatedratico: number;
  idCoordinacion: number;
  fechaInicio: string;
  fechaFin: string;
  valorContrato: string;
  valorPrestaciones: string;
  asignacionSalarial: string;
  totalContrato: string;
  horas: string;
  valorHora: string;
  puntos: string;
  valorPunto: string;
  semanas: string;
}

export function buildAddProfessorPayload(
  snapshot: AddProfessorFormSnapshot,
): AddProfessorPayload {
  const payload: AddProfessorPayload = {
    idPersonaGeneral: snapshot.idPersonaGeneral,
    idTipoVinculacionConvocatoria: snapshot.idTipoVinculacionConvocatoria,
    idCategoriaCatedratico: snapshot.idCategoriaCatedratico,
    idCoordinacion: snapshot.idCoordinacion,
  };

  if (snapshot.plant) {
    return payload;
  }

  assignText(payload, 'fechaInicio', snapshot.fechaInicio);
  assignText(payload, 'fechaFin', snapshot.fechaFin);
  assignText(payload, 'horas', snapshot.horas);
  assignText(payload, 'semanas', snapshot.semanas);
  assignMoney(payload, 'valorContrato', snapshot.valorContrato);
  assignMoney(payload, 'valorPrestaciones', snapshot.valorPrestaciones);
  assignMoney(payload, 'totalContrato', snapshot.totalContrato);

  if (resolvePaymentForm(snapshot.formaPago) === 'CATEDRA') {
    const valorHora =
      parseDecimal(snapshot.valorHora) ?? parseCurrencyCOP(snapshot.valorHora);
    if (valorHora != null) {
      payload.valorHora = valorHora;
    }
    return payload;
  }

  assignText(payload, 'puntos', snapshot.puntos);
  assignMoney(payload, 'asignacionSalarial', snapshot.asignacionSalarial);
  assignMoney(payload, 'valorPunto', snapshot.valorPunto);
  return payload;
}

function assignText(
  payload: AddProfessorPayload,
  key: 'fechaInicio' | 'fechaFin' | 'horas' | 'puntos' | 'semanas',
  value: string,
): void {
  const text = value.trim();
  if (text) {
    payload[key] = text;
  }
}

function assignMoney(
  payload: AddProfessorPayload,
  key: 'valorContrato' | 'valorPrestaciones' | 'asignacionSalarial' | 'totalContrato' | 'valorPunto',
  value: string,
): void {
  const amount = parseCurrencyCOP(value);
  if (amount != null) {
    payload[key] = amount;
  }
}

function isValidDateRange(fechaInicio: string, fechaFin: string): boolean {
  if (!fechaInicio || !fechaFin) {
    return false;
  }

  return fechaFin > fechaInicio;
}
