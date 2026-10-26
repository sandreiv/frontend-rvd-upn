import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  ActivityTypeFormData,
  ActivityTypeItem,
  DeleteBulkActivityTypesRequest,
} from '../model/activity-types.model';

@Injectable({ providedIn: 'root' })
export class ActivityTypesService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/administration/activity-types';

  /**
   * Lista los tipos de actividad configurados en el sistema.
   *
   * @returns Observable con los tipos de actividad disponibles.
  */

  listActivityTypes(): Observable<ActivityTypeItem[]> {
    return this.webRequestService.get<ActivityTypeItem[]>(`${this.endpoint}/list`);
  }

  /**
   * Registra un nuevo tipo de actividad.
   *
   * @param payload Información del tipo de actividad a registrar.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  saveActivityType(payload: ActivityTypeFormData): Observable<void> {
    return this.webRequestService.post<void>(`${this.endpoint}/save`, payload);
  }

  /**
   * Actualiza un tipo de actividad existente.
   *
   * @param id Identificador del tipo de actividad.
   * @param payload Información actualizada del tipo de actividad.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updateActivityType(id: number, payload: ActivityTypeFormData): Observable<void> {
    return this.webRequestService.put<void>(`${this.endpoint}/update/${id}`, payload);
  }

  /**
   * Elimina un tipo de actividad por su identificador.
   *
   * @param id Identificador del tipo de actividad.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deleteActivityType(id: number): Observable<void> {
    return this.webRequestService.delete<void>(`${this.endpoint}/delete/${id}`);
  }

  /**
   * Elimina varios tipos de actividad en una sola operación.
   *
   * @param payload Identificadores de los tipos de actividad a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  deleteBulkActivityTypes(payload: DeleteBulkActivityTypesRequest): Observable<void> {
    return this.webRequestService.post<void>(`${this.endpoint}/delete-bulk`, payload);
  }

  /**
   * Lista los tipos de actividad hijos asociados a un tipo de actividad padre.
   *
   * @param idPadre Identificador del tipo de actividad padre.
   * @returns Observable con los tipos de actividad hijos.
  */

  listChildActivityTypes(idPadre: number): Observable<ActivityTypeItem[]> {
    return this.webRequestService.get<ActivityTypeItem[]>(
    `${this.endpoint}/${idPadre}/children/list`,
    );
  }

  /**
   * Registra un tipo de actividad hijo bajo el tipo de actividad padre indicado.
   *
   * @param idPadre Identificador del tipo de actividad padre.
   * @param payload Información del tipo de actividad hijo.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  saveChildActivityType(
    idPadre: number,
    payload: ActivityTypeFormData,
    ): Observable<void> {
    return this.webRequestService.post<void>(
        `${this.endpoint}/${idPadre}/children/save`,
        payload,
    );
  }

}