export interface StateItem {
  id: number;
  nombre: string;
  descripcion: string;
  tipo: string;
  orden: string;
}

export interface StateFormData {
  nombre: string;
  descripcion: string;
  tipo: string;
  orden: string;
}

export interface NextStatesFormData {
  estadosDestinoIds: number[];
}