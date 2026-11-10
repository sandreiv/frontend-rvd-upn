/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Servicio para administración de proyectos y participantes en esquema general
 * 10/11/2026 - Leonel Antonio Perez Rios - Inclusión de listado de tipos de actividad y búsqueda de personas desde el mismo endpoint
 * 10/11/2026 - Leonel Antonio Perez Rios - Inclusión de método para listar todos los proyectos y productos jerárquicamente
 */
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import { PersonaAutorizaConvocatoriaItem } from '../../../configuration/preload-call/model/preload-call.model';
import {
  DeleteBulkProjectsRequest,
  ProjectFormData,
  ProjectItem,
  ProjectPersonFormData,
  ProjectPersonItem,
  TipoActividadProyectoItem,
} from '../model/projects.model';

@Injectable({
  providedIn: 'root',
})
export class ProjectsService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/administration/projects';

  /**
   * Lista todos los proyectos y productos jerárquicamente para visualización en árbol.
   *
   * @returns Observable con todos los proyectos y productos.
   */
  listAllProjects(): Observable<ProjectItem[]> {
    return this.webRequestService.get<ProjectItem[]>(`${this.endpoint}/all`);
  }

  /**
   * Lista los proyectos registrados en el módulo de administración.
   *
   * @returns Observable con los proyectos disponibles.
   */
  listProjects(): Observable<ProjectItem[]> {
    return this.webRequestService.get<ProjectItem[]>(`${this.endpoint}/list`);
  }

  /**
   * Lista los tipos de actividad disponibles para proyectos desde el mismo controlador.
   *
   * @returns Observable con los tipos de actividad jerárquicos.
   */
  listProjectActivityTypes(): Observable<TipoActividadProyectoItem[]> {
    return this.webRequestService.get<TipoActividadProyectoItem[]>(
      `${this.endpoint}/activity-types`,
    );
  }

  /**
   * Lista los productos asociados a un proyecto.
   *
   * @param idProyecto Identificador del proyecto.
   * @returns Observable con los productos asociados al proyecto.
   */
  listProducts(idProyecto: number): Observable<ProjectItem[]> {
    return this.webRequestService.get<ProjectItem[]>(`${this.endpoint}/list-products`, {
      idProyecto,
    });
  }

  /**
   * Registra un nuevo proyecto o producto.
   *
   * @param payload Información del proyecto a registrar.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
   */
  saveProject(payload: ProjectFormData): Observable<void> {
    return this.webRequestService.post<void>(`${this.endpoint}/save`, payload);
  }

  /**
   * Actualiza un proyecto o producto existente.
   *
   * @param id Identificador del proyecto.
   * @param payload Información actualizada del proyecto.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
   */
  updateProject(id: number, payload: ProjectFormData): Observable<void> {
    return this.webRequestService.put<void>(`${this.endpoint}/update/${id}`, payload);
  }

  /**
   * Elimina un proyecto o producto por su identificador.
   *
   * @param id Identificador del proyecto.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
   */
  deleteProject(id: number): Observable<void> {
    return this.webRequestService.delete<void>(`${this.endpoint}/delete/${id}`);
  }

  /**
   * Elimina varios proyectos en una sola operación.
   *
   * @param payload Identificadores de los proyectos a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
   */
  deleteBulkProjects(payload: DeleteBulkProjectsRequest): Observable<void> {
    return this.webRequestService.post<void>(`${this.endpoint}/delete-bulk`, payload);
  }

  /**
   * Lista los participantes asociados a un proyecto.
   *
   * @param idProyecto Identificador del proyecto.
   * @returns Observable con las personas asociadas al proyecto.
   */
  listProjectPersons(idProyecto: number): Observable<ProjectPersonItem[]> {
    return this.webRequestService.get<ProjectPersonItem[]>(`${this.endpoint}/participants/list`, {
      idProyecto,
    });
  }

  /**
   * Registra una persona en un proyecto.
   *
   * @param payload Información de la persona a vincular.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
   */
  saveProjectPerson(payload: ProjectPersonFormData): Observable<void> {
    return this.webRequestService.post<void>(`${this.endpoint}/participants/save`, payload);
  }

  /**
   * Actualiza la información de una persona vinculada a un proyecto.
   *
   * @param id Identificador del registro persona-proyecto.
   * @param payload Información actualizada de la persona en el proyecto.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
   */
  updateProjectPerson(id: number, payload: ProjectPersonFormData): Observable<void> {
    return this.webRequestService.put<void>(`${this.endpoint}/participants/update/${id}`, payload);
  }

  /**
   * Elimina una persona de un proyecto.
   *
   * @param id Identificador del registro persona-proyecto.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
   */
  deleteProjectPerson(id: number): Observable<void> {
    return this.webRequestService.delete<void>(`${this.endpoint}/participants/delete/${id}`);
  }

  /**
   * Elimina varias personas de un proyecto en una sola operación.
   *
   * @param payload Identificadores de las relaciones persona-proyecto a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
   */
  deleteBulkProjectPersons(payload: DeleteBulkProjectsRequest): Observable<void> {
    return this.webRequestService.post<void>(`${this.endpoint}/participants/delete-bulk`, payload);
  }

  /**
   * Busca coordinaciones para asociar a los proyectos.
   *
   * @param term Término de búsqueda por nombre o código.
   * @returns Observable con la lista de coordinaciones coincidentes.
   */
  searchCoordinations(term?: string): Observable<{ id: number; nombre: string; descripcion?: string | null }[]> {
    const params: Record<string, string> = {};
    if (term?.trim()) {
      params['term'] = term.trim();
    }
    return this.webRequestService.get<{ id: number; nombre: string; descripcion?: string | null }[]>(
      `${this.endpoint}/coordinations`,
      params,
    );
  }

  /**
   * Busca docentes/personas generales por nombre o documento para asociar al proyecto.
   *
   * @param term Término de búsqueda por nombre o número de documento.
   * @returns Observable con la lista de personas coincidentes.
   */
  searchPersons(term?: string): Observable<PersonaAutorizaConvocatoriaItem[]> {
    const params: Record<string, string> = {};
    if (term?.trim()) {
      params['term'] = term.trim();
    }
    return this.webRequestService.get<PersonaAutorizaConvocatoriaItem[]>(
      `${this.endpoint}/persons/search`,
      params,
    );
  }
}
