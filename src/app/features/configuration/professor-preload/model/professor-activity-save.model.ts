/** Materia enviada en el detalle de la precarga docente. */
export interface DetalleMateriaRequest {
  codigoMateria: string;
  idCentroCosto: number | null;
}

/** Un detalle de actividad de la carga docente. */
export interface DetalleCargaDocenteRequest {
  idTipoActividad: number;
  horas: number;
  idCoordinacion: number;
  idUnidadRegional?: number;
  idPrograma?: number;
  materia?: DetalleMateriaRequest | null;
  materiaBanco: DetalleMateriaRequest | null;
  idGrupo?: number;
  extras: string;
  data: string | null;
}

/** Cuerpo de POST /configuration/load/save-detail-professor-preload. */
export interface SaveDetailProfessorPreloadRequest {
  idCargaDocente: number;
  detalles: DetalleCargaDocenteRequest[];
}

/** Cuerpo de POST /configuration/load/delete-detail-professor-load-bulk. */
export interface DeleteBulkProfessorLoadDetailRequest {
  ids: number[];
}
