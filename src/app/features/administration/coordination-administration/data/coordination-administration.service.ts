import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  CoordinationAssociationCatalogs,
  CoordinationAssociationFormData,
  CoordinationAssociationItem,
  DeleteBulkCoordinationAssociationRequest,
  CostCenterAssignmentFormData,
  CostCenterAssignmentItem,
  DeleteBulkCostCenterAssignmentRequest,
  PersonCoordinationFormData,
  PersonCoordinationItem,
  DeleteBulkPersonCoordinationRequest,
  CoordinationManagementCatalogs,
  CoordinationManagementFormData,
  CoordinationManagementItem,
  DeleteBulkCoordinationsRequest,
  CatalogOptionItem,
} from '../model/coordination-administration.model';

@Injectable({ providedIn: 'root' })
export class CoordinationAdministrationService {
  private readonly webRequestService = inject(WebRequestService);

  private readonly endpoint =
    '/configuration/administration/coordination-management';

  /**
   * Obtiene los catálogos requeridos para administrar asociaciones de coordinaciones.
   *
   * @returns Observable con los catálogos disponibles.
  */

  getCatalogs(): Observable<CoordinationAssociationCatalogs> {
    return this.webRequestService.get<CoordinationAssociationCatalogs>(
      `${this.endpoint}/coordination-associations/catalogs`,
    );
  }

  /**
   * Lista las asociaciones de coordinaciones registradas.
   *
   * @returns Observable con las asociaciones de coordinaciones.
  */

  listAssociations(): Observable<CoordinationAssociationItem[]> {
    return this.webRequestService.get<CoordinationAssociationItem[]>(
      `${this.endpoint}/coordination-associations/list`,
    );
  }

  /**
   * Registra una nueva asociación de coordinación.
   *
   * @param payload Información de la asociación a registrar.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  saveAssociation(payload: CoordinationAssociationFormData): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/coordination-associations/save`,
      payload,
    );
  }

  /**
   * Actualiza una asociación de coordinación existente.
   *
   * @param id Identificador de la asociación.
   * @param payload Información actualizada de la asociación.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updateAssociation(
    id: number,
    payload: CoordinationAssociationFormData,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/coordination-associations/update/${id}`,
      payload,
    );
  }

  /**
   * Elimina una asociación de coordinación.
   *
   * @param id Identificador de la asociación.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deleteAssociation(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/coordination-associations/delete/${id}`,
    );
  }

  /**
   * Elimina varias asociaciones de coordinaciones en una sola operación.
   *
   * @param payload Identificadores de las asociaciones a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
   */

  deleteBulk(
    payload: DeleteBulkCoordinationAssociationRequest,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/coordination-associations/delete-bulk`,
      payload,
    );
  }

  /**
   * Lista las asignaciones de centros de costo asociadas a coordinaciones.
   *
   * @returns Observable con las asignaciones registradas.
  */

  listCostCenterAssignments(): Observable<CostCenterAssignmentItem[]> {
    return this.webRequestService.get<CostCenterAssignmentItem[]>(
      `${this.endpoint}/cost-centers/list`,
    );
  }

  /**
   * Registra una asignación de centro de costo para una coordinación.
   *
   * @param payload Información de la asignación a registrar.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  saveCostCenterAssignment(
    payload: CostCenterAssignmentFormData,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/cost-centers/save`,
      payload,
    );
  }

  /**
   * Actualiza una asignación de centro de costo existente.
   *
   * @param id Identificador de la asignación.
   * @param payload Información actualizada de la asignación.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updateCostCenterAssignment(
    id: number,
    payload: CostCenterAssignmentFormData,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/cost-centers/update/${id}`,
      payload,
    );
  }

  /**
   * Elimina una asignación de centro de costo.
   *
   * @param id Identificador de la asignación.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deleteCostCenterAssignment(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/cost-centers/delete/${id}`,
    );
  }

  /**
   * Elimina varias asignaciones de centros de costo en una sola operación.
   *
   * @param payload Identificadores de las asignaciones a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  deleteBulkCostCenterAssignments(
    payload: DeleteBulkCostCenterAssignmentRequest,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/cost-centers/delete-bulk`,
      payload,
    );
  }

  /**
   * Lista las asociaciones existentes entre personas y coordinaciones.
   *
   * @returns Observable con las asociaciones persona-coordinación registradas.
  */

  listPeopleCoordinations(): Observable<PersonCoordinationItem[]> {
    return this.webRequestService.get<PersonCoordinationItem[]>(
      `${this.endpoint}/people/list`,
    );
  }

  /**
   * Asocia una persona a una coordinación.
   *
   * @param payload Información de la asociación persona-coordinación.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  savePeopleCoordination(
    payload: PersonCoordinationFormData,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/people/save`,
      payload,
    );
  }

  /**
   * Actualiza una asociación existente entre una persona y una coordinación.
   *
   * @param idPersonaGeneral Identificador de la persona.
   * @param idCoordinacion Identificador de la coordinación.
   * @param payload Información actualizada de la asociación.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updatePeopleCoordination(
    idPersonaGeneral: number,
    idCoordinacion: number,
    payload: PersonCoordinationFormData,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/people/update/${idPersonaGeneral}/${idCoordinacion}`,
      payload,
    );
  }

  /**
   * Elimina la asociación entre una persona y una coordinación.
   *
   * @param idPersonaGeneral Identificador de la persona.
   * @param idCoordinacion Identificador de la coordinación.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deletePeopleCoordination(
    idPersonaGeneral: number,
    idCoordinacion: number,
  ): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/people/delete/${idPersonaGeneral}/${idCoordinacion}`,
    );
  }

  /**
   * Elimina varias asociaciones persona-coordinación en una sola operación.
   *
   * @param payload Asociaciones que se desean eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  deleteBulkPeopleCoordinations(
    payload: DeleteBulkPersonCoordinationRequest,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/people/delete-bulk`,
      payload,
    );
  }

  /**
   * Lista las asociaciones entre docentes de planta y coordinaciones.
   *
   * @returns Observable con las asociaciones registradas.
  */

  listPlantProfessorCoordinations(): Observable<PersonCoordinationItem[]> {
    return this.webRequestService.get<PersonCoordinationItem[]>(
      `${this.endpoint}/plant-professors/list`,
    );
  }

  /**
   * Asocia un docente de planta a una coordinación.
   *
   * @param payload Información de la asociación docente-coordinación.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  savePlantProfessorCoordination(
    payload: PersonCoordinationFormData,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/plant-professors/save`,
      payload,
    );
  }

  /**
   * Actualiza la asociación entre un docente de planta y una coordinación.
   *
   * @param idPersonaGeneral Identificador del docente.
   * @param idCoordinacion Identificador de la coordinación.
   * @param payload Información actualizada de la asociación.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updatePlantProfessorCoordination(
    idPersonaGeneral: number,
    idCoordinacion: number,
    payload: PersonCoordinationFormData,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/plant-professors/update/${idPersonaGeneral}/${idCoordinacion}`,
      payload,
    );
  }

  /**
   * Elimina la asociación entre un docente de planta y una coordinación.
   *
   * @param idPersonaGeneral Identificador del docente.
   * @param idCoordinacion Identificador de la coordinación.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deletePlantProfessorCoordination(
    idPersonaGeneral: number,
    idCoordinacion: number,
  ): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/plant-professors/delete/${idPersonaGeneral}/${idCoordinacion}`,
    );
  }

  /**
   * Elimina varias asociaciones de docentes de planta con coordinaciones.
   *
   * @param payload Asociaciones que se desean eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  deleteBulkPlantProfessorCoordinations(
    payload: DeleteBulkPersonCoordinationRequest,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/plant-professors/delete-bulk`,
      payload,
    );
  }

  /**
   * Obtiene los catálogos requeridos para crear o editar coordinaciones.
   *
   * @returns Observable con los catálogos de administración de coordinaciones.
  */

  getCoordinationCatalogs(): Observable<CoordinationManagementCatalogs> {
    return this.webRequestService.get<CoordinationManagementCatalogs>(
        `${this.endpoint}/coordinations/catalogs`,
    );
  }

  /**
   * Busca unidades académicas que pueden utilizarse en la configuración
   * de una coordinación.
   *
   * @param term Texto utilizado para filtrar las unidades.
   * @returns Observable con las unidades encontradas.
  */

  searchUnits(term: string): Observable<CatalogOptionItem[]> {
    return this.webRequestService.get<CatalogOptionItem[]>(
        `${this.endpoint}/coordinations/units/search?term=${encodeURIComponent(term)}`,
    );
  }
  
  /**
   * Lista las coordinaciones de nivel superior disponibles en la administración.
   *
   * @returns Observable con las coordinaciones padre registradas.
  */

  listParentCoordinations(): Observable<CoordinationManagementItem[]> {
    return this.webRequestService.get<CoordinationManagementItem[]>(
        `${this.endpoint}/coordinations/parents/list`,
    );
  }

  /**
   * Lista las coordinaciones hijas de una coordinación padre.
   *
   * @param idPadre Identificador de la coordinación padre.
   * @returns Observable con las coordinaciones hijas.
  */

  listChildCoordinations(idPadre: number): Observable<CoordinationManagementItem[]> {
    return this.webRequestService.get<CoordinationManagementItem[]>(
        `${this.endpoint}/coordinations/${idPadre}/children/list`,
    );
  }

  /**
   * Registra una coordinación de nivel superior.
   *
   * @param payload Información de la coordinación a registrar.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  saveParentCoordination(payload: CoordinationManagementFormData): Observable<void> {
    return this.webRequestService.post<void>(
        `${this.endpoint}/coordinations/parents/save`,
        payload,
    );
  }

  /**
   * Registra una coordinación hija bajo una coordinación padre.
   *
   * @param idPadre Identificador de la coordinación padre.
   * @param payload Información de la coordinación hija.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  saveChildCoordination(
    idPadre: number,
    payload: CoordinationManagementFormData,
    ): Observable<void> {
    return this.webRequestService.post<void>(
        `${this.endpoint}/coordinations/${idPadre}/children/save`,
        payload,
    );
  }

  /**
   * Actualiza una coordinación existente.
   *
   * @param id Identificador de la coordinación.
   * @param payload Información actualizada de la coordinación.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updateCoordination(
    id: number,
    payload: CoordinationManagementFormData,
    ): Observable<void> {
    return this.webRequestService.put<void>(
        `${this.endpoint}/coordinations/update/${id}`,
        payload,
    );
  }

  /**
   * Elimina una coordinación por su identificador.
   *
   * @param id Identificador de la coordinación.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deleteCoordination(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
        `${this.endpoint}/coordinations/delete/${id}`,
    );
  }

  /**
   * Elimina varias coordinaciones en una sola operación.
   *
   * @param payload Identificadores de las coordinaciones a eliminar.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
  */

  deleteBulkCoordinations(
    payload: DeleteBulkCoordinationsRequest,
    ): Observable<void> {
    return this.webRequestService.post<void>(
        `${this.endpoint}/coordinations/delete-bulk`,
        payload,
    );
  }

}