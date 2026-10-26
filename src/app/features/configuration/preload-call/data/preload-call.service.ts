import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  EducationalLevelItem,
  ModalityItem,
  normalizePreloadCallListItem,
  PersonaAutorizaConvocatoriaItem,
  PreloadCallDetailResponse,
  PreloadCallItem,
  PreloadCallListApiItem,
  RestrictCoordinationFormData,
  RestrictCoordinationItem,
  RestrictCoordinationDeleteRequest,
  SearchGeneralPersonParams,
  UniversityPeriodItem,
} from '../model/preload-call.model';
import { PreloadCallDeleteRequest, PreloadCallSaveRequest } from '../model/preload-call-save.model';
import { CoordinationOption } from '../components/restrict-coordination/restrict-coordination-form/restrict-coordination-form';

@Injectable({
  providedIn: 'root',
})
export class PreloadCallService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/preload-call';

  /**
   * Obtiene las convocatorias de precarga asociadas a un periodo universitario.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @returns Observable con la lista de convocatorias de precarga.
  */

  getPreloadCallList(idPeriodoUniversidad: number): Observable<PreloadCallItem[]> {
    return this.webRequestService
      .get<PreloadCallListApiItem[]>(`${this.endpoint}/list`, {
        idPeriodoUniversidad: String(idPeriodoUniversidad),
      })
      .pipe(
        map((items) =>
          items
            .map((item) => normalizePreloadCallListItem(item))
            .filter((item): item is PreloadCallItem => item != null),
        ),
      );
  }

  /**
   * Lista las convocatorias del primer periodo universitario del año indicado.
   * Se utiliza para relacionar una convocatoria de periodo 2 con una de periodo 1.
   *
   * @param year Año universitario.
   * @returns Observable con las convocatorias correspondientes al periodo 1.
  */

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

  /**
   * Actualiza o elimina la relación de una convocatoria de periodo 2
   * con una convocatoria del periodo 1.
   *
   * @param idConvocatoria Identificador de la convocatoria a relacionar.
   * @param idRelacion Identificador de la convocatoria relacionada o null para eliminar la relación.
   * @returns Observable sin contenido cuando la operación finaliza correctamente.
  */

  updatePreloadCallRelation(idConvocatoria: number, idRelacion: number | null): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update-relation/${idConvocatoria}`,
      { idRelacion },
    );
  }

  /**
   * Lista las convocatorias de preasignación del periodo universitario indicado.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @returns Observable con las convocatorias de preasignación disponibles.
  */

  listPreassignmentCalls(
    idPeriodoUniversidad: number,
  ): Observable<PreloadCallItem[]> {
    return this.webRequestService
      .get<PreloadCallListApiItem[]>(`${this.endpoint}/list-preassignment`, {
        idPeriodoUniversidad: String(idPeriodoUniversidad),
      })
      .pipe(
        map((items) =>
          items
            .map((item) => normalizePreloadCallListItem(item))
            .filter((item): item is PreloadCallItem => item != null),
        ),
      );
  }

  /**
   * Relaciona una convocatoria de contratación con una convocatoria
   * de preasignación del mismo periodo.
   *
   * @param idConvocatoria Identificador de la convocatoria de contratación.
   * @param idRelacion Identificador de la preasignación o null para eliminar la relación.
   * @returns Observable sin contenido cuando la operación finaliza correctamente.
  */

  updatePreassignmentRelation(
    idConvocatoria: number,
    idRelacion: number | null,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update-preassignment-relation/${idConvocatoria}`,
      { idRelacion },
    );
  }

  /**
   * Busca personas generales por documento o nombre para asociarlas
   * a una convocatoria.
   *
   * @param params Criterios opcionales de búsqueda por documento y nombre.
   * @returns Observable con las personas que coinciden con los criterios enviados.
  */

  searchGeneralPerson(params: SearchGeneralPersonParams): Observable<PersonaAutorizaConvocatoriaItem[]> {
    const query: Record<string, string> = {};
    const documento = params.documento?.trim();
    const nombre = params.nombre?.trim();

    if (documento) {
      query['documento'] = documento;
    }
    if (nombre) {
      query['nombre'] = nombre;
    }

    return this.webRequestService.get<PersonaAutorizaConvocatoriaItem[]>(
      `${this.endpoint}/search-general-person`,
      query,
    );
  }

  /**
   * Lista las modalidades de contratación disponibles para configurar una convocatoria.
   *
   * @returns Observable con las modalidades de contratación.
  */

  getModalities(): Observable<ModalityItem[]> {
    return this.webRequestService.get<ModalityItem[]>(
      `${this.endpoint}/list-modality`,
    );
  }

  /**
   * Lista los periodos universitarios disponibles para la configuración
   * de convocatorias.
   *
   * @returns Observable con los periodos universitarios.
  */

  getUniversityPeriod(): Observable<UniversityPeriodItem[]> {
    return this.webRequestService.get<UniversityPeriodItem[]>(
      `${this.endpoint}/list-university-period`,
    );
  }

  /**
   * Lista los niveles educativos disponibles para una convocatoria.
   *
   * @returns Observable con los niveles educativos.
  */

  getEducationalLevels(): Observable<EducationalLevelItem[]> {
    return this.webRequestService.get<EducationalLevelItem[]>(
      `${this.endpoint}/list-educational-level`,
    );
  }

  /**
   * Registra una nueva convocatoria de precarga con la configuración enviada.
   *
   * @param payload Información completa de la convocatoria a registrar.
   * @returns Observable con la convocatoria creada.
  */

  savePreloadCall(payload: PreloadCallSaveRequest): Observable<PreloadCallItem> {
    return this.webRequestService.post<PreloadCallItem>(
      `${this.endpoint}/save`,
      payload,
    );
  }

  /**
   * Consulta el detalle completo de una convocatoria de precarga.
   *
   * @param id Identificador de la convocatoria.
   * @returns Observable con el detalle de la convocatoria.
  */

  getPreloadCallDetails(id: number): Observable<PreloadCallDetailResponse> {
    return this.webRequestService.get<PreloadCallDetailResponse>(
      `${this.endpoint}/detail/${id}`,
    );
  }

  /**
   * Actualiza una convocatoria de precarga existente.
   *
   * @param id Identificador de la convocatoria.
   * @param payload Información actualizada de la convocatoria.
   * @returns Observable con la convocatoria actualizada.
  */

  updatePreloadCall(id: number, payload: PreloadCallSaveRequest): Observable<PreloadCallItem> {
    return this.webRequestService.put<PreloadCallItem>(
      `${this.endpoint}/update/${id}`,
      payload,
    );
  }

  /**
   * Elimina una convocatoria de precarga utilizando la información
   * de trazabilidad requerida.
   *
   * @param id Identificador de la convocatoria.
   * @param payload Información requerida para ejecutar la eliminación.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deletePreloadCall(id: number, payload: PreloadCallDeleteRequest): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete/${id}`,
      payload,
    );
  }

  /**
   * Elimina varias convocatorias de precarga en una sola operación.
   *
   * @param payload Solicitudes de eliminación de las convocatorias seleccionadas.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  bulkDeletePreloadCall(payload: PreloadCallDeleteRequest[]): Observable<void> {
    console.log('payload', payload);
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-bulk`,
      payload,
    );
  }

  /**
   * Busca coordinaciones por nombre para asociarlas o restringirlas
   * dentro de una convocatoria.
   *
   * @param nombre Texto utilizado para buscar la coordinación.
   * @param idConvocatoria Identificador opcional de la convocatoria.
   * @returns Observable con las coordinaciones que coinciden con el criterio enviado.
  */

  searchCoordination(
    nombre: string,
    idConvocatoria?: number | null,
  ): Observable<CoordinationOption[]> {
    const params: Record<string, string> = {
      nombre,
    };

    if (idConvocatoria != null) {
      params['idConvocatoria'] = String(idConvocatoria);
    }

    return this.webRequestService.get<CoordinationOption[]>(
      `${this.endpoint}/search-coordination`,
      params,
    );
  }

  /**
   * Guarda una restricción de coordinación para una convocatoria de precarga.
   * El backend sincroniza el estado de la convocatoria después del registro.
   *
   * @param payload Información de la coordinación, fechas y estado de la restricción.
   * @returns Observable con la restricción registrada.
  */

  saveCoordinationRestriction(payload: RestrictCoordinationFormData): Observable<RestrictCoordinationItem> {
    console.log('payload', payload);
    return this.webRequestService.post<RestrictCoordinationItem>(
      `${this.endpoint}/save-coordination-restriction`,
      payload,
    );
  }

  /**
   * Lista las restricciones de coordinación asociadas a una convocatoria.
   *
   * @param idConvocatoria Identificador opcional de la convocatoria.
   * @returns Observable con las restricciones registradas.
  */

  listCoordinationRestriction(idConvocatoria?: number,): Observable<RestrictCoordinationItem[]> {
    const query: Record<string, string> = {};

    if (idConvocatoria != null) {
      query['idConvocatoria'] = String(idConvocatoria);
    }

    return this.webRequestService.get<RestrictCoordinationItem[]>(
      `${this.endpoint}/list-coordination-restriction`,
      query,
    );
  }

  /**
   * Actualiza una restricción de coordinación existente.
   * El backend sincroniza nuevamente el estado de la convocatoria.
   *
   * @param id Identificador de la restricción.
   * @param payload Información actualizada de la restricción.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updateCoordinationRestriction(id: number, payload: RestrictCoordinationFormData): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update-coordination-restriction/${id}`,
      payload,
    );
  }

  /**
   * Elimina una restricción de coordinación.
   * El backend valida si la convocatoria debe permanecer activa o inactiva.
   *
   * @param id Identificador de la restricción.
   * @param payload Información requerida para la eliminación.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deleteCoordinationRestriction(id: number, payload: RestrictCoordinationDeleteRequest): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-coordination-restriction/${id}`,
      payload,
    );
  }

  /**
   * Elimina varias restricciones de coordinación en una sola operación.
   *
   * @param payload Restricciones seleccionadas para eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  bulkDeleteCoordinationRestriction(payload: RestrictCoordinationDeleteRequest[]): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-bulk-coordination-restriction`,
      payload,
    );
  }
}