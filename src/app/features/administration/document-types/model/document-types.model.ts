export interface DocumentTypesItem {
  id: number;
  nombre: string;
  descripcion: string;
  esObligatorio: '1' | '0';
}

export interface DocumentTypesFormData {
  nombre: string;
  descripcion: string;
  esObligatorio: '1' | '0';
}

export interface DeleteBulkDocumentTypesRequest {
  ids: number[];
}