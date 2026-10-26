import {
  EducationalLevelItem,
  FechaFormMeta,
  ModalityFormItem,
  UniversityPeriodItem,
} from './preload-call.model';

export interface PreloadCallSaveRequest {
  convocatoria: PreloadCallSaveConvocatoria;
  fechas: PreloadCallSaveFecha[];
  convocatoriaTipoContratacion: PreloadCallSaveCotc[];
}

export interface PreloadCallSaveConvocatoria {
  id?: number;
  nombre: string;
  descripcion: string;
  autoriza: PreloadCallSaveAutoriza;
  periodo: PreloadCallSavePeriodo;
  nivelEducativo: PreloadCallSaveNivelEducativo;
  contratacion: string | null;
}

export interface PreloadCallSaveAutoriza {
  id: number;
  documentoIdentidad: string;
  nombreCompleto: string;
}

export interface PreloadCallSavePeriodo {
  id: number;
  periodo: string;
  ano: number;
}

export interface PreloadCallSaveNivelEducativo {
  id: number;
  descripcion: string;
}

export type PreloadCallFechaCodigo = 'CNV' | 'CTEI' | 'ISU';

export interface PreloadCallSaveFecha {
  id?: number | null;
  codigo: PreloadCallFechaCodigo;
  fechaInicio: string;
  fechaFin: string;
}

export interface PreloadCallSaveCotc {
  id?: number | null;
  idModalidadContratacion: number;
  fechas: PreloadCallSaveCotcFecha[];
}

export interface PreloadCallSaveCotcFecha {
  id?: number | null;
  vacaciones: number | null;
  fechaInicio: string | null;
  fechaFin: string | null;
  semanas: number | null;
}

export interface BuildPreloadCallSavePayloadParams {
  convocatoriaId?: number;
  nombre: string;
  descripcion: string;
  idPersonaNaturalGeneral: number;
  documentoIdentidad: string;
  nombreCompleto: string;
  periodo: UniversityPeriodItem;
  nivelEducativo: EducationalLevelItem;
  fechaInicio: string;
  fechaFin: string;
  fechaInicioCtei: string;
  fechaFinCtei: string;
  fechaInicioIsu: string;
  fechaFinIsu: string;
  fechasMeta: FechaFormMeta[];
  modalityRows: ModalityFormItem[];
  contratacion: string | null;
}

export interface PreloadCallDeleteRequest {
  convocatoria: PreloadCallDeleteConvocatoria;
  fechas: PreloadCallDeleteFecha[];
  convocatoriaTipoContratacion: PreloadCallDeleteCotc[];
}

export interface PreloadCallDeleteConvocatoria {
  id?: number;
}


export interface PreloadCallDeleteFecha {
  id?: number | null;
}

export interface PreloadCallDeleteCotc {
  id?: number | null;
  fechas: PreloadCallDeleteCotcFecha[];
}

export interface PreloadCallDeleteCotcFecha {
  id?: number | null;

}
