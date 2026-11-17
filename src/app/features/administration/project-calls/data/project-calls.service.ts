import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  ConvocatoriaOpcion,
  ProjectCallFormData,
  ProjectCallItem,
} from '../model/project-calls.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectCallsService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/administration/project-groups';

  /**
   * Lista los grupos de proyectos y convocatorias registradas.
   */
  listProjectCalls(): Observable<ProjectCallItem[]> {
    return this.webRequestService.get<ProjectCallItem[]>(
      `${this.endpoint}/list`,
    );
  }

  /**
   * Obtiene un grupo de proyectos por su identificador.
   */
  getProjectCallById(id: number): Observable<ProjectCallItem> {
    return this.webRequestService.get<ProjectCallItem>(
      `${this.endpoint}/${id}`,
    );
  }

  /**
   * Lista convocatorias disponibles para asociar.
   */
  listAvailableConvocatorias(): Observable<ConvocatoriaOpcion[]> {
    return this.webRequestService.get<ConvocatoriaOpcion[]>(
      `${this.endpoint}/available-convocatorias`,
    );
  }

  /**
   * Registra un nuevo grupo de proyectos.
   */
  saveProjectCall(payload: ProjectCallFormData): Observable<void> {
    return this.webRequestService.post<void>(
      this.endpoint,
      payload,
    );
  }

  /**
   * Actualiza un grupo de proyectos existente.
   */
  updateProjectCall(id: number, payload: ProjectCallFormData): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/${id}`,
      payload,
    );
  }

  /**
   * Elimina un grupo de proyectos por su identificador.
   */
  deleteProjectCall(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/${id}`,
    );
  }
}
