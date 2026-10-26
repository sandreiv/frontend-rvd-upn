export type NoveltyHistoryState = '0' | '1' | '2';

export interface GeneralNoveltyHistoryItem {
  idNovedadCargaDocente: number;
  idCargaDocente: number;

  idPersonaGeneral: number | null;
  nombreDocente: string;

  idNovedadCatalogo: number | null;
  tipoNovedad: string;

  fecha: string;

  estadoNovedad: NoveltyHistoryState;
  motivoRechazo: string | null;
}