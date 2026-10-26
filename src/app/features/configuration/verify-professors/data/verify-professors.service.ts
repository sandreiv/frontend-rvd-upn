import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import { UniversityPeriodItem } from '../../preload-call/model/preload-call.model';
import { ProfessorLoadSummaryApi } from '../../professor-preload/model/professor-summary.model';
import {
  AcademicCoordinationItem,
  PendingVerifyProfessorsList,
  VerifyPreloadCallItem,
  VerifyProfessorItem,
  VerifyProfessorsFilter,
} from '../model/verify-professors.model';

@Injectable({
  providedIn: 'root',
})
export class VerifyProfessorsService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/verify-professor';

  /**
   * Obtiene los periodos universitarios disponibles para el filtro.
   *
   * @returns Observable con los periodos universitarios.
  */

  listUniversityPeriod(): Observable<UniversityPeriodItem[]> {
    return this.webRequestService.get<UniversityPeriodItem[]>(
      `${this.endpoint}/list-university-period`,
    );
  }

  /**
   * Obtiene las convocatorias activas correspondientes al periodo seleccionado.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @returns Observable con las convocatorias activas.
  */

  listActivePreloadCalls(
    idPeriodoUniversidad: number,
  ): Observable<VerifyPreloadCallItem[]> {
    return this.webRequestService.get<VerifyPreloadCallItem[]>(
      `${this.endpoint}/list-active-preload-calls`,
      { idPeriodoUniversidad },
    );
  }

  /**
   * Lista las coordinaciones académicas con docentes pendientes
   * de verificación en el periodo y convocatoria indicados.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @param idConvocatoria Identificador de la convocatoria.
   * @returns Observable con las coordinaciones disponibles.
  */

  listAcademicCoordinations(
    idPeriodoUniversidad: number,
    idConvocatoria: number,
  ): Observable<AcademicCoordinationItem[]> {
    return this.webRequestService.get<AcademicCoordinationItem[]>(
      `${this.endpoint}/list-academic-coordinations`,
      { idPeriodoUniversidad, idConvocatoria },
    );
  }

  /**
   * Lista los docentes que se encuentran en estado para verificar.
   *
   * @param filter Filtros utilizados para consultar los docentes.
   * @returns Observable con los docentes encontrados.
  */

  listProfessors(filter: VerifyProfessorsFilter): Observable<VerifyProfessorItem[]> {
    return this.webRequestService.get<VerifyProfessorItem[]>(
      `${this.endpoint}/list-professors`,
      {
        idPeriodoUniversidad: filter.idPeriodoUniversidad,
        idConvocatoria: filter.idConvocatoria,
        idCoordinacion: filter.idCoordinacion,
      },
    );
  }

  /**
   * Lista los docentes pendientes de verificación utilizados
   * para indicadores o notificaciones del módulo.
   *
   * @returns Observable con los docentes pendientes.
  */

  listPendingProfessors(): Observable<PendingVerifyProfessorsList> {
    return this.webRequestService.get<PendingVerifyProfessorsList>(
      `${this.endpoint}/pending`,
    );
  }

  /**
   * Obtiene el resumen completo de una carga docente.
   *
   * @param idCargaDocente Identificador de la carga docente.
   * @returns Observable con contratación, actividades y centros de costo.
  */

  getProfessorLoadSummary(
    idCargaDocente: number,
  ): Observable<ProfessorLoadSummaryApi> {
    return this.webRequestService.get<ProfessorLoadSummaryApi>(
      `${this.endpoint}/professor-load-summary/${idCargaDocente}`,
    );
  }

  /**
   * Verifica una carga docente y registra la observación asociada al proceso.
   *
   * @param idCargaDocente Identificador de la carga docente.
   * @param observacion Observación registrada durante la verificación.
   * @returns Observable sin contenido cuando la verificación finaliza correctamente.
  */

  verifyProfessor(
    idCargaDocente: number,
    observacion: string,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/verify/${idCargaDocente}`,
      { observacion },
    );
  }

  /**
   * Devuelve una carga docente para corrección y registra
   * la observación correspondiente.
   *
   * @param idCargaDocente Identificador de la carga docente.
   * @param observacion Motivo u observación de la devolución.
   * @returns Observable sin contenido cuando la devolución finaliza correctamente.
  */

  declineProfessor(
    idCargaDocente: number,
    observacion: string,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/decline/${idCargaDocente}`,
      { observacion },
    );
  }

  
}
