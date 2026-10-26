export interface ProjectTypeItem {
  id: number;
  nombre: string;
  descripcion: string;
  minimoParticipantes: string;
  maximoParticipantes: string;
  montoMaximo: string;
  minimoProductos: string;
  minimoConocimientoTi: string;
  tipo: string;
}

export interface ProjectTypeFormData {
  nombre: string;
  descripcion: string;
  minimoParticipantes: string;
  maximoParticipantes: string;
  montoMaximo: string;
  minimoProductos: string;
  minimoConocimientoTi: string;
  tipo: string;
}

export interface DeleteBulkProjectTypesRequest {
  ids: number[];
}

export const PROJECT_TYPE_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
];
