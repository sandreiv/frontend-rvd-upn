import {
  CoordinationContractModality,
  CoordinationItem,
  ModalityProfessor,
  ProfessorCargaDocenteSummary,
  ProfessorSearchResult,
} from './coordination.model';

export function mapProfessorSearchToModalityProfessor(
  search: ProfessorSearchResult,
): ModalityProfessor | null {
  const carga = search.cargaDocente;
  if (!carga) {
    return null;
  }

  return {
    idCargaDocente: carga.id,
    idPersonaGeneral: search.id,
    nombreCompleto: search.nombreCompleto,
    estado: '',
    idModalidadContratacion: carga.idModalidadContratacion,
    idCategoriaCatedratico:
      search.categoriaCatedratico?.id ??
      search.escalafon?.idCategoriaCatedratico ??
      0,
    idCarga: carga.idCarga,
    idFechasConvocatoria: carga.idFechasConvocatoria,
    fechaConvocatoriaCodigo: null,
    fechaInicio: '',
    fechaFin: '',
    valorContrato: null,
    valorPrestaciones: null,
    asignacionSalarial: null,
    totalContrato: null,
    valorHora: null,
    puntos: search.escalafon?.puntos ?? null,
    valorPunto: null,
    semanas: null,
    onceMeses: null,
    horasDeExcepcion: null,
  };
}

export function resolveModalityFromCarga(
  coordination: CoordinationItem,
  carga: ProfessorCargaDocenteSummary,
): CoordinationContractModality {
  const modality = coordination.modalidadesContratacion.find(
    (item) => item.id === carga.idModalidadContratacion,
  );
  if (modality) {
    return modality;
  }

  return {
    id: carga.idModalidadContratacion,
    nombre: '',
  };
}
