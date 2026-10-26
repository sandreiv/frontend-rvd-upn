export interface TipoProyectoDto {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
}

export interface TipoActividadProyectoDto {
  id: number;
  idPadre: number | null;
  nombre: string;
  descripcion: string;
  orden: string;
  codigo: string;
}

export interface PersonaProyectoDto {
  id: number;
  idPersonaGeneral: number;
  tipoActividad: TipoActividadProyectoDto;
  horas: string;
  tipo: string | null;
  observacion: string | null;
}

export interface ProyectoDocenteDto {
  id: number;
  idProyecto: number | null;
  nombre: string;
  descripcion: string;
  tipoProyecto: TipoProyectoDto[];
  personaProyecto: PersonaProyectoDto[];
  productos?: ProyectoDocenteDto[];
}

export interface ProfessorProjectRow {
  idDetalleCargaDocente?: number;
  idPersonaProyecto: number;
  idProyecto: number;
  idTipoActividad: number;
  codigoTipoActividad: string;
  nombreProyecto: string;
  nombreActividad: string;
  horasDedicacion: number | null;
  nivel: 0 | 1;
  esPadre: boolean;
  esSeleccionable: boolean;
}
