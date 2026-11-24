import {
  inject,
  Injectable,
} from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  DeleteBulkNovedadesRequest,
  NovedadFormData,
  NovedadItem,
} from '../model/novedades.model';

@Injectable({
  providedIn: 'root',
})
export class NovedadesService {
  private readonly webRequestService =
    inject(WebRequestService);

  private readonly endpoint =
    '/configuration/administration/basic-tables/novedades';

  /**
   * Lista las novedades configuradas en RVD.NOVEDADES.
   *
   * @returns Observable con las novedades registradas.
   */
  list(): Observable<NovedadItem[]> {
    return this.webRequestService.get<NovedadItem[]>(
      `${this.endpoint}/list`,
    );
  }

  /**
   * Registra una nueva novedad.
   *
   * @param payload Información de la novedad a registrar.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
   */
  save(
    payload: NovedadFormData,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save`,
      payload,
    );
  }

  /**
   * Actualiza una novedad existente.
   *
   * @param id Identificador de la novedad.
   * @param payload Información actualizada de la novedad.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
   */
  update(
    id: number,
    payload: NovedadFormData,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update/${id}`,
      payload,
    );
  }

  /**
   * Elimina una novedad por su identificador.
   *
   * @param id Identificador de la novedad.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
   */
  delete(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/delete/${id}`,
    );
  }

  /**
   * Elimina varias novedades en una sola operación.
   *
   * @param payload Identificadores de las novedades a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
   */
  deleteBulk(
    payload: DeleteBulkNovedadesRequest,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-bulk`,
      payload,
    );
  }
}
