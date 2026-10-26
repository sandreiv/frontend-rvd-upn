import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  DeleteBulkProjectsRequest,
  ProjectFormData,
  ProjectItem,
  ProjectPersonFormData,
  ProjectPersonItem,
} from '../model/projects.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/administration/projects';

  /**
   * Lista los proyectos registrados en el módulo de administración.
   *
   * @returns Observable con los proyectos disponibles.
  */

  listProjects(): Observable<ProjectItem[]> {
    return this.webRequestService.get<ProjectItem[]>(`${this.endpoint}/list`);
  }

  /**
   * Lista los productos asociados a un proyecto.
   *
   * @param idProyecto Identificador del proyecto.
   * @returns Observable con los productos asociados al proyecto.
  */

  listProducts(idProyecto: number): Observable<ProjectItem[]> {
    return this.webRequestService.get<ProjectItem[]>(
      `${this.endpoint}/list-products`,
      { idProyecto },
    );
  }

  /**
   * Registra un nuevo proyecto.
   *
   * @param payload Información del proyecto a registrar.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  saveProject(payload: ProjectFormData): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save`,
      payload,
    );
  }

  /**
   * Actualiza la información de un proyecto existente.
   *
   * @param id Identificador del proyecto.
   * @param payload Información actualizada del proyecto.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updateProject(id: number, payload: ProjectFormData): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update/${id}`,
      payload,
    );
  }

  /**
   * Elimina un proyecto por su identificador.
   *
   * @param id Identificador del proyecto.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deleteProject(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/delete/${id}`,
    );
  }

  /**
   * Elimina varios proyectos en una sola operación.
   *
   * @param payload Identificadores de los proyectos a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  deleteBulkProjects(payload: DeleteBulkProjectsRequest): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-bulk`,
      payload,
    );
  }

  /**
   * Lista las personas asociadas a un proyecto.
   *
   * @param idProyecto Identificador del proyecto.
   * @returns Observable con las personas asociadas al proyecto.
  */

  listProjectPersons(idProyecto: number): Observable<ProjectPersonItem[]> {
    return this.webRequestService.get<ProjectPersonItem[]>(
      `${this.endpoint}/list-persons`,
      { idProyecto },
    );
  }

  /**
   * Registra una persona asociada a un proyecto.
   *
   * @param payload Información de la asociación entre la persona y el proyecto.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  saveProjectPerson(payload: ProjectPersonFormData): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save-person`,
      payload,
    );
  }

  /**
   * Actualiza una asociación existente entre una persona y un proyecto.
   *
   * @param id Identificador de la asociación.
   * @param payload Información actualizada de la asociación.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updateProjectPerson(id: number, payload: ProjectPersonFormData): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update-person/${id}`,
      payload,
    );
  }

  /**
   * Elimina una persona asociada a un proyecto.
   *
   * @param id Identificador de la asociación persona-proyecto.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deleteProjectPerson(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/delete-person/${id}`,
    );
  }

  /**
   * Elimina varias asociaciones de personas con proyectos en una sola operación.
   *
   * @param payload Identificadores de las asociaciones a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  deleteBulkProjectPersons(payload: DeleteBulkProjectsRequest): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-persons-bulk`,
      payload,
    );
  }

}
