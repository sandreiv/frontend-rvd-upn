import { Injectable, inject } from '@angular/core';
import { map, Observable } from 'rxjs';
import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  AssignNameNnRequest,
  ChangeProfessorRequest,
  DeleteProfessorRequest,
  CategoriaCatedratico,
  CoordinationApiItem,
  ContractModalityItem,
  CoordinationItem,
  CoordinationPreloadCallApi,
  LoadRestrictionPreview,
  ModalityProfessor,
  ProfessorSearchResult,
  ActivitiesHours,
  TotalPreload,
  ValuePointsPreload,
  WorkDate,
  normalizeCoordinationItem,
  UpdateContractValueRequest,
  AddNoveltyProfessorRequest,
  RejectProfessorNoveltyRequest,
} from '../model/coordination.model';
import { SavePreloadRequest } from '../model/save-preload.model';
import { AddProfessorRequest } from '../model/add-professor.model';
import { SearchGeneralPersonParams, UniversityPeriodItem } from '../../preload-call/model/preload-call.model';
import {
  ActividadModalidadDTO,
  GrupoMateria,
  MateriaAcademica,
  ProgramHourRestriction,
  ProgramaAcademico,
  TipoActividad,
  TipoActividadCriterio,
  UnidadRegional,
} from '../model/professor-activities.model';
import { ProyectoDocenteDto } from '../model/professor-projects.model';
import { DetailProfessorPreloadApi, DetailProfessorPreloadItemApi } from '../model/detail-professor-preload.model';
import { SaveDetailProfessorPreloadRequest, SendProfessorToVerificationRequest } from '../model/save-detail-professor-preload.model';
import { SaveCareerProfessorPreloadRequest } from '../model/save-career-professor-preload.model';
import { ProfessorLoadSummaryApi } from '../model/professor-summary.model';
import { ProfessorNoveltySummaryApi } from '../model/novelty-summary.model';
import { DeclinePreloadDeanRequest } from '../model/preload-carga.model';
import { ObservacionesCargaItem } from '../model/observations-load';
import { FacultyCoordinationItem, FacultyRequestCdpApiItem, normalizeFacultyRequestCdpItem } from '../../cdp-requests/model/cdp-context.model';
import { NoveltiesItem } from '../model/novelties.model';
import {
  SaveNovedadCargaDocenteRequest,
  SaveNoveltyProjectActivitiesRequest,
} from '../model/novelty-carga-docente.model';
import { CargaBudget } from '../model/carga-budget.model';
import { GeneralNoveltyHistoryItem } from '../model/novelty-history.model';

@Injectable({
  providedIn: 'root',
})
export class CoordinationService {

  private readonly webRequestService = inject(WebRequestService);
  private readonly endpoint = '/configuration/coordination';
  private readonly cdpEndpoint = '/configuration/cdp';


  /**
   * Obtiene las convocatorias de precarga activas del periodo universitario.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @returns Observable con las convocatorias activas del periodo.
  */

  getActivePreloadCall(idPeriodoUniversidad: number): Observable<CoordinationPreloadCallApi[]> {
    return this.webRequestService.get<CoordinationPreloadCallApi[]>(
      `${this.endpoint}/list-active-preload-calls`,
      { idPeriodoUniversidad },
    );
  }

  /**
   * Obtiene las convocatorias activas que pueden asignarse libremente.
   * Excluye las convocatorias con restricciones vigentes.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @returns Observable con las convocatorias disponibles para asignación.
  */

  getAssignablePreloadCalls(idPeriodoUniversidad: number): Observable<CoordinationPreloadCallApi[]> {
    return this.webRequestService.get<CoordinationPreloadCallApi[]>(
      `${this.endpoint}/list-assignable-preload-calls`,
      { idPeriodoUniversidad },
    );
  }

  /**
   * Lista las coordinaciones de un periodo universitario.
   * Cuando se envía convocatoria, limita los resultados al contexto indicado.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @param idConvocatoria Identificador opcional de la convocatoria.
   * @returns Observable con las coordinaciones encontradas.
  */

  getCoordinations(idPeriodoUniversidad: number, idConvocatoria?: number | null): Observable<CoordinationItem[]> {
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
   * Lista las coordinaciones disponibles para el trámite de Solicitudes CDP.
   * El backend retorna únicamente cargas en estado AVAL DESARROLLO
   * pertenecientes a la facultad y convocatoria indicadas.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @param idConvocatoria Identificador de la convocatoria.
   * @param idCoordinacionFacultad Identificador de la facultad.
   * @returns Observable con las coordinaciones habilitadas para CDP.
  */

  getCdpRequests(
    idPeriodoUniversidad: number,
    idConvocatoria: number,
    idCoordinacionFacultad: number,
  ): Observable<CoordinationItem[]> {
    return this.webRequestService
      .get<CoordinationApiItem[]>(
        `${this.cdpEndpoint}/requests`,
        {
          idPeriodoUniversidad,
          idConvocatoria,
          idCoordinacionFacultad,
        },
      )
      .pipe(
        map((items) =>
          items.map(normalizeCoordinationItem),
        ),
      );
  }

  /**
   * Lista las facultades con solicitudes CDP disponibles para revisión
   * según el rol de Desarrollo Académico o Vicerrectoría Académica.
   *
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @returns Observable con las facultades y solicitudes CDP correspondientes.
  */

  getCdpRequestsForAcademics(idPeriodoUniversidad: number): Observable<FacultyCoordinationItem[]> {
    return this.webRequestService.get<FacultyRequestCdpApiItem[]>(
      `${this.cdpEndpoint}/requests-for-academics`,
        { idPeriodoUniversidad },
    )
    .pipe(
      map((items) =>
        items.map(normalizeFacultyRequestCdpItem),
      ),
    );
  }

  /**
   * Asigna o actualiza la convocatoria asociada a una coordinación.
   * El backend valida restricciones y disponibilidad de la convocatoria.
   *
   * @param request Información de la coordinación y convocatoria a asignar.
   * @returns Observable sin contenido cuando la operación finaliza correctamente.
  */

  savePreload(request: SavePreloadRequest): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save-preload`,
      request,
    );
  }

  /**
   * Busca docentes por documento o nombre y permite filtrar opcionalmente
   * por modalidad de contratación.
   *
   * @param params Criterios de búsqueda del docente.
   * @returns Observable con los docentes que coinciden con los criterios enviados.
  */
  
  searchProfesor(params: SearchGeneralPersonParams,): Observable<ProfessorSearchResult[]> {
    const query: Record<string, string | number> = {};
    const documento = params.documento?.trim();
    const nombre = params.nombre?.trim();

    if (documento) {
      query['documento'] = documento;
    }
    if (nombre) {
      query['nombre'] = nombre;
    }
    if (params.idModalidadContratacion != null) {
      query['idModalidadContratacion'] = params.idModalidadContratacion;
    }
    if (params.idConvocatoria != null) {
      query['idConvocatoria'] = params.idConvocatoria;
    }

    return this.webRequestService.get<ProfessorSearchResult[]>(
      `${this.endpoint}/search-professor`,
      query,
    );
  }

  /**
   * Busca docentes disponibles para ser asignados a una carga
   * o utilizados dentro de una novedad.
   *
   * @param params Criterios de búsqueda del docente disponible.
   * @returns Observable con los docentes disponibles en el contexto actual.
  */

  searchFreeProfessor(
    params: SearchGeneralPersonParams,
  ): Observable<ProfessorSearchResult[]> {

    const query: Record<string, string | number> = {};

    const documento = params.documento?.trim();
    const nombre = params.nombre?.trim();

    if (documento) {
      query['documento'] = documento;
    }

    if (nombre) {
      query['nombre'] = nombre;
    }

    if (params.idModalidadContratacion != null) {
      query['idModalidadContratacion'] =
        params.idModalidadContratacion;
    }

    return this.webRequestService.get<ProfessorSearchResult[]>(
      `${this.endpoint}/search-free-professor`,
      query,
    );
  }

  /**
   * Lista los docentes asociados a una carga según la modalidad de contratación.
   *
   * @param idCarga Identificador de la carga.
   * @param idModalidadContratacion Identificador de la modalidad.
   * @returns Observable con los docentes de la modalidad seleccionada.
  */

  listProfessorsByModality(
    idCarga: number,
    idModalidadContratacion: number,
  ): Observable<ModalityProfessor[]> {
    return this.webRequestService.get<ModalityProfessor[]>(
      `${this.endpoint}/list-professors-modality`,
      { idCarga, idModalidadContratacion },
    );
  }

  /**
   * Lista los docentes de una carga según la modalidad de contratación
   * para el módulo de novedades.
   *
   * @param idCarga Identificador de la carga.
   * @param idModalidadContratacion Identificador de la modalidad.
   * @returns Observable con los docentes disponibles para gestión de novedades.
  */

  listAlterationProfessorsByModality(
    idCarga: number,
    idModalidadContratacion: number,
  ): Observable<ModalityProfessor[]> {
    return this.webRequestService.get<ModalityProfessor[]>(
      `${this.endpoint}/list-alteration-professors-modality`,
      { idCarga, idModalidadContratacion },
    );
  }

  /**
   * Lista  docentes de planta de la coordinación dueña de la carga.
   * La fila de CARGADOCENTE, si existe, no tiene modalidad de contratación.
   *
   * @param idCarga Identificador de la carga.
   * @returns Observable con los docentes de planta de la coordinación.
   */
  listCareerProfessorLoads(idCarga: number): Observable<ModalityProfessor[]> {
    return this.webRequestService.get<ModalityProfessor[]>(
      `${this.endpoint}/list-career-professor-loads`,
      { idCarga },
    );
  }

  /**
   * Lista  docentes de planta para el módulo de novedades.
   *
   * @param idCarga Identificador de la carga.
   * @returns Observable con los docentes de planta disponibles para novedades.
   */
  listCareerAlterationProfessors(
    idCarga: number,
  ): Observable<ModalityProfessor[]> {
    return this.webRequestService.get<ModalityProfessor[]>(
      `${this.endpoint}/list-career-alteration-professors`,
      { idCarga },
    );
  }

  /**
   * Obtiene el historial general de novedades de una carga.
   *
   * @param idCarga Identificador de la carga.
  */
  listGeneralNoveltyHistory(
    idCarga: number,
  ): Observable<GeneralNoveltyHistoryItem[]> {
    return this.webRequestService.get<
      GeneralNoveltyHistoryItem[]
    >(
      `${this.endpoint}/list-general-novelty-history`,
      { idCarga },
    );
  }

  /**
   * Obtiene las fechas de contratación aplicables a una carga y modalidad.
   *
   * @param idCarga Identificador de la carga.
   * @param idModalidadContratacion Identificador de la modalidad.
   * @returns Observable con las fechas configuradas.
  */

  getWorkDates(idCarga: number, idModalidadContratacion: number): Observable<WorkDate[]> {
    return this.webRequestService.get<WorkDate[]>(
      `${this.endpoint}/work-date`,
      { idCarga, idModalidadContratacion },
    );
  }

  /**
   * Consulta la restricción de carga configurada para una modalidad de contratación.
   *
   * @param idModalidadContratacion Identificador de la modalidad.
   * @returns Observable con la configuración de restricciones aplicable.
  */

  getLoadRestrictionByModality(idModalidadContratacion: number): Observable<LoadRestrictionPreview> {
    return this.webRequestService.get<LoadRestrictionPreview>(
      `/configuration/administration/load-restriction/restriction/${idModalidadContratacion}`,
    );
  }

  /**
   * Obtiene los valores económicos y de puntos necesarios para calcular
   * la precarga de un docente.
   *
   * @param anio Año de la vigencia.
   * @param idCategoriaCatedratico Identificador de la categoría.
   * @param idPersonaGeneral Identificador opcional del docente.
   * @param idModalidadContratacion Identificador de la modalidad.
   * @returns Observable con valor hora, valor punto, puntos y asignación salarial.
  */

  getValuePointsPreload(anio: number, idCategoriaCatedratico: number, idPersonaGeneral: number | null, idModalidadContratacion: number): Observable<ValuePointsPreload> {
    return this.webRequestService.get<ValuePointsPreload>(
      `${this.endpoint}/value-points-preload`,
      { anio, idCategoriaCatedratico, idPersonaGeneral, idModalidadContratacion },
    );
  }

  /**
   * Lista las categorías docentes disponibles para una modalidad de contratación.
   *
   * @param idModalidadContratacion Identificador de la modalidad.
   * @returns Observable con las categorías disponibles.
  */

  getCategoriaCatedratico(idModalidadContratacion: number,): Observable<CategoriaCatedratico[]> {
    return this.webRequestService.get<CategoriaCatedratico[]>(
      `${this.endpoint}/professor-category`,
      { idModalidadContratacion },
    );
  }

  /**
   * Registra un docente en la precarga.
   * El backend valida que la coordinación se encuentre habilitada para edición.
   *
   * @param request Información del docente, carga y modalidad de contratación.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
  */

  addProfessor(request: AddProfessorRequest): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/add-professor`,
      request,
    );
  }

  /**
   * Elimina un docente de la precarga.
   *
   * @param idCargaDocente Identificador de la carga docente.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deleteProfessor(idCargaDocente: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/delete-professor/${idCargaDocente}`,
    );
  }

  /**
   * Actualiza la información de un docente registrado en la precarga.
   *
   * @param idCargaDocente Identificador de la carga docente.
   * @param request Información actualizada del docente.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updateProfessor( idCargaDocente: number, request: AddProfessorRequest): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update-professor/${idCargaDocente}`,
      request,
    );
  }

  /**
   * Lista los criterios configurados para un tipo de actividad docente.
   *
   * @param idTipoActividad Identificador del tipo de actividad.
   * @returns Observable con los criterios asociados.
  */

  listCriteria(idTipoActividad: number): Observable<TipoActividadCriterio[]> {
    return this.webRequestService.get<TipoActividadCriterio[]>(
      `${this.endpoint}/list-criteria`,
      { idTipoActividad },
    );
  }

  /**
   * Lista las unidades regionales disponibles para una coordinación.
   *
   * @param idCoordinacion Identificador de la coordinación.
   * @returns Observable con las unidades regionales relacionadas.
  */

  listRegionalUnits(idCoordinacion: number): Observable<UnidadRegional[]> {
    return this.webRequestService.get<UnidadRegional[]>(
      `${this.endpoint}/list-regional-unit`,
      { idCoordinacion },
    );
  }

  /**
   * Lista los programas académicos según coordinación, unidad regional
   * y nivel educativo.
   *
   * @param idCoordinacion Identificador de la coordinación.
   * @param idUnidadRegional Identificador de la unidad regional.
   * @param idNivelEducativo Identificador del nivel educativo.
   * @returns Observable con los programas académicos encontrados.
  */

  listPrograms(idCoordinacion: number,idUnidadRegional: number,idNivelEducativo: number,): Observable<ProgramaAcademico[]> {
    return this.webRequestService.get<ProgramaAcademico[]>(
      `${this.endpoint}/list-program`,
      { idCoordinacion, idUnidadRegional, idNivelEducativo },
    );
  }

  /**
   * Lista las materias disponibles para un programa y una coordinación.
   *
   * @param idPrograma Identificador del programa académico.
   * @param idCoordinacion Identificador de la coordinación.
   * @returns Observable con las materias disponibles.
  */

  listSubjects(idPrograma: number, idCoordinacion: number): Observable<MateriaAcademica[]> {
    return this.webRequestService.get<MateriaAcademica[]>(
      `${this.endpoint}/list-subject`,
      { idPrograma, idCoordinacion },
    );
  }

  /**
   * Consulta las restricciones de horas por programa para una modalidad.
   * Cuando se envía la carga docente incluye horas asignadas y disponibles.
   *
   * @param idModalidadContratacion Identificador de la modalidad.
   * @param idCargaDocente Identificador opcional de la carga docente.
   * @returns Observable con las restricciones de horas por programa.
  */

  listProgramHourRestrictions(
    idModalidadContratacion: number,
    idCargaDocente?: number | null,
  ): Observable<ProgramHourRestriction[]> {
    const params: Record<string, number> = {
      idModalidadContratacion,
    };

    if (idCargaDocente != null) {
      params['idCargaDocente'] = idCargaDocente;
    }

    return this.webRequestService.get<ProgramHourRestriction[]>(
      `${this.endpoint}/program-hour-restriction`,
      params,
    );
  }

  /**
   * Lista los grupos disponibles para una materia dentro de un periodo universitario.
   *
   * @param codigoMateria Código de la materia.
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @returns Observable con los grupos encontrados.
  */

  listSubjectGroups(codigoMateria: string, idPeriodoUniversidad: number,): Observable<GrupoMateria[]> {
    return this.webRequestService.get<GrupoMateria[]>(
      `${this.endpoint}/list-subject-group`,
      { codigoMateria, idPeriodoUniversidad },
    );
  }

  /**
   * Lista los proyectos asociados a un docente dentro de una convocatoria.
   *
   * @param idPersonaGeneral Identificador de la persona general.
   * @param idConvocatoria Identificador de la convocatoria.
   * @returns Observable con los proyectos disponibles para el docente.
  */

  listProjectsProfessor(
    idPersonaGeneral: number,
    idConvocatoria: number,
  ): Observable<ProyectoDocenteDto[]> {
    return this.webRequestService.get<ProyectoDocenteDto[]>(
      `${this.endpoint}/list-projects-professor`,
      {
        idPersonaGeneral,
        idConvocatoria,
      },
    );
  }

  /**
   * Lista los tipos de actividad disponibles para la distribución
   * de la precarga docente.
   *
   * @returns Observable con los tipos de actividad configurados.
  */

  listActivityTypes(): Observable<TipoActividad[]> {
    return this.webRequestService.get<TipoActividad[]>(
      `${this.endpoint}/list-activity-types`,
    );
  }

  /**
   * Lista los tipos de actividad permitidos para una modalidad de contratación.
   *
   * @param idModalidadContratacion Identificador de la modalidad.
   * @returns Observable con las actividades permitidas.
  */

  listActivitiesModality(idModalidadContratacion: number): Observable<ActividadModalidadDTO> {
    return this.webRequestService.get<ActividadModalidadDTO>(
      `${this.endpoint}/list-activities-modality`,
      { idModalidadContratacion },
    );
  }

  /**
   * Guarda la distribución de actividades de un docente.
   * El backend valida que la coordinación pueda editar dentro de la convocatoria seleccionada.
   *
   * @param request Distribución de actividades de la precarga docente.
   * @returns Observable sin contenido cuando el guardado finaliza correctamente.
  */

  saveActivityDistribution(request: SaveDetailProfessorPreloadRequest): Observable<void> {
    console.log('request', request);
    return this.webRequestService.post<void>(
      `${this.endpoint}/save-detail-professor-preload`,
      request,
    );
  }

  /**
   * Consulta el detalle de la distribución de actividades de una carga docente.
   *
   * @param idCargaDocente Identificador de la carga docente.
   * @returns Observable con el detalle de actividades de la precarga.
  */

  listDetailProfessorPreload(idCargaDocente: number): Observable<DetailProfessorPreloadApi> {
    return this.webRequestService.get<DetailProfessorPreloadApi>(
      `${this.endpoint}/list-detail-professor-preload`,
      { idCargaDocente },
    );
  }

  /**
   * Consulta el detalle de actividades correspondiente a las novedades
   * de una carga docente.
   *
   * @param idCargaDocente Identificador de la carga docente.
   * @returns Observable con el detalle de actividades asociado a novedades.
  */

  listNoveltyDetailProfessorPreload(idCargaDocente: number): Observable<DetailProfessorPreloadApi> {
    return this.webRequestService.get<DetailProfessorPreloadApi>(
      `${this.endpoint}/list-novelty-detail-professor-preload`,
      { idCargaDocente },
    );
  }

  /**
   * Lista los periodos universitarios disponibles en el flujo de precarga docente.
   *
   * @returns Observable con los periodos universitarios.
  */

  getUniversityPeriod(): Observable<UniversityPeriodItem[]> {
    return this.webRequestService.get<UniversityPeriodItem[]>(
      `${this.endpoint}/list-university-period`,
    );
  }

  /**
   * Actualiza una actividad específica dentro de la distribución
   * de precarga docente.
   *
   * @param detalle Información de la actividad a actualizar.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  updateDetailProfessorPreload(detalle: DetailProfessorPreloadItemApi): Observable<void> {
    const payload: DetailProfessorPreloadItemApi = {
      idDetalleCargaDocente: detalle.idDetalleCargaDocente,
      idCargaDocente: detalle.idCargaDocente,
      detalles: [detalle.detalles[0]],
    };

    return this.webRequestService.put<void>(
      `${this.endpoint}/update-detail-professor-preload`,
      payload,
    );
  }

  /**
   * Activa la carga de un docente que está en el padrón de planta de la coordinación.
   * No envía modalidad ni fechas.
   *
   * @param request Identificadores de la carga, la convocatoria y la persona.
   * @returns Observable sin contenido cuando la operación finaliza correctamente.
  */

  saveCareerProfessorPreload(request: SaveCareerProfessorPreloadRequest): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save-career-professor-preload`,
      request,
    );
  }

  /**
   * Elimina una actividad asociada al detalle de una carga docente.
   *
   * @param idDetalleCargaDocente Identificador del detalle de carga docente.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
  */

  deleteProfessorActivity(idDetalleCargaDocente: number): Observable<void>{
    return this.webRequestService.delete<void>(
      `${this.endpoint}/delete-professor-activity/${idDetalleCargaDocente}`,
    );
  }

  /**
   * Actualiza a estado aprobado los docentes verificados de una carga.
   *
   * @param idCarga Identificador de la carga.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  approveProfessorsPreassignment(idCarga: number): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/approve-professors-preassignment/${idCarga}`,
      {},
    );
  }

  /**
   * Devuelve la distribución de actividades del docente al estado En registro.
   *
   * @param idCargaDocente Identificador de la carga docente.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  deleteProfessorActivityDistribution(idCargaDocente: number): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/disapprove-professor-preassignment/${idCargaDocente}`,
      {},
    );
  }

  /**
   * Consulta el total general de la preasignación docente.
   *
   * @param idCarga Identificador de la carga.
   * @returns Observable con los valores totales de la preasignación.
  */

  getTotalPreload(idCarga: number): Observable<TotalPreload> {
    return this.webRequestService.get<TotalPreload>(
      `${this.endpoint}/total-preload`,
      { idCarga },
    );
  }

  /**
   * Obtiene el presupuesto efectivo de la carga incluyendo el efecto
   * de las novedades vigentes.
   *
   * @param idCarga Identificador de la carga.
   * @returns Observable con valor de carga, valor autorizado y totales por docente.
  */

  getCargaBudget(idCarga: number): Observable<CargaBudget> {
    return this.webRequestService.get<CargaBudget>(
      `${this.endpoint}/carga-budget/${idCarga}`,
    );
  }

  /**
   * Obtiene el resumen completo de una carga docente incluyendo contratación,
   * actividades y centros de costo.
   *
   * @param idCargaDocente Identificador de la carga docente.
   * @returns Observable con el resumen completo de la carga docente.
  */

  getProfessorLoadSummary(
    idCargaDocente: number,
  ): Observable<ProfessorLoadSummaryApi> {
    return this.webRequestService.get<ProfessorLoadSummaryApi>(
      `${this.endpoint}/professor-load-summary/${idCargaDocente}`,
    );
  }

  

  /**
   * Descarga el reporte Excel correspondiente a la preasignación de una carga.
   *
   * @param idCarga Identificador de la carga.
   * @returns Observable con el archivo generado y el nombre sugerido.
  */

  downloadPreloadReport(idCarga: number): Observable<{ blob: Blob; fileName: string }> {
    return this.webRequestService
      .getBlobResponse(`${this.endpoint}/preload-report/${idCarga}`)
      .pipe(
        map((response) => ({
          blob: response.body as Blob,
          fileName: resolveDownloadFileName(
            response.headers.get('content-disposition'),
            `preasignacion-carga-${idCarga}.xlsx`,
          ),
        })),
      );
  }

  /**
   * Obtiene las observaciones registradas sobre una carga.
   *
   * @param idCarga Identificador de la carga.
   * @returns Observable con las observaciones registradas.
  */
  
  listPreloadObservations(idCarga: number): Observable<ObservacionesCargaItem[]> {
    return this.webRequestService.get<ObservacionesCargaItem[]>(
      `${this.endpoint}/preload-observations/${idCarga}`,
      {},
    )
  }

  /**
   * Marca como vistas las observaciones asociadas a una carga.
   *
   * @param idCarga Identificador de la carga.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
  */

  markSeenObservations(idCarga: number): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/mark-seen-observations/${idCarga}`,
      {},
    )
  }

  /**
   * Envía la carga al flujo de revisión del Decano,
   * cambiando su estado a INSCRITO.
   *
   * @param idCarga Identificador de la carga.
   * @returns Observable sin contenido cuando la operación finaliza correctamente.
  */

  endorsePreloadDean(idCarga: number): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/send-preload-dean/${idCarga}`,
      {},
    );
  }

  /**
   * Devuelve la carga desde la revisión del Decano al coordinador
   * para realizar correcciones.
   *
   * @param idCarga Identificador de la carga.
   * @param request Información de la observación registrada durante la devolución.
   * @returns Observable sin contenido cuando la devolución finaliza correctamente.
  */

  declinePreloadDean(idCarga: number, request: DeclinePreloadDeanRequest): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/decline-preload-dean/${idCarga}`,
      request,
    )
  }

  /**
   * Aprueba la carga por parte del Decano y la envía
   * a Desarrollo Académico.
   *
   * @param idCarga Identificador de la carga.
   * @returns Observable sin contenido cuando la aprobación finaliza correctamente.
  */

  approvePreloadDean(idCarga: number): Observable<void> {
      return this.webRequestService.put<void>(
        `${this.endpoint}/approve-preload-dean/${idCarga}`,
        {},
      );
    }

  /**
   * Devuelve la carga desde Desarrollo Académico al coordinador.
   * El estado de la carga vuelve a REGISTRADO.
   *
   * @param idCarga Identificador de la carga.
   * @param request Información de la observación registrada durante la devolución.
   * @returns Observable sin contenido cuando la devolución finaliza correctamente.
  */

  declinePreloadDevelopment(
    idCarga: number,
    request: DeclinePreloadDeanRequest,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/decline-preload-development/${idCarga}`,
      request,
    );
  }

  /**
   * Aprueba la carga por parte de Desarrollo Académico.
   * El estado de la carga cambia a AVAL DESARROLLO.
   *
   * @param idCarga Identificador de la carga.
   * @returns Observable sin contenido cuando la aprobación finaliza correctamente.
  */

  approvePreloadDevelopment(idCarga: number): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/approve-preload-development/${idCarga}`,
      {},
    );
  }

  /**
   * Consulta las horas totales correspondientes a las actividades de una carga.
   *
   * @param idCarga Identificador de la carga.
   * @returns Observable con el total de horas por tipo de actividad.
  */

  getActivitiesHours(idCarga: number): Observable<ActivitiesHours> {
    return this.webRequestService.get<ActivitiesHours>(
      `${this.endpoint}/activities-hours`,
      { idCarga },
    );
  }

  /**
   * Envía una carga docente a la etapa de verificación.
   *
   * @param request Información requerida para realizar el cambio de estado.
   * @returns Observable sin contenido cuando el envío finaliza correctamente.
  */

  sendProfessorToVerification(
    request: SendProfessorToVerificationRequest,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/to-verify-professor`,
      request,
    );
  }

  /**
   * Consulta las novedades configuradas con acción ACTUALIZAR.
   * Sin modalidad, el backend devuelve las novedades de planta.
   *
   * @param idModalidadContratacion Identificador de cátedra o TCO. Se omite para planta.
   * @returns Observable con las novedades de actualización disponibles.
  */
  getNoveltiesTypes(
    idModalidadContratacion?: number | null,
  ): Observable<NoveltiesItem[]> {
    return this.webRequestService.get<NoveltiesItem[]>(
      `${this.endpoint}/list-novelties`,
      this.buildNoveltiesQuery('ACTUALIZAR', idModalidadContratacion),
    );
  }

  /**
   * Consulta las novedades configuradas con acción ELIMINAR.
   * Sin modalidad, el backend devuelve las novedades de planta.
   *
   * @param idModalidadContratacion Identificador de cátedra o TCO. Se omite para planta.
   * @returns Observable con las novedades de eliminación disponibles.
  */
  getDeleteNovelties(
    idModalidadContratacion?: number | null,
  ): Observable<NoveltiesItem[]> {
    return this.webRequestService.get<NoveltiesItem[]>(
      `${this.endpoint}/list-novelties`,
      this.buildNoveltiesQuery('ELIMINAR', idModalidadContratacion),
    );
  }

  /**
   * Consulta las novedades configuradas con acción GUARDAR.
   *
   * @param idModalidadContratacion Identificador de la modalidad.
   * @returns Observable con las novedades de creación disponibles.
  */

  getSaveNovelties(idModalidadContratacion: number): Observable<NoveltiesItem[]> {
    return this.webRequestService.get<NoveltiesItem[]>(
      `${this.endpoint}/list-novelties`,
      this.buildNoveltiesQuery('GUARDAR', idModalidadContratacion),
    );
  }

  private buildNoveltiesQuery(
    accion: string,
    idModalidadContratacion?: number | null,
  ): Record<string, string> {
    const params: Record<string, string> = { accion };
    if (idModalidadContratacion != null) {
      params['idModalidadContratacion'] = String(idModalidadContratacion);
    }
    return params;
  }


  /**
   * Registra la novedad de actualización del valor del contrato
   * a partir de los puntos del escalafón, respetando el presupuesto disponible.
   *
   * @param request Información de la carga docente y de la novedad.
   * @returns Observable sin contenido cuando la novedad se registra correctamente.
  */

  updateContractValue(
    request: UpdateContractValueRequest
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/novelties/update-contract-value`,
      request,
    );
  }

  /**
   * Registra la novedad que asigna un docente identificado
   * a una carga previamente registrada como NN.
   *
   * @param request Información de la carga, novedad, docente y escalafón seleccionado.
   * @returns Observable sin contenido cuando la novedad se registra correctamente.
  */
  
  assignNameToNn(
    request: AssignNameNnRequest,
  ): Observable<void> {

    return this.webRequestService.post<void>(
      `${this.endpoint}/novelties/assign-name-nn`,
      request,
    );
  }

  /**
   * Registra la novedad de cambio de docente sobre una carga existente.
   *
   * @param request Información de la carga, novedad, nuevo docente y escalafón.
   * @returns Observable sin contenido cuando la novedad se registra correctamente.
  */

  changeProfessor(
    request: ChangeProfessorRequest,
  ): Observable<void> {

    return this.webRequestService.post<void>(
      `${this.endpoint}/novelties/change-professor`,
      request,
    );
  }

  /**
   * Registra la solicitud de eliminación de un docente dentro de una carga.
   * La eliminación queda pendiente del flujo de aprobación de novedades.
   *
   * @param request Información de la carga docente y la novedad de eliminación.
   * @returns Observable sin contenido cuando la solicitud se registra correctamente.
  */

  requestDeleteProfessor(
    request: DeleteProfessorRequest,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/novelties/delete-professor`,
      request,
    );
  }

  /**
   * Registra un nuevo docente como novedad dentro de una carga.
   *
   * @param request Información del docente, carga y modalidad de contratación.
   * @returns Observable sin contenido cuando la novedad se registra correctamente.
  */

  addNoveltyProfessor(
    request: AddNoveltyProfessorRequest
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/novelties/add-professor`,
      request,
    );
  }

  /**
   * Lista las modalidades de contratación disponibles.
   *
   * @returns Observable con las modalidades de contratación.
  */

  getContractModalities(): Observable<ContractModalityItem[]> {
    return this.webRequestService.get<ContractModalityItem[]>(
      `${this.endpoint}/list-modality`,
    );
  }

  /**
   * Registra la novedad de cambio de modalidad y horas de un docente.
   *
   * @param request Información de la novedad y distribución de actividades.
   * @returns Observable sin contenido cuando el guardado finaliza correctamente.
  */

  saveContractModalityProfessor(
    request: SaveNovedadCargaDocenteRequest,
  ): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save-contract-modality-professor`,
      request,
    );
  }

  /**
   * Guarda o actualiza los detalles de actividades asociados a una novedad.
   *
   * @param request Distribución de actividades correspondiente a la novedad.
   * @returns Observable sin contenido cuando el guardado finaliza correctamente.
  */

  saveNoveltyProjectActivities(request: SaveNoveltyProjectActivitiesRequest): Observable<void> {
    console.log('request', request);
    return this.webRequestService.post<void>(
      `${this.endpoint}/save-novelty-detail-professor-preload`,
      request,
    );
  }

  /**
   * Aprueba una novedad en revisión de un docente.
   * Cambia el estado de la novedad a aprobada y actualiza el valor efectivo de la carga.
   *
   * @param idCargaDocente Identificador de la carga docente.
   * @returns Observable sin contenido cuando la aprobación finaliza correctamente.
  */

  approveProfessorNovelty(
    idCargaDocente: number,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/approve-professor-novelty/${idCargaDocente}`,
      {},
    );
  }

  /**
   * Rechaza una novedad en revisión de un docente.
   * Pasa NOCD_ESTADONOVEDAD de 0 a 2 y NOCD_VIGENTE a 0, y guarda la observación.
   * Si la novedad es Agregar docente, elimina la carga docente creada y sus detalles.
   *
   * @param idCargaDocente Identificador de la carga docente.
   * @param request Observación y persona que registra el rechazo.
   */
  rejectProfessorNovelty(
    idCargaDocente: number,
    request: RejectProfessorNoveltyRequest,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/reject-professor-novelty/${idCargaDocente}`,
      request,
    );
  }

  /**
   * Obtiene el resumen de una carga docente considerando la novedad vigente,
   * incluyendo contratación, horas, centros de costo, observaciones e historial.
   *
   * @param idCargaDocente Identificador de la carga docente.
   * @returns Observable con el resumen de la novedad de la carga docente.
  */

  getProfessorNoveltySummary(idCargaDocente: number): Observable<ProfessorNoveltySummaryApi> {
    return this.webRequestService.get<ProfessorNoveltySummaryApi>(
      `${this.endpoint}/professor-novelty-summary/${idCargaDocente}`,
    );
  }

  /**
   * Descarga el PDF comparativo de la novedad vigente del docente.
   * Si es la primera, compara contra el registro original de CARGADOCENTE.
   *
   * @param idCargaDocente Identificador de la carga docente (CADO_ID).
   * @returns Observable con el archivo PDF y el nombre sugerido.
   */
  downloadNoveltyPdfReport(
    idCargaDocente: number,
  ): Observable<{ blob: Blob; fileName: string }> {
    return this.webRequestService
      .getBlobResponse(
        `${this.endpoint}/novelty-pdf-report/${idCargaDocente}`,
      )
      .pipe(
        map((response) => ({
          blob: response.body as Blob,
          fileName: resolveDownloadFileName(
            response.headers.get('content-disposition'),
            `novedad-carga-docente-${idCargaDocente}.pdf`,
          ),
        })),
      );
  }

  /**
   * Obtiene el PDF comparativo de una novedad aprobada histórica.
   *
   * La novedad se identifica por NOCD_ID y el backend la compara
   * contra la aprobación inmediatamente anterior. Si no existe una
   * aprobación anterior, la comparación se realiza contra el registro
   * original de CARGADOCENTE.
   *
   * @param idNovedadCargaDocente Identificador de la novedad (NOCD_ID).
   * @returns Observable con el archivo PDF y el nombre sugerido.
   */
  downloadHistoricalNoveltyPdfReport(
    idNovedadCargaDocente: number,
  ): Observable<{ blob: Blob; fileName: string }> {
    return this.webRequestService
      .getBlobResponse(
        `${this.endpoint}/novelty-pdf-report/history/${idNovedadCargaDocente}`,
      )
      .pipe(
        map((response) => ({
          blob: response.body as Blob,
          fileName: resolveDownloadFileName(
            response.headers.get('content-disposition'),
            `novedad-historica-${idNovedadCargaDocente}.pdf`,
          ),
        })),
      );
  }


}

function resolveDownloadFileName(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) {
    return fallback;
  }

  const utf8Match = /filename\*\s*=\s*UTF-8''([^;]+)/i.exec(
    contentDisposition,
  );
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1].trim().replace(/"/g, ''));
    } catch {
      return utf8Match[1].trim().replace(/"/g, '');
    }
  }

  const plainMatch = /filename\s*=\s*"?([^";]+)"?/i.exec(contentDisposition);
  if (plainMatch?.[1]) {
    return plainMatch[1].trim();
  }

  return fallback;
}