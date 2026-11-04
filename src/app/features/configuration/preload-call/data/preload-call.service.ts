import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  ClasificacionDocenteItem,
  ConvocatoriaFormularioDTO,
  DedicacionDocenteItem,
  normalizePreloadCallListItem,
  PersonaAutorizaConvocatoriaItem,
  PreloadCallItem,
  PreloadCallListApiItem,
  SearchGeneralPersonParams,
  TipoHorasItem,
  TipoVinculacionDTO,
  UniversityPeriodItem,
} from '../model/preload-call.model';

@Injectable({
  providedIn: 'root',
})
export class PreloadCallService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/preload-call';

  getPreloadCallList(idPeriodoUniversidad?: number | null): Observable<PreloadCallItem[]> {
    const params: Record<string, string> = {};
    if (idPeriodoUniversidad != null) {
      params['idPeriodoUniversidad'] = String(idPeriodoUniversidad);
    }
    return this.webRequestService
      .get<PreloadCallListApiItem[]>(`${this.endpoint}/list`, params)
      .pipe(
        map((items) =>
          items
            .map((item) => normalizePreloadCallListItem(item))
            .filter((item): item is PreloadCallItem => item != null),
        ),
      );
  }

  listPreloadCallByFirstPeriodByYear(year: number): Observable<PreloadCallItem[]> {
    return this.webRequestService
      .get<PreloadCallListApiItem[]>(
        `${this.endpoint}/list-by-first-period-by-year`,
        { year: String(year) },
      )
      .pipe(
        map((items) =>
          items
            .map((item) => normalizePreloadCallListItem(item))
            .filter((item): item is PreloadCallItem => item != null),
        ),
      );
  }

  updatePreloadCallRelation(idConvocatoria: number, idRelacion: number | null): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update-relation/${idConvocatoria}`,
      { idRelacion },
    );
  }

  getTiposVinculacion(): Observable<TipoVinculacionDTO[]> {
    return this.webRequestService.get<TipoVinculacionDTO[]>(
      `${this.endpoint}/list-tipo-vinculacion`,
    );
  }

  getClasificacionesDocente(): Observable<ClasificacionDocenteItem[]> {
    return this.webRequestService.get<ClasificacionDocenteItem[]>(
      `${this.endpoint}/list-clasificacion-docente`,
    );
  }

  getDedicacionesDocente(): Observable<DedicacionDocenteItem[]> {
    return this.webRequestService.get<DedicacionDocenteItem[]>(
      `${this.endpoint}/list-dedicacion-docente`,
    );
  }

  getTiposHoras(): Observable<TipoHorasItem[]> {
    return this.webRequestService.get<TipoHorasItem[]>(
      `${this.endpoint}/list-tipo-horas`,
    );
  }

  createTipoVinculacion(payload: Partial<TipoVinculacionDTO>): Observable<TipoVinculacionDTO> {
    return this.webRequestService.post<TipoVinculacionDTO>(
      `${this.endpoint}/create-tipo-vinculacion`,
      payload,
    );
  }

  getUniversityPeriod(): Observable<UniversityPeriodItem[]> {
    return this.webRequestService.get<UniversityPeriodItem[]>(
      `${this.endpoint}/list-university-period`,
    );
  }

  searchCoordination(
    nombre: string,
    idConvocatoria?: number | null,
  ): Observable<{ id: number; nombre: string; descripcion?: string | null }[]> {
    const params: Record<string, string> = { nombre };
    if (idConvocatoria != null) {
      params['idConvocatoria'] = String(idConvocatoria);
    }
    return this.webRequestService.get<{ id: number; nombre: string; descripcion?: string | null }[]>(
      `${this.endpoint}/search-coordination`,
      params,
    );
  }

  searchGeneralPerson(params: SearchGeneralPersonParams): Observable<PersonaAutorizaConvocatoriaItem[]> {
    const query: Record<string, string> = {};
    if (params.documento?.trim()) {
      query['documento'] = params.documento.trim();
    }
    if (params.nombre?.trim()) {
      query['nombre'] = params.nombre.trim();
    }
    return this.webRequestService.get<PersonaAutorizaConvocatoriaItem[]>(
      `${this.endpoint}/search-general-person`,
      query,
    );
  }

  savePreloadCall(payload: ConvocatoriaFormularioDTO): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save`,
      payload,
    );
  }

  getPreloadCallDetails(id: number): Observable<ConvocatoriaFormularioDTO> {
    return this.webRequestService.get<ConvocatoriaFormularioDTO>(
      `${this.endpoint}/detail/${id}`,
    );
  }

  updatePreloadCall(id: number, payload: ConvocatoriaFormularioDTO): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update/${id}`,
      payload,
    );
  }

  deletePreloadCall(id: number, payload: Partial<ConvocatoriaFormularioDTO> = {}): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete/${id}`,
      payload,
    );
  }

  bulkDeletePreloadCall(payload: ConvocatoriaFormularioDTO[]): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-bulk`,
      payload,
    );
  }
}
