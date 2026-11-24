/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 24/11/2026 - Creación inicial: catálogo de novedades (tablas básicas)
 */

export const NOVEDAD_ACCIONES = [
  'ACTUALIZAR',
  'GUARDAR',
  'ELIMINAR',
] as const;

export type NovedadAccion =
  | (typeof NOVEDAD_ACCIONES)[number];

export const NOVEDAD_ACCION_OPTIONS =
  NOVEDAD_ACCIONES.map((accion) => ({
    value: accion,
    label: accion,
  }));

export const NOVEDAD_FORPLANTA_OPTIONS = [
  {
    value: '1',
    label: 'Sí',
  },
  {
    value: '0',
    label: 'No',
  },
];

export interface NovedadItem {
  id: number;
  tipo: string;
  descripcion: string;
  accion: NovedadAccion | string;
  componente: string;
  forPlanta: '1' | '0' | string;
}

export interface NovedadFormData {
  tipo: string;
  descripcion: string;
  accion: NovedadAccion | string;
  componente: string;
  forPlanta: '1' | '0';
}

export interface DeleteBulkNovedadesRequest {
  ids: number[];
}

export function formatForPlanta(
  value: string | null | undefined,
): string {
  return value === '1' ? 'Sí' : 'No';
}
