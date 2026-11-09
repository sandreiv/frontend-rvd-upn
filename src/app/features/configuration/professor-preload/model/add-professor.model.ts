export interface ConvocatoriaDates {
  id: number;
  fechaInicio: string;
  fechaFin: string;
}

export interface AddProfessorPayload {
  idPersonaGeneral: number;
  idTipoVinculacionConvocatoria: number;
  idCategoriaCatedratico: number;
  idCoordinacion: number;
  fechaInicio?: string;
  fechaFin?: string;
  valorContrato?: number;
  valorPrestaciones?: number;
  asignacionSalarial?: number;
  totalContrato?: number;
  horas?: string;
  valorHora?: number;
  puntos?: string;
  valorPunto?: number;
  semanas?: string;
}

export interface AddProfessorRequest {
  idCargaDocente?: number;
  idCarga: number;
  idPersonaGeneral: number | null;
  idModalidadContratacion: number;
  idCategoriaCatedratico: number;
  fechasConvocatoria: ConvocatoriaDates;
  semanas: string;
  valorPunto?: number | null;
  valorContrato?: number | null;
  valorPrestaciones?: number | null;
  totalContrato?: number | null;
  asignacionSalarial?: number | null;
  puntos?: string;
  valorHora?: number | null;
}
