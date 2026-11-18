import { forNext } from '../../../../core/utils/for-next.function';
import { formatSentenceValue } from '../../../../shared/utils/normalized-text.util';

/** Tipo de actividad que trae el proyecto de la persona. */
export interface ProfessorProjectActivity {
  id: number;
  idPadre: number | null;
  nombre: string | null;
  descripcion: string | null;
  orden: string | null;
  codigo: string | null;
  componente: string | null;
}

/** Proyecto de GET /configuration/load/list-professor-projects. */
export interface ProfessorProjectRef {
  id: number;
  idProyectoPadre: number | null;
  tipoActividad: ProfessorProjectActivity | null;
  idCoordinacion: number | null;
  idMateriaParticular: number | null;
  idProyectoGrupo: number | null;
  nombre: string | null;
  descripcion: string | null;
  actaConsejo: string | null;
  numeroActa: string | null;
  fechaActa: string | null;
  codigo: string | null;
  activo: number | null;
}

/** Bloque de horario guardado en el proyecto de la persona. */
export interface ProfessorProjectSchedule {
  dia: string | null;
  horaInicio: string | null;
  horaFin: string | null;
}

/** Ítem de GET /configuration/load/list-professor-projects. */
export interface ProfessorProjectItem {
  id: number;
  idPersonaGeneral: number | null;
  idPrograma: number | null;
  idCentroCosto: number | null;
  horas: string | null;
  observacion: string | null;
  proyecto: ProfessorProjectRef | null;
  funcion: string | null;
  nivel: string | null;
  horario: ProfessorProjectSchedule[] | null;
}

/** Dato extra que pinta la tabla según el componente del tipo de actividad. */
export type ProjectExtraField = 'funcion' | 'nivel' | 'horario';

const FUNCTION_LABELS: Record<string, string> = {
  INVESTIGADOR_PRINCIPAL: 'Investigador principal',
  COINVESTIGADOR: 'Coinvestigador',
  ASESOR: 'Asesor o asistente de investigación',
};

const LEVEL_LABELS: Record<string, string> = {
  PREGRADO: 'Pregrado',
  ESPECIALIZACION: 'Especialización',
  MAESTRIA: 'Maestría',
  DOCTORADO: 'Doctorado',
  POSDOCTORADO: 'Posdoctorado',
};

const DAY_LABELS: Record<string, string> = {
  '1': 'Lunes',
  '2': 'Martes',
  '3': 'Miércoles',
  '4': 'Jueves',
  '5': 'Viernes',
  '6': 'Sábado',
  '7': 'Domingo',
  LUNES: 'Lunes',
  MARTES: 'Martes',
  MIERCOLES: 'Miércoles',
  JUEVES: 'Jueves',
  VIERNES: 'Viernes',
  SABADO: 'Sábado',
  DOMINGO: 'Domingo',
};

/** Proyectos cuyo tipo de actividad es la hoja indicada. */
export function projectsForActivity(
  projects: ProfessorProjectItem[] | null | undefined,
  activityId: number,
): ProfessorProjectItem[] {
  const rows: ProfessorProjectItem[] = [];

  forNext(projects, (item) => {
    if (item.proyecto?.tipoActividad?.id === activityId) {
      rows.push(item);
    }
  });

  return rows;
}

/** Identificadores de tipo de actividad presentes en los proyectos. */
export function projectActivityIds(
  projects: ProfessorProjectItem[] | null | undefined,
): number[] {
  const ids: number[] = [];

  forNext(projects, (item) => {
    const id = item.proyecto?.tipoActividad?.id;
    if (id != null && !ids.includes(id)) {
      ids.push(id);
    }
  });

  return ids;
}

/** Etiqueta de la función del participante. */
export function projectFunctionLabel(value: string | null | undefined): string {
  return enumLabel(value, FUNCTION_LABELS);
}

/** Etiqueta del nivel del trabajo de grado. */
export function projectLevelLabel(value: string | null | undefined): string {
  return enumLabel(value, LEVEL_LABELS);
}

/** Líneas de horario: día y rango de hora. */
export function projectScheduleLines(
  blocks: ProfessorProjectSchedule[] | null | undefined,
): string[] {
  const lines: string[] = [];

  forNext(blocks, (block) => {
    const day = dayLabel(block.dia);
    const from = formatHour(block.horaInicio);
    const to = formatHour(block.horaFin);
    const hours = from && to ? `${from} - ${to}` : from || to;
    const text = [day, hours].filter((part) => part).join(' · ');
    if (text) {
      lines.push(text);
    }
  });

  return lines;
}

function enumLabel(value: string | null | undefined, labels: Record<string, string>): string {
  const key = value?.trim().toUpperCase() ?? '';
  if (!key) {
    return '-';
  }

  return labels[key] ?? formatSentenceValue(key.replaceAll('_', ' '));
}

function dayLabel(value: string | null | undefined): string {
  const key = value?.trim().toUpperCase() ?? '';
  if (!key) {
    return '';
  }

  return DAY_LABELS[key] ?? formatSentenceValue(key);
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
