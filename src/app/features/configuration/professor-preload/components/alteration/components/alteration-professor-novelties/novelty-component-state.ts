/**
 * Estado compartido entre el modal general de gestión de novedades
 * y el componente dinámico correspondiente a la novedad seleccionada.
 *
 * Permite almacenar temporalmente los datos específicos que genera cada
 * componente de novedad, por ejemplo el PEGE_ID del docente seleccionado
 * en "Asignar nombre a NN", para que el modal padre pueda validar si la
 * información está completa y construir la solicitud al momento de guardar.
 *
 * De esta manera se evita acoplar el modal general a los controles internos
 * de cada componente y se facilita agregar nuevas novedades en el futuro.
 */

import {
  Injectable,
  computed,
  signal,
} from '@angular/core';
import { SaveNovedadCargaDocenteRequest } from '../../../../model/novelty-carga-docente.model';
import { SaveDetailProfessorPreloadRequest } from '../../../../model/save-detail-professor-preload.model';
import { DetailProfessorPreloadItemApi } from '../../../../model/detail-professor-preload.model';

export interface AssignNameNnPayload {
  component: 'asign-name-nn';
  idPersonaGeneral: number;
  idEscalafon: number;
}

export interface UpdateContractValue {
  component: 'update-contract-value';
}

export interface ChangeProfessorPayload {
  component: 'change-professor';
  idPersonaGeneral: number;
  idEscalafon: number;
}

export interface ChangeContractModalityPayload {
  component: 'change-contract-modality';
  request: SaveNovedadCargaDocenteRequest;
}

export interface ChangeProjectActivitiesPayload {
  component: 'change-project-activities';
  saveRequest: SaveDetailProfessorPreloadRequest;
  updateRequests: DetailProfessorPreloadItemApi[];
  deleteIds: number[];
}

export interface ChangeDirectActivitiesPayload {
  component: 'change-direct-activities';
  saveRequest: SaveDetailProfessorPreloadRequest;
  updateRequests: DetailProfessorPreloadItemApi[];
  deleteIds: number[];
}

export type NoveltyComponentPayload =
  | AssignNameNnPayload
  | UpdateContractValue
  | ChangeProfessorPayload
  | ChangeContractModalityPayload
  | ChangeProjectActivitiesPayload
  | ChangeDirectActivitiesPayload;

@Injectable()
export class NoveltyComponentState {
  readonly payload =
    signal<NoveltyComponentPayload | null>(
      null,
    );

  readonly isValid =
    computed(() => this.payload() != null);

  setAssignNameNn(
    idPersonaGeneral: number,
    idEscalafon: number,
  ): void {
    this.payload.set({
      component: 'asign-name-nn',
      idPersonaGeneral,
      idEscalafon,
    });
  }

  setUpdateContractValue(): void {
    this.payload.set({
      component: 'update-contract-value',
    });
  }

  setChangeProfessor(
    idPersonaGeneral: number,
    idEscalafon: number,
  ): void {
    this.payload.set({
      component: 'change-professor',
      idPersonaGeneral,
      idEscalafon,
    });
  }

  setChangeContractModality(
    request: SaveNovedadCargaDocenteRequest,
  ): void {
    this.payload.set({
      component: 'change-contract-modality',
      request,
    });
  }

  setChangeProjectActivities(
    saveRequest: SaveDetailProfessorPreloadRequest,
    updateRequests: DetailProfessorPreloadItemApi[],
    deleteIds: number[]
  ): void {
    this.payload.set({
      component: 'change-project-activities',
      saveRequest,
      updateRequests,
      deleteIds
    });
  }

  setChangeDirectActivities(
    saveRequest: SaveDetailProfessorPreloadRequest,
    updateRequests: DetailProfessorPreloadItemApi[],
    deleteIds: number[],
  ): void {
    this.payload.set({
      component: 'change-direct-activities',
      saveRequest,
      updateRequests,
      deleteIds,
    });
  }

  clear(): void {
    this.payload.set(null);
  }
}