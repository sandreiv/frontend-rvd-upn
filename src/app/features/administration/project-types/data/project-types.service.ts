import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  DeleteBulkProjectTypesRequest,
  ProjectTypeFormData,
  ProjectTypeItem,
} from '../model/project-types.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectTypesService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/administration/projects/project-types';

  /**
   * Lista los tipos de proyecto registrados.
   *
   * @returns Observable con los tipos de proyecto disponibles.
  */

  listProjectTypes(): Observable<ProjectTypeItem[]> {
    return this.webRequestService.get<ProjectTypeItem[]>(
      `${this.endpoint}/list`,
    );
  }

  /**
   * Registra un nuevo tipo de proyecto.
   *
   * @param payload Información del tipo de proyecto a registrar.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  saveProjectType(payload: ProjectTypeFormData): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save`,
      payload,
    );
  }

  /**
   * Actualiza un tipo de proyecto existente.
   *
   * @param id Identificador del tipo de proyecto.
   * @param payload Información actualizada del tipo de proyecto.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updateProjectType(id: number, payload: ProjectTypeFormData): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update/${id}`,
      payload,
    );
  }

  /**
   * Elimina un tipo de proyecto por su identificador.
   *
   * @param id Identificador del tipo de proyecto.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deleteProjectType(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/delete/${id}`,
    );
  }

  /**
   * Elimina varios tipos de proyecto en una sola operación.
   *
   * @param payload Identificadores de los tipos de proyecto a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  deleteBulkProjectTypes(payload: DeleteBulkProjectTypesRequest): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-bulk`,
      payload,
    );
  }

}
