export interface CargaBudgetDocente {
  idCargaDocente: number;
  totalContrato: number;
}

export interface CargaBudget {
  valorCarga: number;
  valorAutorizado: number | null;
  docentes: CargaBudgetDocente[];
}

export interface NoveltyBudgetDraft {
  idCargaDocente: number;
  totalAnterior: number;
  totalNuevo: number;
}
