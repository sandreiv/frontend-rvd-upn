import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  DeleteBulkNoveltiesRequest,
  NoveltyFormData,
  NoveltyItem,
} from '../model/novelties.model';

@Injectable({
  providedIn: 'root',
})
export class NoveltiesService {
  private readonly webRequestService =
    inject(WebRequestService);

  private readonly endpoint =
    '/configuration/administration/novelties';

  /**
   * Lista las novedades configuradas en el catálogo de administración.
   *
   * @returns Observable con las novedades disponibles.
  */  

  listNovelties(): Observable<NoveltyItem[]> {
    return this.webRequestService.get<NoveltyItem[]>(
      `${this.endpoint}/list`,
    );
  }

  /**
   * Registra una nueva novedad en el catálogo.
   *
   * @param payload Información de la novedad a registrar.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  saveNovelty(
    payload: NoveltyFormData,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save`,
      payload,
    );
  }

  /**
   * Actualiza una novedad existente del catálogo.
   *
   * @param id Identificador de la novedad.
   * @param payload Información actualizada de la novedad.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updateNovelty(
    id: number,
    payload: NoveltyFormData,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update/${id}`,
      payload,
    );
  }

  /**
   * Elimina una novedad del catálogo por su identificador.
   *
   * @param id Identificador de la novedad.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deleteNovelty(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/delete/${id}`,
    );
  }

  /**
   * Elimina varias novedades del catálogo en una sola operación.
   *
   * @param payload Identificadores de las novedades a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  deleteBulkNovelties(
    payload: DeleteBulkNoveltiesRequest,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-bulk`,
      payload,
    );
  }
  
}