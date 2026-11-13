import { forNext } from '../../../../core/utils/for-next.function';
import { CoordinationCentroCosto } from './coordination.model';

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
}

/** Ítem de GET /configuration/load/list-detail-professor-load. */
export interface ProfessorLoadDetailItem {
  idDetalleCargaDocente: number;
  idCargaDocente: number;
  detalles: ProfessorLoadDetailActivity[];
}

/** Fila de la tabla de asignaturas, venga del formulario o del detalle guardado. */
export interface SubjectActivityRow {
  id: string;
  programa: string;
  pensum: string;
  materia: string;
  componente: string;
  grupo: string;
  creditos: number | null;
  cupoMaximo: number | null;
  horasTotales: number | null;
  horasExtras: boolean;
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
    programa: item.programa?.nombre?.trim() ?? '',
    pensum: item.pensum?.descripcion?.trim() ?? '',
    materia: subjectName(item),
    componente: componentName(item),
    grupo: groupLabel(item.grupo),
    creditos: credits(item),
    cupoMaximo: item.grupo?.capacidad ?? null,
    horasTotales: toHours(item.horas),
    horasExtras: item.extras?.trim() === '1',
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

function toHours(horas: string | null | undefined): number | null {
  if (horas == null || !horas.trim()) {
    return null;
  }

  const value = Number(horas.trim().replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}
