import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { WebRequestService } from '../../../../core/service/web-request-service';
import { ApproveCdpRequest, CdpContext, CdpSearchResult } from '../model/cdp-context.model';
import { CdpRequest } from '../model/cdp-request.model';

@Injectable({
  providedIn: 'root',
})
export class CdpService {

  private readonly webRequestService = inject(WebRequestService);

  private readonly endpoint = '/configuration/cdp';

  /**
   * Obtiene los contextos de facultad disponibles para la gestión de solicitudes CDP.
   *
   * @returns Observable con los contextos CDP habilitados para el usuario autenticado.
  */

  getContexts(): Observable<CdpContext[]> {
    return this.webRequestService.get<CdpContext[]>(
      `${this.endpoint}/context`,
    );
  }

  /**
   * Consulta la solicitud CDP vigente para una facultad y un periodo universitario.
   * La combinación facultad-periodo identifica de forma única la solicitud.
   *
   * @param idCoordinacionFacultad Identificador de la coordinación que representa la facultad.
   * @param idPeriodoUniversidad Identificador del periodo universitario.
   * @returns Observable con la solicitud encontrada o null cuando todavía no existe.
  */

  getCurrentRequest(
    idCoordinacionFacultad: number,
    idPeriodoUniversidad: number,
  ): Observable<CdpRequest | null> {
    return this.webRequestService.get<CdpRequest | null>(
      `${this.endpoint}/request`,
      {
        idCoordinacionFacultad,
        idPeriodoUniversidad,
      },
    );
  }

  /**
   * Descarga el reporte Excel CDP de la facultad.
   * Una hoja por coordinación en Aval Desarrollo.
   *
   * @param idConvocatoria Identificador de la convocatoria.
   * @param idPeriodoUniversidad Identificador del periodo.
   * @returns Observable con el archivo y el nombre sugerido.
   */
  downloadCdpReport(
    idConvocatoria: number,
    idPeriodoUniversidad: number,
    idCoordinacionFacultad: number,
  ): Observable<{ blob: Blob; fileName: string }> {
    return this.webRequestService
      .getBlobResponse(
        `${this.endpoint}/cdp-report`,
        this.buildReportParams(
          idConvocatoria,
          idPeriodoUniversidad,
          idCoordinacionFacultad,
        ),
      )
      .pipe(
        map((response) => ({
          blob: response.body as Blob,
          fileName: resolveDownloadFileName(
            response.headers.get('content-disposition'),
            'reporte-preasignacion.xlsx',
          ),
        })),
      );
  }

  /**
   * Descarga el reporte PDF CDP de la facultad.
   * Encabezado, bloques por coordinación y firma del decano.
   *
   * @param idConvocatoria Identificador de la convocatoria.
   * @param idPeriodoUniversidad Identificador del periodo.
   * @returns Observable con el archivo y el nombre sugerido.
   */
  downloadCdpPdfReport(
    idConvocatoria: number,
    idPeriodoUniversidad: number,
    idCoordinacionFacultad: number,
  ): Observable<{ blob: Blob; fileName: string }> {
    return this.webRequestService
      .getBlobResponse(
        `${this.endpoint}/cdp-pdf-report`,
        this.buildReportParams(
          idConvocatoria,
          idPeriodoUniversidad,
          idCoordinacionFacultad,
        ),
      )
      .pipe(
        map((response) => ({
          blob: response.body as Blob,
          fileName: resolveDownloadFileName(
            response.headers.get('content-disposition'),
            'reporte-preasignacion.pdf',
          ),
        })),
      );
  }

  /**
   * Construye los parámetros comunes utilizados por los reportes CDP.
   *
   * @param idConvocatoria Identificador de la convocatoria aplicada.
   * @param idPeriodoUniversidad Identificador del periodo universitario aplicado.
   * @param idCoordinacionFacultad Identificador de la facultad.
   * @returns Parámetros requeridos por los endpoints de reporte.
  */

  private buildReportParams(
    idConvocatoria: number,
    idPeriodoUniversidad: number,
    idCoordinacionFacultad: number,
  ): Record<string, number> {
    return {
      idConvocatoria,
      idPeriodoUniversidad,
      idCoordinacionFacultad,
    };
  }

  /**
   * Crea una solicitud CDP enviando observación, adjuntos y el contexto aplicado.
   * La convocatoria se utiliza para validar el contexto de cargas, mientras que
   * la solicitud queda asociada en backend a la facultad y al periodo universitario.
   *
   * @param observacion Observación registrada por el Decano.
   * @param archivos Archivos adjuntos que soportan la solicitud.
   * @param idPeriodo Identificador del periodo universitario aplicado.
   * @param idCoordinacionFacultad Identificador de la facultad que realiza la solicitud.
   * @param idConvocatoria Identificador de la convocatoria aplicada.
   * @returns Observable sin contenido cuando la solicitud se crea correctamente.
  */

  createRequest(
    observacion: string,
    archivos: File[],
    idPeriodo: string,
    idCoordinacionFacultad: string,
    idConvocatoria: string,
  ): Observable<void> {

    const formData = new FormData();

    if (observacion.trim()) {
      formData.append(
        'observacion',
        observacion.trim(),
      );
    }

    archivos.forEach((archivo) => {
      formData.append(
        'archivos',
        archivo,
        archivo.name,
      );
    });

    formData.append(
      'idPeriodo',
      idPeriodo.trim(),
    );

    formData.append(
      'idCoordinacionFacultad',
      idCoordinacionFacultad.trim(),
    );

    formData.append(
      'idConvocatoria',
      idConvocatoria.trim(),
    );

    return this.webRequestService.postFormData<void>(
      `${this.endpoint}/requests`,
      formData,
    );
  }
  
  /**
   * Actualiza el estado de la solictud CDP, pasando de Desarrollo academico a Vice academica
   * 
   * @param idSolicitud Identificador de la solicitud CDP.
   * @returns Observable sin contenido cuando la operación finaliza correctamente.
   */
  sendCdpToVice(idSolicitud: number): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/send-request-to-vice/${idSolicitud}`, {}
    );
  }
  
  /**
   * Busca información relacionada al CDP generado por presupuesto de un numero de CDP especifico
   * 
   * @param numeroCdp Numero del CDP a buscar
   * @param idUnidad Identificador de la unidad regional
   * @param anioVigencia Año de vigencia de la solicitud generada en la facultad
   * @returns Observable con la lista de los CDPs encontrados
   */
  searchCdpResults(numeroCdp: string, idUnidad: number, anioVigencia: number): Observable<CdpSearchResult[]> {
    return this.webRequestService.get<CdpSearchResult[]>(
      `${this.endpoint}/search-cdps`,
      { numeroCdp, idUnidad, anioVigencia }
    );
  }

  /**
   * Guarda el numero de CDP de TESORERIAV3 y actualiza el estado de la solicitud, pasando de Vice academica
   * a CDP aprobado
   * 
   * @param body Cuerpo con la información del CDP seleccionado
   * @returns Observable sin contenido cuando la operación finaliza correctamente.
   */
  approveCdpRequest(body: ApproveCdpRequest): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/approve-cdp-request`, body
    );
  }

  /**
   * Limpia el numero de CDP de TESORERIAV3 y actualiza el estado de la solicitud, pasando de CDP aprobado
   * a Vice academica
   * 
   * @param idSolicitud Identificador de la solicitud CDP
   * @returns Observable sin contenido cuando la operacion finaliza correctamente.
   */
  disapproveCdpRequest(idSolicitud: number): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/disapprove-cdp-request/${idSolicitud}`, {}
    );
  }
}

  /**
   * Resuelve el nombre de archivo sugerido por el encabezado Content-Disposition.
   * Si el encabezado no contiene un nombre válido, utiliza el valor de respaldo.
   *
   * @param contentDisposition Encabezado Content-Disposition retornado por el backend.
   * @param fallback Nombre de archivo utilizado cuando el encabezado no define uno.
   * @returns Nombre de archivo normalizado para la descarga.
  */

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