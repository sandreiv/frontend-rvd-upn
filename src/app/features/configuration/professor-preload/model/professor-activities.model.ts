import { CoordinationCentroCosto } from './coordination.model';

export type ActivityFormType = 'direct' | 'criteria' | 'project';

export interface TipoActividad {
  id: number;
  idPadre: number | null;
  nombre: string;
  descripcion: string;
  orden: string;
  codigo: string;
  componente?: ActivityFormType | string | null;
}

export interface TipoActividadModalidad {
  id: number;
  nombre: string;
  codigo: string;
  estado: string;
  componente: ActivityFormType | string;
}

export interface ActividadModalidadDTO {
  idModalidadContratacion: number;
  tipoActividades: TipoActividadModalidad[];
}

export interface TipoActividadCriterio {
  id: number;
  nombre: string;
  descripcion: string;
  minimoHoras: string;
  maximoHoras: string;
}

export interface UnidadRegional {
  id: number;
  nombre: string;
}

export interface ProgramaAcademico {
  id: number;
  nombre: string;
}

export interface MateriaAcademica {
  codigoMateria: string;
  nombre: string;
  horasPracticas: number;
  horasTeoricas: number;
  horasTeoricoPracticas: number | null;
  periodo: number;
  ponderacionAcademica: number;
  horasDirectas: number;
  capacidad: number | null;
  tieneGrupo: boolean;
  centroCosto?: CoordinationCentroCosto | null;
}

export interface GrupoMateria {
  id: number;
  nombre: string;
  capacidad: number;
}

export interface ProgramHourRestriction {
  idPrograma: number;
  maximoHoras: string;
  horasAsignadas: number;
  horasDisponibles: number;
}
