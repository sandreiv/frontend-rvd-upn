import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  DeleteBulkProjectCallsRequest,
  ProjectCallFormData,
  ProjectCallItem,
} from '../model/project-calls.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectCallsService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/administration/projects/project-calls';

  /**
   * Lista las convocatorias de proyectos registradas.
   *
   * @returns Observable con las convocatorias de proyectos disponibles.
  */

  listProjectCalls(): Observable<ProjectCallItem[]> {
    return this.webRequestService.get<ProjectCallItem[]>(
      `${this.endpoint}/list`,
    );
  }

  /**
   * Registra una nueva convocatoria de proyecto.
   *
   * @param payload Información de la convocatoria a registrar.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  saveProjectCall(payload: ProjectCallFormData): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save`,
      payload,
    );
  }

  /**
   * Actualiza una convocatoria de proyecto existente.
   *
   * @param id Identificador de la convocatoria.
   * @param payload Información actualizada de la convocatoria.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updateProjectCall(id: number, payload: ProjectCallFormData): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update/${id}`,
      payload,
    );
  }

  /**
   * Elimina una convocatoria de proyecto por su identificador.
   *
   * @param id Identificador de la convocatoria.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deleteProjectCall(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/delete/${id}`,
    );
  }

  /**
   * Elimina varias convocatorias de proyecto en una sola operación.
   *
   * @param payload Identificadores de las convocatorias a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  deleteBulkProjectCalls(payload: DeleteBulkProjectCallsRequest): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-bulk`,
      payload,
    );
  }
}
