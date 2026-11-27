export interface ProfileItem {
  id: number;
  nombre: string;
  descripcion: string;
  proceso: string | null;
  esProceso: string;
  codigo: string | null;
}

export interface ProfileFormData {
  nombre: string;
  descripcion: string;
  proceso: string;
  esProceso: string;
  codigo: string;
}

export interface ProfileStatesFormData {
  estadosIds: number[];
}

export interface ProfilePersonItem {
  idPersonaGeneral: number;
  documentoIdentidad: string;
  nombreCompleto: string;
}

export interface ProfilePersonsFormData {
  personasIds: number[];
}