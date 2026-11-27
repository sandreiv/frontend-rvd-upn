import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { WebRequestService } from '../../../../core/service/web-request-service';

import {
  ProfileFormData,
  ProfileItem,
  ProfileStatesFormData,
  ProfilePersonItem,
  ProfilePersonsFormData,
} from '../model/profiles.model';

import { StateItem } from '../../states/model/states.model';

@Injectable({
  providedIn: 'root',
})
export class ProfilesService {

  private readonly webRequestService =
    inject(WebRequestService);

  private readonly endpoint =
    '/configuration/administration/profiles';

  /**
   * Lista los perfiles registrados.
   */
  listProfiles(): Observable<ProfileItem[]> {

    return this.webRequestService.get<ProfileItem[]>(
      `${this.endpoint}/list`,
    );
  }

  /**
   * Consulta un perfil por su identificador.
   */
  getProfileById(id: number): Observable<ProfileItem> {

    return this.webRequestService.get<ProfileItem>(
      `${this.endpoint}/${id}`,
    );
  }

  /**
   * Registra un nuevo perfil.
   */
  saveProfile(
    payload: ProfileFormData,
  ): Observable<void> {

    return this.webRequestService.post<void>(
      this.endpoint,
      payload,
    );
  }

  /**
   * Actualiza un perfil existente.
   */
  updateProfile(
    id: number,
    payload: ProfileFormData,
  ): Observable<void> {

    return this.webRequestService.put<void>(
      `${this.endpoint}/${id}`,
      payload,
    );
  }

  /**
   * Elimina un perfil.
   */
  deleteProfile(id: number): Observable<void> {

    return this.webRequestService.delete<void>(
      `${this.endpoint}/${id}`,
    );
  }

  /**
   * Elimina los perfiles seleccionados.
   */
  deleteProfiles(ids: number[]): Observable<void> {

    return this.webRequestService.deleteWithBody<void>(
      `${this.endpoint}/batch`,
      ids,
    );
  }

  /**
     * Consulta los estados asociados al perfil.
     */
    listProfileStates(id: number): Observable<StateItem[]> {

    return this.webRequestService.get<StateItem[]>(
        `${this.endpoint}/${id}/states`,
    );
    }

    /**
     * Guarda los estados asociados al perfil.
     */
    saveProfileStates(
    id: number,
    payload: ProfileStatesFormData,
    ): Observable<void> {

    return this.webRequestService.put<void>(
        `${this.endpoint}/${id}/states`,
        payload,
    );
    }

    /**
     * Busca personas institucionales por
     * documento de identidad o nombre.
     */
    searchPersons(
    term: string,
    ): Observable<ProfilePersonItem[]> {

    const search = encodeURIComponent(term.trim());

    return this.webRequestService.get<ProfilePersonItem[]>(
        `${this.endpoint}/persons/search?term=${search}`,
    );
    }

    /**
     * Consulta las personas asociadas al perfil.
     */
    listProfilePersons(
    id: number,
    ): Observable<ProfilePersonItem[]> {

    return this.webRequestService.get<ProfilePersonItem[]>(
        `${this.endpoint}/${id}/persons`,
    );
    }

    /**
     * Guarda las personas asociadas al perfil.
     */
    saveProfilePersons(
    id: number,
    payload: ProfilePersonsFormData,
    ): Observable<void> {

    return this.webRequestService.put<void>(
        `${this.endpoint}/${id}/persons`,
        payload,
    );
    }

}