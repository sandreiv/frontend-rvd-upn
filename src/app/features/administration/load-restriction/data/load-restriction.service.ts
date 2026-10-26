/**
 * Aplicación: rvd
 * Archivo: load-restriction.service.ts
 * Ruta: src/app/features/administration/load-restriction/data
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Fecha de creación: 22/07/2026
 * Modificaciones:
 * 22/07/2026 - Joel Daniel Arias Duarte - Creación inicial para consumo de servicios de restricción de carga.
 */
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  LoadRestrictionCatalogs,
  LoadRestrictionDetail,
  LoadRestrictionFormData,
  LoadRestrictionModalityItem,
} from '../model/load-restriction.model';

@Injectable({ providedIn: 'root' })
export class LoadRestrictionService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/administration/load-restriction';

  /**
   * Lista las modalidades de contratación disponibles
   * para configurar restricciones de carga.
   *
   * @returns Observable con las modalidades de contratación.
  */

  listModalities(): Observable<LoadRestrictionModalityItem[]> {
    return this.webRequestService.get<LoadRestrictionModalityItem[]>(
      `${this.endpoint}/modalities/list`,
    );
  }

  /**
   * Obtiene los catálogos requeridos para configurar una restricción de carga.
   *
   * @returns Observable con los catálogos utilizados por el formulario.
  */

  getCatalogs(): Observable<LoadRestrictionCatalogs> {
    return this.webRequestService.get<LoadRestrictionCatalogs>(
      `${this.endpoint}/restriction/catalogs`,
    );
  }

  /**
   * Consulta el detalle de la restricción configurada para una modalidad.
   *
   * @param idModalidadContratacion Identificador de la modalidad.
   * @returns Observable con el detalle de la restricción.
  */

  getRestriction(
    idModalidadContratacion: number,
  ): Observable<LoadRestrictionDetail> {
    return this.webRequestService.get<LoadRestrictionDetail>(
      `${this.endpoint}/restriction/${idModalidadContratacion}`,
    );
  }

  /**
   * Registra o actualiza la restricción de carga correspondiente a una modalidad.
   *
   * @param request Información enviada desde el formulario.
   * @returns Observable sin contenido cuando el guardado finaliza correctamente.
  */
 
  saveRestriction(request: LoadRestrictionFormData): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/restriction/save`,
      request,
    );
  }
}