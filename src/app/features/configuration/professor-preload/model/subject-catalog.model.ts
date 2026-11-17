import { CoordinationCentroCosto } from './coordination.model';
import { forNext } from '../../../../core/utils/for-next.function';

/** Programa de GET /configuration/load/list-program. */
export interface ProgramItem {
  id: number;
  nombre: string | null;
  centroCosto: CoordinationCentroCosto | null;
}

/** Pensum de GET /configuration/load/list-pensum. */
export interface PensumItem {
  id: number;
  descripcion: string | null;
  anioInicio: number | null;
  periodoInicio: string | null;
  numPeriodos: number | null;
}

/** Materia de GET /configuration/load/list-subject. */
export interface SubjectItem {
  codigoMateria: string;
  nombre: string | null;
  horasPracticas: number | null;
  horasTeoricas: number | null;
  horasTeoricoPracticas: number | null;
  periodo: number | null;
  ponderacionAcademica: number | null;
  horasDirectas: number | null;
  capacidad: number | null;
  tieneGrupo: boolean | null;
  esElectiva: boolean | null;
  esCompartida: boolean | null;
  centroCosto: CoordinationCentroCosto | null;
}

/** Periodo universitario que trae el grupo. */
export interface SubjectGroupPeriod {
  id: number | null;
  anio: number | null;
  periodo: string | null;
}

/** Componente de GET /configuration/load/list-subject-components. */
export interface SubjectComponentItem {
  materia: SubjectItem | null;
  peso: number | null;
  estado: string | null;
}

/** Grupo de GET /configuration/load/list-subject-group. */
export interface SubjectGroupItem {
  id: number;
  nombre: string | null;
  capacidad: number | null;
  periodo: SubjectGroupPeriod | null;
}

/** Bloque de GET /configuration/load/list-group-schedule. */
export interface HourBlockItem {
  id: number;
  nombre: string | null;
  horaInicio: string | null;
  horaFinal: string | null;
}

/** Clase semanal de GET /configuration/load/list-group-schedule. */
export interface GroupScheduleItem {
  id: number;
  dia: number | null;
  fechaInicio: string | null;
  fechaFinal: string | null;
  bloqueInicial: HourBlockItem | null;
  bloqueFinal: HourBlockItem | null;
}

/** Materia de GET /configuration/load/list-professor-subjects. */
export interface LoadSubjectRef {
  codigoMateria: string | null;
  nombre: string | null;
  ponderacionAcademica: number | null;
}

/** Materia, programa y grupo ya guardados en la carga del docente. */
export interface ProfessorSubjectLoadItem {
  materia: LoadSubjectRef | null;
  programa: ProgramItem | null;
  grupo: SubjectGroupItem | null;
}

/** Materia de una fila de apoyo, con su grupo, horas e identificador guardado. */
export interface SupportSubjectEntry {
  nombre: string;
  grupo: string;
  horas: number | null;
  idDetalleCargaDocente: number | null;
}

/** Fila de apoyo: un programa y las materias elegidas de ese programa. */
export interface SupportProgramRow {
  idPrograma: number;
  programa: string;
  materias: SupportSubjectEntry[];
}

/** Clave de una materia dentro de un programa. */
export function professorSubjectKey(item: ProfessorSubjectLoadItem): string | null {
  const code = item.materia?.codigoMateria?.trim() ?? '';
  const programId = item.programa?.id;
  if (!code || programId == null) {
    return null;
  }

  return `${code}|${programId}`;
}

/** Agrupa la selección por programa. Cada programa queda en una sola fila. */
export function supportProgramRows(
  items: ProfessorSubjectLoadItem[],
  selected: string[],
  hoursByKey: Record<string, number | null> = {},
): SupportProgramRow[] {
  const chosen = new Set(selected);
  const rows: SupportProgramRow[] = [];
  forNext(items, (item) => {
    const key = professorSubjectKey(item);
    const programId = item.programa?.id;
    if (!key || programId == null || !chosen.has(key)) {
      return;
    }

    const name = item.materia?.nombre?.trim() || item.materia?.codigoMateria?.trim() || '';
    if (!name) {
      return;
    }

    const entry: SupportSubjectEntry = {
      nombre: name,
      grupo: item.grupo?.nombre?.trim() ?? '',
      horas: hoursByKey[key] ?? null,
      idDetalleCargaDocente: null,
    };
    const current = rows.find((row) => row.idPrograma === programId);
    if (!current) {
      rows.push({
        idPrograma: programId,
        programa: item.programa?.nombre?.trim() ?? '',
        materias: [entry],
      });
      return;
    }

    const existing = current.materias.find(
      (materia) => materia.nombre === entry.nombre && materia.grupo === entry.grupo,
    );
    if (!existing) {
      current.materias.push(entry);
      return;
    }

    if (entry.horas != null) {
      existing.horas = entry.horas;
    }
  });

  return rows;
}
