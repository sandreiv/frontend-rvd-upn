import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  SearchGeneralPersonParams,
  UniversityPeriodItem,
} from '../../preload-call/model/preload-call.model';
import {
  CoordinationApiItem,
  CoordinationItem,
  CoordinationPreloadCallApi,
  normalizeCoordinationItem,
  ProfessorSearchResult,
  ValuePointsPreload,
} from '../model/coordination.model';
import { AddProfessorPayload } from '../model/add-professor.model';
import { ProfessorLoadItem } from '../model/professor-load.model';
import { ActivityRestrictionItem, ActivityTypeNode } from '../model/professor-activities.model';
import { LinkageTypeItem, LinkageTypeListResponse } from '../model/linkage-type.model';
import { ContractHours, ContractValue, ContractValueQuery } from '../model/professor-form.config';

@Injectable({
  providedIn: 'root',
})
export class CoordinationService {
  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/load';

  /**
   * Obtiene las convocatorias activas del periodo universitario.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @returns Observable con las convocatorias activas del periodo.
   */
  getActivePreloadCall(idPeriodoUniversidad: number): Observable<CoordinationPreloadCallApi[]> {
    return this.webRequestService.get<CoordinationPreloadCallApi[]>(
      `${this.endpoint}/list-active-calls`,
      { idPeriodoUniversidad },
    );
  }

  /**
   * Lista los periodos universitarios disponibles.
   *
   * @returns Observable con los periodos universitarios.
   */
  getUniversityPeriod(): Observable<UniversityPeriodItem[]> {
    return this.webRequestService.get<UniversityPeriodItem[]>(
      `${this.endpoint}/list-university-period`,
    );
  }

  /**
   * Lista las coordinaciones de la persona en un periodo universitario.
   * Si se envía convocatoria, debe pertenecer a ese periodo.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @param idConvocatoria Identificador opcional de la convocatoria.
   * @returns Observable con las coordinaciones encontradas.
   */
  getCoordinations(
    idPeriodoUniversidad: number,
    idConvocatoria?: number | null,
  ): Observable<CoordinationItem[]> {
    const params: Record<string, number> = {
      idPeriodoUniversidad,
    };

    if (idConvocatoria != null) {
      params['idConvocatoria'] = idConvocatoria;
    }

    return this.webRequestService
      .get<CoordinationApiItem[]>(`${this.endpoint}/list`, params)
      .pipe(map((items) => items.map(normalizeCoordinationItem)));
  }

  /**
   * Lista los tipos de vinculación de una convocatoria.
   *
   * @param idConvocatoria Identificador de la convocatoria.
   * @returns Observable con los tipos de vinculación.
   */
  listLinkageTypes(idConvocatoria: number): Observable<LinkageTypeItem[]> {
    return this.webRequestService
      .get<LinkageTypeListResponse>(`${this.endpoint}/list-linkage-types`, {
        idConvocatoria,
      })
      .pipe(map((response) => response.tipoVinculaciones ?? []));
  }

  /**
   * Lista los docentes asociados a un tipo de vinculación de la convocatoria.
   *
   * @param idTipoVinculacionConvocatoria Identificador de la vinculación en la convocatoria.
   * @returns Observable con los docentes de esa vinculación.
   */
  listProfessors(idTipoVinculacionConvocatoria: number): Observable<ProfessorLoadItem[]> {
    return this.webRequestService.get<ProfessorLoadItem[]>(`${this.endpoint}/list-professors`, {
      idTipoVinculacionConvocatoria,
    });
  }

  /**
   * Lista el árbol de tipos de actividad. Solo llegan los padres;
   * cada nodo incluye sus descendientes en hijos.
   *
   * @returns Observable con los tipos de actividad activos e inactivos.
   */
  listActivityTypes(): Observable<ActivityTypeNode[]> {
    return this.webRequestService.get<ActivityTypeNode[]>(`${this.endpoint}/list-activity-types`);
  }

  /**
   * Lista las actividades que no se muestran para un tipo de vinculación.
   *
   * @param idTipoVinculacion Identificador de RVDIES.TIPOVINCULACION.
   * @returns Observable con las restricciones. Vacío si no hay ninguna.
   */
  listActivityRestrictions(idTipoVinculacion: number): Observable<ActivityRestrictionItem[]> {
    return this.webRequestService.get<ActivityRestrictionItem[]>(
      `${this.endpoint}/list-activity-restrictions`,
      { idTipoVinculacion },
    );
  }

  /**
   * Busca docentes por documento o nombre en un año de vigencia.
   * El año es obligatorio para calcular valor del punto y asignación salarial.
   *
   * @param params Criterios de documento o nombre.
   * @param anio Año de la vigencia de puntos.
   * @returns Observable con los docentes, su categoría, puntos, valor del punto y asignación salarial.
   */
  searchProfesor(
    params: SearchGeneralPersonParams,
    anio: number,
  ): Observable<ProfessorSearchResult[]> {
    return this.webRequestService.get<ProfessorSearchResult[]>(
      `${this.endpoint}/search-professor`,
      this.buildProfessorSearchQuery(params, anio),
    );
  }

  /**
   * Busca docentes de carrera o planta por documento o nombre.
   * Solo incluye personas con escalafón y vínculo laboral vigente.
   *
   * @param params Criterios de documento o nombre.
   * @param anio Año de la vigencia de puntos.
   * @returns Observable con los docentes de planta, su categoría, puntos, valor del punto y asignación salarial.
   */
  searchCareerProfessor(
    params: SearchGeneralPersonParams,
    anio: number,
  ): Observable<ProfessorSearchResult[]> {
    return this.webRequestService.get<ProfessorSearchResult[]>(
      `${this.endpoint}/search-career-professor`,
      this.buildProfessorSearchQuery(params, anio),
    );
  }

  /**
   * Agrega un docente a la carga de la coordinación.
   * El estado, la vigencia y la auditoría los completa el backend.
   *
   * @param payload Datos del docente y de la vinculación.
   * @returns Observable vacío cuando el registro se guarda.
   */
  addProfessor(payload: AddProfessorPayload): Observable<void> {
    return this.webRequestService.post<void>(`${this.endpoint}/add-professor`, payload);
  }

  /**
   * Obtiene el mínimo y el máximo de horas del tipo de vinculación.
   * El mínimo puede venir vacío.
   *
   * @param idTipoVinculacion Identificador del tipo de vinculación.
   * @returns Observable con el mínimo y el máximo guardados.
   */
  getContractHours(idTipoVinculacion: number): Observable<ContractHours> {
    return this.webRequestService.get<ContractHours>(`${this.endpoint}/contract-hours`, {
      idTipoVinculacion,
    });
  }

  /**
   * Calcula valor del contrato, prestaciones y total según la forma de pago
   * del tipo de vinculación.
   *
   * @param query Datos que exige la fórmula. Las claves ausentes no se envían.
   * @returns Observable con el valor calculado.
   */
  calculateContractValue(query: ContractValueQuery): Observable<ContractValue> {
    const params: Record<string, string | number> = {
      idTipoVinculacion: query.idTipoVinculacion,
      fechaInicio: query.fechaInicio,
      fechaFin: query.fechaFin,
    };

    this.appendQueryNumber(params, 'asignacionSalarial', query.asignacionSalarial);
    this.appendQueryNumber(params, 'valorPunto', query.valorPunto);
    this.appendQueryNumber(params, 'horasSemanales', query.horasSemanales);
    this.appendQueryNumber(params, 'semanas', query.semanas);
    this.appendQueryNumber(params, 'valorHora', query.valorHora);

    if (query.puntos?.trim()) {
      params['puntos'] = query.puntos.trim();
    }

    return this.webRequestService.get<ContractValue>(`${this.endpoint}/contract-value`, params);
  }

  private buildProfessorSearchQuery(
    params: SearchGeneralPersonParams,
    anio: number,
  ): Record<string, string | number> {
    const query: Record<string, string | number> = { anio };
    const documento = params.documento?.trim();
    const nombre = params.nombre?.trim();

    if (documento) {
      query['documento'] = documento;
    }
    if (nombre) {
      query['nombre'] = nombre;
    }

    return query;
  }

  private appendQueryNumber(
    params: Record<string, string | number>,
    key: string,
    value: number | undefined,
  ): void {
    if (value == null || Number.isNaN(value)) {
      return;
    }

    params[key] = value;
  }
}
