/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 24/11/2026 - Creación inicial: catálogo de novedades (tablas básicas)
 * 24/11/2026 - Ajuste a RVDIES.NOVEDADES: tipo y descripción (30 caracteres)
 */

/** Longitud real de NOVE_TIPO y NOVE_DESCRIPCION en RVDIES.NOVEDADES. */
export const NOVEDAD_MAX_LENGTH = 30;

export interface NovedadItem {
  id: number;
  tipo: string;
  descripcion: string;
}

export interface NovedadFormData {
  tipo: string;
  descripcion: string;
}

export interface DeleteBulkNovedadesRequest {
  ids: number[];
}
