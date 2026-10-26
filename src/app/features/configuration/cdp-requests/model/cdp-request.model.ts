export interface CdpAttachment {
  nombre: string;
  path: string;
}

export interface CdpRequest {
  id: number;
  idCoordinacion: number;
  estado: string;
  observacion: string | null;
  adjuntos: CdpAttachment[];
  fechaCambio: string;
}