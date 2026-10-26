export interface DocumentRequest {
  id?: number | string;

  archivo?: File | null;

  mimeType: string;

  tamano: number;

  extension: string;

  path: string;

  descripcion: string;

  nombreArchivo?: string;

  aplicativoNuevo?: string | null;
}