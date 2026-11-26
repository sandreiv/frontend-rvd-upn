/** Nodo de horas de GET /configuration/load/total-coordination. */
export interface CoordinationLoadHoursNode {
  idTipoActividad: number;
  nombre: string | null;
  horas: number;
  hijos: CoordinationLoadHoursNode[];
}

/** Respuesta de GET /configuration/load/total-coordination. */
export interface CoordinationLoadTotal {
  totalDocentes: number;
  totalPrestaciones: number;
  totalContratos: number;
  totalPreasignacion: number;
  totalHorasCarga: CoordinationLoadHoursNode[];
  totalHoras: number;
}

export const EMPTY_COORDINATION_LOAD_TOTAL: CoordinationLoadTotal = {
  totalDocentes: 0,
  totalPrestaciones: 0,
  totalContratos: 0,
  totalPreasignacion: 0,
  totalHorasCarga: [],
  totalHoras: 0,
};

/** Horas de un nodo padre, con sufijo corto. */
export function formatLoadHours(hours: number | null | undefined): string {
  const value = Number(hours);
  if (!Number.isFinite(value)) {
    return '0 h';
  }

  return `${value} h`;
}
