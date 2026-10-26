export interface FuncionalidadNodo {
  id?: number | string;
  codigo: string;
  nombre: string;
  urlRecurso?: string;
  nombreFuncion?: string;
  funHijas: FuncionalidadNodo[];
}
