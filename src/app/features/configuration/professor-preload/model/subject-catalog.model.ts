import { CoordinationCentroCosto } from './coordination.model';

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
