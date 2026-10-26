import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  DeleteBulkPointsValidityRequest,
  PointsValidityFormData,
  PointsValidityItem,
} from '../model/points-validity.model';

@Injectable({
  providedIn: 'root',
})
export class PointsValidityService {
  private readonly webRequestService =
    inject(WebRequestService);

  private readonly endpoint =
    '/configuration/administration/points-validity';
  
  /**
   * Lista las vigencias de puntos configuradas en el sistema.
   *
   * @returns Observable con las vigencias de puntos registradas.
  */  

  list(): Observable<PointsValidityItem[]> {
    return this.webRequestService.get<PointsValidityItem[]>(
      `${this.endpoint}/list`,
    );
  }

  /**
   * Registra una nueva vigencia de puntos.
   *
   * @param payload Información de la vigencia a registrar.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  save(
    payload: PointsValidityFormData,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save`,
      payload,
    );
  }

  /**
   * Actualiza una vigencia de puntos existente.
   *
   * @param id Identificador de la vigencia.
   * @param payload Información actualizada de la vigencia.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  update(
    id: number,
    payload: PointsValidityFormData,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update/${id}`,
      payload,
    );
  }

  /**
   * Elimina una vigencia de puntos por su identificador.
   *
   * @param id Identificador de la vigencia.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  delete(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/delete/${id}`,
    );
  }

  /**
   * Elimina varias vigencias de puntos en una sola operación.
   *
   * @param payload Identificadores de las vigencias a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  deleteBulk(
    payload: DeleteBulkPointsValidityRequest,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-bulk`,
      payload,
    );
  }
}