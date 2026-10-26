import { CoordinationLookupItem } from './coordination.model';

export interface PreloadCargaApi {
  id: number;
  idCentroCosto?: number | null;
  valor?: number | null;
  valorAutorizado?: number | null;
  estadoCarga?: CoordinationLookupItem | null;
}

export interface DeclinePreloadDeanRequest {
  idPersonaGeneral: number;
  observacion: string;
}
