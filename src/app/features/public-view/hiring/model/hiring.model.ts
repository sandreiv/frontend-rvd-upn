export interface PublicHiringRecord {
  idCarga: number;
  idCargaDocente: number;
  idConvocatoriaPreasignacion: number;
  idConvocatoriaContratacion: number;
  idCoordinacion: number;
  idUnidadRegional: number;
  idNivelEducativo: number;
  idModalidadContratacion: number | null;

  convocatoria: string | null;
  nivelEducativo: string | null;
  unidadRegional: string | null;
  coordinacion: string | null;
  modalidadContratacion: string | null;

  fechaInicio: string | null;
  fechaFin: string | null;

  estadoCategorizacion: string | null;
  estadoPlanTrabajo: string | null;
}

export interface PublicBasicInformation {
  idPersonaGeneral: number;

  idTipoDocumentoIdentidad: number | null;
  tipoDocumento: string | null;
  abreviaturaTipoDocumento: string | null;
  documentoIdentidad: string | null;
  lugarExpedicion: string | null;
  fechaExpedicion: string | null;

  nombreCompleto: string | null;
  sexo: string | null;
  fechaNacimiento: string | null;

  idEstadoCivil: number | null;
  estadoCivil: string | null;

  idLugarNacimiento: number | null;
  lugarNacimiento: string | null;

  idNacionalidad: string | null;
  nacionalidad: string | null;

  idPaisNacimiento: string | null;
  paisNacimiento: string | null;

  rh: string | null;

  direccion: string | null;
  telefonoCelular: string | null;
  telefono: string | null;
  correoPersonal: string | null;
  correoInstitucional: string | null;
  fax: string | null;

  libretaMilitar: string | null;
  claseLibretaMilitar: string | null;
  distritoMilitar: string | null;

  numeroPasaporte: string | null;
  fechaVigenciaPasaporte: string | null;
  otraNacionalidad: string | null;

  vive: string | null;
  ubicacionFisicaHojavida: string | null;
}

export interface PublicAcademicLevel {
  id: number;
  descripcion: string;
  nivel: number;
}

export interface PublicAcademicTitle {
  id: number;
  idNivelAcademico: number;
  nombre: string;
}

export interface PublicCountry {
  id: string;
  nombre: string;
}

export interface PublicAcademicTrainingSave {
  idNivelAcademico: number;
  idTitulo: number;
  institucion: string;
  fechaGrado: string;
  idPais: string;
}

export interface PublicAcademicTraining {
  id: number;
  idNivelAcademico: number;
  nivelAcademico: string;
  idTitulo: number;
  titulo: string;
  institucion: string | null;
  fechaGrado: string | null;
  idPais: string;
  pais: string;
}

export interface PublicActivityDetail {
  unidad: string | null;
  programa: string | null;
  materia: string | null;
  grupo: string | null;
  horas: number;
}

export interface PublicActivitySummary {
  tipo: string;
  codigo: string;
  nombre: string;
  totalHoras: number;
  detalles: PublicActivityDetail[] | null;
}

export interface PublicActivitiesResponse {
  actividades: PublicActivitySummary[];
  observacion: string | null;
}

export interface PublicDigitalWorkPlanItem {
  idTipoActividad: number;
  codigo: string | null;
  criterio: string | null;
  actividades: string[];
  totalHoras: number | null;
  ponderacion: number | null;
  nivel: string | null;
}

export interface PublicDigitalWorkPlan {
  items: PublicDigitalWorkPlanItem[];
  totalPonderacion: number;
}

/**
 * Archivo registrado dentro de una
 * categoría documental del PTD.
 *
 * Corresponde a PtdiDocumentoArchivoDTO
 * del backend.
 */
export interface PublicSupportDocumentFile {
  id: string;
  nombre: string;
  path: string;
  extension: string;
  tamano: number;
}

export interface PublicSupportDocumentCategory {
  codigo: string;
  nombre: string;
  archivos: PublicSupportDocumentFile[];
}

export interface PublicSupportDocuments {
  version: number;
  categorias: PublicSupportDocumentCategory[];
}