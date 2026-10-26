import { DetailProfessorPreloadItemApi } from './detail-professor-preload.model';

export interface SaveDetailProfessorPreloadRequest {
  idCargaDocente: number;
  detalles: DetalleCargaDocenteRequest[];
}

export interface DetalleMateriaRequest {
  codigoMateria: string;
  idCentroCosto?: number | null;
}

export interface DetalleCargaDocenteRequest {
  idTipoActividad: number;
  idTipoActividadHija?: number;
  codigoTipoActividad: string;
  horas: number;
  idUnidadRegional?: number;
  idPrograma?: number;
  materia?: DetalleMateriaRequest | null;
  idGrupo?: number;
  relacionCargaProyecto: RelacionCargaProyectoRequest[];
  idCentroCosto?: number;
}

export interface RelacionCargaProyectoRequest {
  idPersonaProyecto: number;
  idProyecto: number;
}

export interface SendProfessorToVerificationRequest {
  idCargaDocente: number;
  detallesActualizados: DetailProfessorPreloadItemApi[];
  detallesNuevos: SaveDetailProfessorPreloadRequest['detalles'];
}