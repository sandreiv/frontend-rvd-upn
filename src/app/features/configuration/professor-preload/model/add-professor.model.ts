export interface ConvocatoriaDates {
  id: number;
  fechaInicio: string;
  fechaFin: string;
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
