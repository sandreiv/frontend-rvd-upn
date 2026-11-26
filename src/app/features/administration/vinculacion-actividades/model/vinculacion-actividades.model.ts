/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 25/11/2026 - Creación inicial: vinculación de actividades (tablas básicas)
 */

export const ESTADO_OPTIONS = [
  {
    value: '1',
    label: 'Activo',
  },
  {
    value: '0',
    label: 'Inactivo',
  },
];

export interface CatalogoOpcion {
  id: number;
  nombre: string;
  grupo: string | null;
}

export interface VinculacionActividadItem {
  id: number;
  idTipoVinculacion: number;
  tipoVinculacion: string;
  idTipoActividad: number;
  tipoActividad: string;
  estado: string;
  minimoHoras: string | null;
  maximoHoras: string | null;
}

export interface VinculacionActividadFormData {
  idTipoVinculacion: number | null;
  idTipoActividad: number | null;
  estado: string;
  minimoHoras: string | null;
  maximoHoras: string | null;
}

export interface DeleteBulkVinculacionActividadesRequest {
  ids: number[];
}

export function formatEstado(
  value: string | null | undefined,
): string {
  return value === '1' ? 'Activo' : 'Inactivo';
}
