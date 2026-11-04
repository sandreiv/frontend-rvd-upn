import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import { UniversityPeriodItem } from '../../preload-call/model/preload-call.model';
import {
  CoordinationApiItem,
  CoordinationItem,
  CoordinationPreloadCallApi,
  normalizeCoordinationItem,
} from '../model/coordination.model';

@Injectable({
  providedIn: 'root',
})
export class CoordinationService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/load';

  /**
   * Obtiene las convocatorias activas del periodo universitario.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @returns Observable con las convocatorias activas del periodo.
   */
  getActivePreloadCall(idPeriodoUniversidad: number,): Observable<CoordinationPreloadCallApi[]> {
    return this.webRequestService.get<CoordinationPreloadCallApi[]>(
      `${this.endpoint}/list-active-calls`,
      { idPeriodoUniversidad },
    );
  }

  /**
   * Lista los periodos universitarios disponibles.
   *
   * @returns Observable con los periodos universitarios.
   */
  getUniversityPeriod(): Observable<UniversityPeriodItem[]> {
    return this.webRequestService.get<UniversityPeriodItem[]>(
      `${this.endpoint}/list-university-period`,
    );
  }

  /**
   * Lista las coordinaciones de la persona en un periodo universitario.
   * Si se envía convocatoria, debe pertenecer a ese periodo.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @param idConvocatoria Identificador opcional de la convocatoria.
   * @returns Observable con las coordinaciones encontradas.
   */
  getCoordinations(idPeriodoUniversidad: number, idConvocatoria?: number | null,): Observable<CoordinationItem[]> {
    const params: Record<string, number> = {
      idPeriodoUniversidad,
    };

    if (idConvocatoria != null) {
      params['idConvocatoria'] = idConvocatoria;
    }

    return this.webRequestService
      .get<CoordinationApiItem[]>(`${this.endpoint}/list`, params)
      .pipe(map((items) => items.map(normalizeCoordinationItem)));
  }
}
