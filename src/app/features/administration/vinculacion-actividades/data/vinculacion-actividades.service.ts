import {
  inject,
  Injectable,
} from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  CatalogoOpcion,
  DeleteBulkVinculacionActividadesRequest,
  VinculacionActividadFormData,
  VinculacionActividadItem,
} from '../model/vinculacion-actividades.model';

@Injectable({
  providedIn: 'root',
})
export class VinculacionActividadesService {
  private readonly webRequestService =
    inject(WebRequestService);

  private readonly endpoint =
    '/configuration/administration/basic-tables/vinculacion-actividades';

  /**
   * Lista las vinculaciones de actividades registradas.
   *
   * @returns Observable con los registros de RVDIES.VINCULACIONACTIVIDADES.
   */
  list(): Observable<VinculacionActividadItem[]> {
    return this.webRequestService.get<
      VinculacionActividadItem[]
    >(`${this.endpoint}/list`);
  }

  /**
   * Catálogo de tipos de vinculación (RVDIES.TIPOVINCULACION).
   *
   * @returns Observable con las opciones del select.
   */
  tiposVinculacion(): Observable<CatalogoOpcion[]> {
    return this.webRequestService.get<CatalogoOpcion[]>(
      `${this.endpoint}/catalogs/tipos-vinculacion`,
    );
  }

  /**
   * Catálogo de actividades seleccionables (RVDIES.TIPOACTIVIDADES).
   *
   * @returns Observable con las opciones agrupadas por actividad padre.
   */
  tiposActividad(): Observable<CatalogoOpcion[]> {
    return this.webRequestService.get<CatalogoOpcion[]>(
      `${this.endpoint}/catalogs/tipos-actividad`,
    );
  }

  /**
   * Registra una nueva vinculación de actividad.
   *
   * @param payload Información del registro a crear.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
   */
  save(
    payload: VinculacionActividadFormData,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save`,
      payload,
    );
  }

  /**
   * Actualiza una vinculación de actividad existente.
   *
   * @param id Identificador del registro.
   * @param payload Información actualizada.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
   */
  update(
    id: number,
    payload: VinculacionActividadFormData,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update/${id}`,
      payload,
    );
  }

  /**
   * Elimina una vinculación de actividad por su identificador.
   *
   * @param id Identificador del registro.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
   */
  delete(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/delete/${id}`,
    );
  }

  /**
   * Elimina varios registros en una sola operación.
   *
   * @param payload Identificadores a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
   */
  deleteBulk(
    payload: DeleteBulkVinculacionActividadesRequest,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-bulk`,
      payload,
    );
  }
}
