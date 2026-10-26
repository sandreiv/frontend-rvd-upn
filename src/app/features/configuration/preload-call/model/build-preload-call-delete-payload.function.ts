import { PreloadCallDetailResponse } from './preload-call.model';
import { PreloadCallDeleteRequest } from './preload-call-save.model';

export function buildPreloadCallDeletePayload(
  detail: PreloadCallDetailResponse,
): PreloadCallDeleteRequest {
  return {
    convocatoria: { id: detail.convocatoria.id },
    fechas: detail.fechas.map((fecha) => ({ id: fecha.id ?? null })),
    convocatoriaTipoContratacion: detail.convocatoriaTipoContratacion.map(
      (cotc) => ({
        id: cotc.id,
        fechas: cotc.fechas.map((fecha) => ({ id: fecha.id })),
      }),
    ),
  };
}
