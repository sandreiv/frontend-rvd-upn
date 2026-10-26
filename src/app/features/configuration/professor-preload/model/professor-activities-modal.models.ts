export interface DirectLearningActivity {
  idDetalleCargaDocente?: number;
  id: string;
  criterio: string;
  unidad: string;
  programa: string;
  materia: string;
  horasPresenciales: number;
  grupo: string;
  cupos: number;
  idTipoActividad: number;
  idTipoActividadHija?: number;
  codigoTipoActividad: string;
  idUnidadRegional: number;
  idPrograma: number;
  codigoMateria: string;
  idCentroCostoMateria?: number | null;
  idGrupo: number;
}

export interface SimpleActivity {
  idDetalleCargaDocente?: number;
  id: string;
  actividad: string;
  horasDedicacion: number;
  idTipoActividadHija?: number;
  descripcionProyecto?: string;
}
