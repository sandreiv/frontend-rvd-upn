import { ConvocatoriaDates } from './add-professor.model';
import { DetalleCargaDocenteRequest } from './save-detail-professor-preload.model';
import { WorkDate } from './coordination.model';
import { DetailProfessorPreloadItemApi } from './detail-professor-preload.model';

export interface NoveltyAssignmentSnapshot {
  idModalidadContratacion: number;
  idCategoriaCatedratico: number;
  workDate: WorkDate;
  semanas: string;
  horas: string | null;
  horasDeExcepcion: string | null;
  valorHora: number | null;
  puntos: string | null;
  valorPunto: number | null;
  valorContrato: number | null;
  valorPrestaciones: number | null;
  totalContrato: number | null;
  asignacionSalarial: number | null;
}

export interface SaveNovedadCargaDocenteRequest {
  idCargaDocente: number;
  idCarga: number;
  idPersonaGeneral: number | null;
  idModalidadContratacion: number;
  idCategoriaCatedratico: number;
  idNovedad: number;
  fechasConvocatoria: ConvocatoriaDates;
  semanas: string;
  horas?: string | null;
  horasDeExcepcion?: string | null;
  valorPunto?: number | null;
  valorContrato?: number | null;
  valorPrestaciones?: number | null;
  totalContrato?: number | null;
  asignacionSalarial?: number | null;
  puntos?: string | null;
  valorHora?: number | null;
  onceMeses?: string | null;
  detalles: DetalleCargaDocenteRequest[];
}

export interface SaveNoveltyProjectActivitiesRequest {
  idNovedad: number;
  idCargaDocente: number;
  detallesNuevos: DetalleCargaDocenteRequest[];
  detallesActualizados: DetailProfessorPreloadItemApi[];
  detallesEliminados: number[];
}