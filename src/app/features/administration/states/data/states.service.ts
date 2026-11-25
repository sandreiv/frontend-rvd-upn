import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { WebRequestService } from '../../../../core/service/web-request-service';

import {
  StateFormData,
  StateItem,
} from '../model/states.model';

@Injectable({
  providedIn: 'root',
})
export class StatesService {

  private readonly webRequestService =
    inject(WebRequestService);

  private readonly endpoint =
    '/configuration/administration/states';

  /**
   * Lista los estados registrados.
   */
  listStates(): Observable<StateItem[]> {
    return this.webRequestService.get<StateItem[]>(
      `${this.endpoint}/list`,
    );
  }

  /**
   * Consulta un estado por su identificador.
   */
  getStateById(id: number): Observable<StateItem> {
    return this.webRequestService.get<StateItem>(
      `${this.endpoint}/${id}`,
    );
  }

  /**
   * Registra un nuevo estado.
   */
  saveState(payload: StateFormData): Observable<void> {
    return this.webRequestService.post<void>(
      this.endpoint,
      payload,
    );
  }

  /**
   * Actualiza un estado existente.
   */
  updateState(
    id: number,
    payload: StateFormData,
  ): Observable<void> {
    return this.webRequestService.put<void>(
      `${this.endpoint}/${id}`,
      payload,
    );
  }

  /**
   * Elimina un estado.
   */
  deleteState(id: number): Observable<void> {
    return this.webRequestService.delete<void>(
      `${this.endpoint}/${id}`,
    );
  }

  /**
   * Elimina los estados seleccionados.
   */
  deleteStates(ids: number[]): Observable<void> {
    return this.webRequestService.deleteWithBody<void>(
      `${this.endpoint}/batch`,
      ids,
    );
  }
}