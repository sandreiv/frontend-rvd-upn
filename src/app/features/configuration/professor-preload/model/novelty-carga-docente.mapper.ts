import {
  NoveltyAssignmentSnapshot,
  SaveNovedadCargaDocenteRequest,
} from './novelty-carga-docente.model';
import {
  buildSaveActivityDistributionRequest,
  SaveDetailProfessorPreloadInput,
} from './professor-activities-save.mapper';
import { ModalityProfessor } from './coordination.model';

export interface BuildNoveltyRequestInput {
  professor: ModalityProfessor;
  noveltyId: number;
  assignment: NoveltyAssignmentSnapshot;
  activities: SaveDetailProfessorPreloadInput;
}

export function buildSaveNovedadCargaDocenteRequest(
  input: BuildNoveltyRequestInput,
): SaveNovedadCargaDocenteRequest | null {
  const idCargaDocente = input.professor.idCargaDocente;
  if (idCargaDocente == null) {
    return null;
  }

  const workDate = input.assignment.workDate;
  const detalles = buildSaveActivityDistributionRequest(
    input.activities,
  ).detalles;

  return {
    idCargaDocente,
    idCarga: input.professor.idCarga,
    idPersonaGeneral: input.professor.idPersonaGeneral,
    idModalidadContratacion: input.assignment.idModalidadContratacion,
    idCategoriaCatedratico: input.assignment.idCategoriaCatedratico,
    idNovedad: input.noveltyId,
    fechasConvocatoria: {
      id: workDate.id,
      fechaInicio: workDate.fechaInicio,
      fechaFin: workDate.fechaFin,
    },
    semanas: input.assignment.semanas,
    horas: input.assignment.horas,
    horasDeExcepcion: input.assignment.horasDeExcepcion,
    valorHora: input.assignment.valorHora,
    puntos: input.assignment.puntos,
    valorPunto: input.assignment.valorPunto,
    valorContrato: input.assignment.valorContrato,
    valorPrestaciones: input.assignment.valorPrestaciones,
    totalContrato: input.assignment.totalContrato,
    asignacionSalarial: input.assignment.asignacionSalarial,
    onceMeses: input.professor.onceMeses,
    detalles,
  };
}
