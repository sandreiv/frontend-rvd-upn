import { forNext } from '../../../../core/utils/for-next.function';
import { CoordinationCentroCosto } from './coordination.model';
import { GroupScheduleItem } from './subject-catalog.model';

/** Tipo de actividad de GET /configuration/load/list-detail-professor-load. */
export interface ProfessorLoadActivityType {
  id: number;
  idPadre: number | null;
  nombre: string | null;
  descripcion: string | null;
  orden: string | null;
  codigo: string | null;
  componente: string | null;
}

/** Unidad regional que trae el detalle de carga. */
export interface ProfessorLoadUnit {
  id: number;
  nombre: string | null;
}

/** Programa que trae el detalle de carga. */
export interface ProfessorLoadProgram {
  id: number;
  nombre: string | null;
  centroCosto: CoordinationCentroCosto | null;
}

/** Pensum del programa que contiene la materia. */
export interface ProfessorLoadPensum {
  id: number;
  descripcion: string | null;
  anioInicio: number | null;
  periodoInicio: string | null;
  numPeriodos: number | null;
}

/** Materia que trae el detalle de carga. */
export interface ProfessorLoadSubject {
  codigoMateria: string | null;
  nombre: string | null;
  ponderacionAcademica: number | null;
}

/** Periodo del grupo dentro del detalle de carga. */
export interface ProfessorLoadGroupPeriod {
  id: number | null;
  anio: number | null;
  periodo: string | null;
}

/** Grupo que trae el detalle de carga. */
export interface ProfessorLoadGroup {
  id: number;
  nombre: string | null;
  capacidad: number | null;
  periodo: ProfessorLoadGroupPeriod | null;
}

/** Centro de costo que trae el detalle de carga. */
export interface ProfessorLoadCostCenter {
  id: number;
  descripcion: string | null;
}

/** Actividad guardada dentro de un detalle de carga. */
export interface ProfessorLoadDetailActivity {
  tipoActividad: ProfessorLoadActivityType | null;
  unidadRegional: ProfessorLoadUnit | null;
  programa: ProfessorLoadProgram | null;
  materia: ProfessorLoadSubject | null;
  pensum: ProfessorLoadPensum | null;
  grupo: ProfessorLoadGroup | null;
  centroCosto: ProfessorLoadCostCenter | null;
  horas: string | null;
  materiaBanco: ProfessorLoadSubject | null;
  extras: string | null;
  descripcion: string | null;
  clasesSemanales: GroupScheduleItem[] | null;
  termino: ProfessorLoadTerm | null;
  actoAdministrativo: ProfessorLoadAdministrativeAct | null;
}

/** Término devuelto por list-detail-professor-load. Llega nulo si no se guardó. */
export interface ProfessorLoadTerm {
  desde: string | null;
  hasta: string | null;
}

/** Acto administrativo devuelto por list-detail-professor-load. Llega nulo si no se guardó. */
export interface ProfessorLoadAdministrativeAct {
  numero: string | number | null;
  fecha: string | null;
}

/** Ítem de GET /configuration/load/list-detail-professor-load. */
export interface ProfessorLoadDetailItem {
  idDetalleCargaDocente: number;
  idCargaDocente: number;
  detalles: ProfessorLoadDetailActivity[];
}

/** Fila guardada de una actividad con dependencia: nombre, descripción y horas. */
export interface SavedDependentActivityRow {
  id: string;
  idDetalleCargaDocente: number;
  nombre: string;
  descripcion: string;
  horas: string;
}

/** Detalles de carga cuyo tipo de actividad está en el conjunto indicado. */
export function savedDependentActivities(
  details: ProfessorLoadDetailItem[] | null | undefined,
  activityIds: Set<number>,
): SavedDependentActivityRow[] {
  const rows: SavedDependentActivityRow[] = [];

  forNext(details, (detail) => {
    forNext(detail.detalles, (item, index) => {
      const activityId = item.tipoActividad?.id;
      if (activityId == null || !activityIds.has(activityId)) {
        return;
      }

      rows.push({
        id: `${detail.idDetalleCargaDocente}-${index}`,
        idDetalleCargaDocente: detail.idDetalleCargaDocente,
        nombre: item.tipoActividad?.nombre?.trim() || 'Actividad',
        descripcion: item.descripcion?.trim() || '-',
        horas: item.horas?.trim() || '-',
      });
    });
  });

  return rows;
}

/** Término y acto administrativo guardados en DECD_DATA. */
export interface AdministrativeSituationData {
  termino: {
    desde: string;
    hasta: string;
  };
  actoAdministrativo: {
    numero: string;
    fecha: string;
  };
}

/** Fila guardada de una situación administrativa. */
export interface SavedAdministrativeActivityRow {
  id: string;
  idDetalleCargaDocente: number;
  nombre: string;
  terminoDesde: string | null;
  terminoHasta: string | null;
  actoNumero: string | null;
  actoFecha: string | null;
  horas: string;
}

/** Detalles de situación administrativa, con el término y el acto del listado. */
export function savedAdministrativeActivities(
  details: ProfessorLoadDetailItem[] | null | undefined,
  activityIds: Set<number>,
): SavedAdministrativeActivityRow[] {
  const rows: SavedAdministrativeActivityRow[] = [];

  forNext(details, (detail) => {
    forNext(detail.detalles, (item, index) => {
      const activityId = item.tipoActividad?.id;
      if (activityId == null || !activityIds.has(activityId)) {
        return;
      }

      rows.push({
        id: `${detail.idDetalleCargaDocente}-${index}`,
        idDetalleCargaDocente: detail.idDetalleCargaDocente,
        nombre: item.tipoActividad?.nombre?.trim() || 'Situación administrativa',
        terminoDesde: displayDate(item.termino?.desde),
        terminoHasta: displayDate(item.termino?.hasta),
        actoNumero: displayText(item.actoAdministrativo?.numero),
        actoFecha: displayDate(item.actoAdministrativo?.fecha),
        horas: item.horas?.trim() || '-',
      });
    });
  });

  return rows;
}

/** Arma el JSON de término y acto administrativo para DECD_DATA. */
export function administrativeSituationData(value: {
  desde: string;
  hasta: string;
  numero: string;
  fecha: string;
}): string | null {
  const desde = value.desde.trim();
  const hasta = value.hasta.trim();
  const numero = value.numero.trim();
  const fecha = value.fecha.trim();
  const data: Partial<AdministrativeSituationData> = {};

  if (desde || hasta) {
    data.termino = { desde, hasta };
  }
  if (numero || fecha) {
    data.actoAdministrativo = { numero, fecha };
  }
  if (!data.termino && !data.actoAdministrativo) {
    return null;
  }

  return JSON.stringify(data);
}

function displayDate(value: string | null | undefined): string | null {
  const formatted = formatStoredDate(value);
  return formatted === '-' ? null : formatted;
}

function displayText(value: string | number | null | undefined): string | null {
  if (value == null) {
    return null;
  }

  const text = String(value).trim();
  return text || null;
}

function formatStoredDate(value: string | null | undefined): string {
  const text = value?.trim() ?? '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) {
    return text || '-';
  }

  return `${match[3]}/${match[2]}/${match[1]}`;
}

/** Fila de la tabla de asignaturas, venga del formulario o del detalle guardado. */
export interface SubjectActivityRow {
  id: string;
  idDetalleCargaDocente: number | null;
  programa: string;
  pensum: string;
  materia: string;
  componente: string;
  grupo: string;
  creditos: number | null;
  cupoMaximo: number | null;
  horasTotales: number | null;
  horasExtras: boolean;
  esCompartida: boolean;
  horarioTooltip: string;
}

/** Filas de asignatura que pertenecen a la hoja indicada. */
export function subjectRowsFromLoadDetails(
  details: ProfessorLoadDetailItem[] | null | undefined,
  activityId: number,
): SubjectActivityRow[] {
  const rows: SubjectActivityRow[] = [];

  forNext(details, (detail) => {
    forNext(detail.detalles, (item, index) => {
      if (item.tipoActividad?.id !== activityId) {
        return;
      }

      rows.push(toSubjectRow(detail.idDetalleCargaDocente, index, item));
    });
  });

  return rows;
}

function toSubjectRow(
  idDetalleCargaDocente: number,
  index: number,
  item: ProfessorLoadDetailActivity,
): SubjectActivityRow {
  return {
    id: `${idDetalleCargaDocente}-${index}`,
    idDetalleCargaDocente,
    programa: item.programa?.nombre?.trim() ?? '',
    pensum: item.pensum?.descripcion?.trim() ?? '',
    materia: subjectName(item),
    componente: componentName(item),
    grupo: groupLabel(item.grupo),
    creditos: credits(item),
    cupoMaximo: item.grupo?.capacidad ?? null,
    horasTotales: toHours(item.horas),
    horasExtras: item.extras?.trim() === '1',
    esCompartida: (item.clasesSemanales?.length ?? 0) > 0,
    horarioTooltip: scheduleTooltip(item.clasesSemanales),
  };
}

function credits(item: ProfessorLoadDetailActivity): number | null {
  const bank = item.materiaBanco?.nombre?.trim() ?? '';
  const subject = bank ? item.materiaBanco : item.materia;
  return subject?.ponderacionAcademica ?? null;
}

function subjectName(item: ProfessorLoadDetailActivity): string {
  const bank = item.materiaBanco?.nombre?.trim() ?? '';
  if (bank) {
    return bank;
  }

  return item.materia?.nombre?.trim() ?? '';
}

function componentName(item: ProfessorLoadDetailActivity): string {
  const bank = item.materiaBanco?.nombre?.trim() ?? '';
  if (!bank) {
    return '';
  }

  return item.materia?.nombre?.trim() ?? '';
}

function groupLabel(group: ProfessorLoadGroup | null): string {
  const nombre = group?.nombre?.trim() ?? '';
  if (!nombre) {
    return '';
  }

  const anio = group?.periodo?.anio;
  const periodo = group?.periodo?.periodo?.trim() ?? '';
  if (anio == null && !periodo) {
    return nombre;
  }

  return `${nombre} - ${anio ?? ''} - ${periodo}`;
}

/**
 * Suma las horas de cada tipo de actividad guardado en el detalle de carga.
 * Varias filas del mismo tipo se acumulan antes de entrar al total.
 */
export function sumAssignedHours(
  details: ProfessorLoadDetailItem[] | null | undefined,
): number {
  const byType = new Map<number, number>();
  let withoutType = 0;

  forNext(details, (detail) => {
    forNext(detail.detalles, (item) => {
      const hours = toHours(item.horas);
      if (hours == null) {
        return;
      }

      const typeId = item.tipoActividad?.id;
      if (typeId == null) {
        withoutType = roundHours(withoutType + hours);
        return;
      }

      const current = byType.get(typeId) ?? 0;
      byType.set(typeId, roundHours(current + hours));
    });
  });

  let total = withoutType;
  forNext([...byType.values()], (hours) => {
    total = roundHours(total + hours);
  });

  return total;
}

function roundHours(value: number): number {
  return Math.round(value * 100) / 100;
}

function toHours(horas: string | null | undefined): number | null {
  if (horas == null || !horas.trim()) {
    return null;
  }

  const value = Number(horas.trim().replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

export function scheduleTooltip(classes: GroupScheduleItem[] | null | undefined): string {
  const blocks: string[] = [];
  forNext(classes, (item) => {
    const day = dayName(item.dia);
    const from = formatHour(item.bloqueInicial?.horaInicio);
    const to = formatHour(item.bloqueFinal?.horaFinal);
    const hours = from && to ? `${from} - ${to}` : from || to;
    const text = [day, hours].filter((part) => part).join(' · ');
    if (!text) {
      return;
    }

    const gap = blocks.length > 0 ? ' style="margin-top:0.35rem"' : '';
    blocks.push(`<p${gap}>${escapeHtml(text)}</p>`);
  });

  return blocks.join('');
}

function dayName(day: number | null): string {
  const names = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  if (day == null || day < 1 || day > 7) {
    return '';
  }

  return names[day];
}

function formatHour(value: string | null | undefined): string {
  const raw = value?.trim() ?? '';
  if (!raw || raw.includes(':')) {
    return raw;
  }
  if (!/^\d{3,4}$/.test(raw)) {
    return raw;
  }

  const padded = raw.padStart(4, '0');
  return `${padded.slice(0, 2)}:${padded.slice(2)}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}
