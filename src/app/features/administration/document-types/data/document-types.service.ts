import { inject, Injectable } from "@angular/core";
import { WebRequestService } from "../../../../core/service/web-request-service";
import { Observable } from "rxjs";
import { DeleteBulkDocumentTypesRequest, DocumentTypesFormData, DocumentTypesItem } from "../model/document-types.model";

@Injectable({
  providedIn: 'root',
})
export class DocumentTypesService {
  private readonly webRequestService = inject(WebRequestService);
  
  private readonly endpoint = '/configuration/administration/document-types';

  /**
   * Lista los tipos de documentos para la contratación configurados en el sistema.
   * 
   * @returns Observable con los tipos de documentos registrados.
   */
  list(): Observable<DocumentTypesItem[]> {
    return this.webRequestService.get<DocumentTypesItem[]>(
      `${this.endpoint}/list`,
    );
  }

  /**
   * Registra un nuevo tipo de documento para la contratación.
   * 
   * @param payload Información del tipo de documento a registrar.
   * @returns Observable sin contenido cuando el registro finaliza correctamente.
   */
  save(payload: DocumentTypesFormData): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/save`,
      payload
    );
  }

  /**
   * Actualiza un tipo de documento existente para la contratación.
   * 
   * @param id Identificador del tipo de documento.
   * @param payload Información actualizada del tipo de documento.
   * @returns Observable sin contenido cuando la actualización finaliza correctamente.
   */
  update(id: number, payload: DocumentTypesFormData): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/update/${id}`,
      payload
    );
  }

  /**
   * Elimina un tipo de documento para la contratación con su identificador. 
   * 
   * @param id Identificador del tipo de documento.
   * @returns Observable sin contenido cuando la eliminación finaliza correctamente.
   */
  delete(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/delete/${id}`,
    );
  }

  /**
   * Elimina varios tipos de documentos para la contratación en una sola operación.
   * 
   * @param paylaod Identificadores de los tipos de documentos.
   * @returns Observable sin contenido cuando la eliminación masiva finaliza correctamente.
   */
  deleteBulk(paylaod: DeleteBulkDocumentTypesRequest): Observable<void> {
    return this.webRequestService.post<void>(
      `${this.endpoint}/delete-bulk`,
      paylaod
    );
  }
}