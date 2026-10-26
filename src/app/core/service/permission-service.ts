import { computed, inject, Injectable } from '@angular/core';
import {CDP_FUNC, PRELOAD_FUNC, VERIFY_PROFESSORS_FUNC, VERIFY_FUNC, HIRING_FUNC } from '../config/func-route.map';
import { FuncionalidadNodo } from '../model/funcionalidad.model';
import { forNext } from '../utils/for-next.function';
import { MenuService } from './menu-service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private readonly menuService = inject(MenuService);

  private readonly funcCodes = computed(() => {
    const codes = new Set<string>();
    collectCodes(this.menuService.tree(), codes);
    return codes;
  });

  can(codigo: string): boolean {
    return this.funcCodes().has(codigo);
  }

  /*canListProfessors(): boolean {
    return this.can(PRELOAD_FUNC.LIST);
  }*/

  canDownloadPreloadExcel(): boolean {
    return this.can(PRELOAD_FUNC.DOWNLOAD);
  }

  canAddProfessor(): boolean {
    return this.can(PRELOAD_FUNC.ADD);
  }

  canUpdateProfessor(): boolean {
    return this.can(PRELOAD_FUNC.UPDATE);
  }

  canDeleteProfessor(): boolean {
    return this.can(PRELOAD_FUNC.DELETE);
  }

  canSaveDetail(): boolean {
    return this.can(PRELOAD_FUNC.SAVE_DETAIL);
  }

  canApprove(): boolean {
    return this.can(PRELOAD_FUNC.APPROVE);
  }

  canEndorseLoadDean(): boolean {
    return this.can(PRELOAD_FUNC.ENDORSE_LOAD_DEAN);
  }

  canDeclineLoadDean(): boolean {
    return this.can(PRELOAD_FUNC.DECLINE_LOAD_DEAN);
  }

  canApproveLoadDean(): boolean {
    return this.can(PRELOAD_FUNC.APPROVE_LOAD_DEAN);
  }

  canSendForVerification(): boolean {
    return this.can(PRELOAD_FUNC.SEND_FOR_VERIFICATION);
  }

  canDeclineLoadDevelopment(): boolean {
    return this.can(PRELOAD_FUNC.DECLINE_LOAD_DEVELOPMENT);
  }

  canApproveLoadDevelopment(): boolean {
    return this.can(PRELOAD_FUNC.APPROVE_LOAD_DEVELOPMENT);
  }

  canListObservations(): boolean {
    return this.can(PRELOAD_FUNC.LIST_OBSERVATIONS);
  }
  /**
   * Permite ver la gráfica de porcentaje de horas por actividades.
   * Código Vortal 02_12, asignable al rol Desarrollo académico.
   */
  canViewActivitiesGraph(): boolean {
    return this.can(PRELOAD_FUNC.VIEW_ACTIVITIES_GRAPH);
  }

  /**
   * Funcionalidad única para rol de desarrollo académico.
   */
  canApproveProfessorNovelty(): boolean {
    return this.can(PRELOAD_FUNC.APPROVE_PROFESSOR_NOVELTY);
  }

  /**
   * Funcionalidad única para rechazar novedad de docente.
   */
  canRejectProfessorNovelty(): boolean {
    return this.can(PRELOAD_FUNC.REJECT_PROFESSOR_NOVELTY);
  }

  /**
   * Permite ver el resumen de carga docente con novedad vigente.
   * Código Vortal 02_17, asignado al rol Desarrollo académico.
   */
  canListProfessorNovelty(): boolean {
    return this.can(PRELOAD_FUNC.LIST_PROFESSOR_NOVELTY);
  }

  
  canSaveContractModalityProfessor(): boolean {
    return this.can(PRELOAD_FUNC.SAVE_CONTRACT_MODALITY_PROFESSOR);
  }

  
  canDownloadCdpReport(): boolean {
    return this.can(CDP_FUNC.DOWNLOAD);
  }

  canReviewAttachments(): boolean {
    return this.can(CDP_FUNC.REVIEW_ATTACHMENTS);
  }

  canAddCdpRequest(): boolean {
    return this.can(CDP_FUNC.ADD_CDP_REQUEST);
  }

  canSendCdpToVice(): boolean {
    return this.can(CDP_FUNC.SEND_CDP_REQUEST_TO_VICE);
  }

  canApproveCdpRequest(): boolean {
    return this.can(CDP_FUNC.APROVE_CDP_REQUEST);
  }

  canVerifyProfessor(): boolean {
    return this.can(VERIFY_PROFESSORS_FUNC.VERIFY);
  }

  canDeclineProfessorVerification(): boolean {
    return this.can(VERIFY_PROFESSORS_FUNC.DECLINE);
  }

  canVerifyProfessors(): boolean {
    return this.can(VERIFY_FUNC.PARENT);
  }

  canDownloadProfessorNoveltyPdf(): boolean {
    return this.can(PRELOAD_FUNC.DOWNLOAD_PROFESSOR_NOVELTY_PDF);
  }

  canSavePtd(): boolean {
    return this.can(HIRING_FUNC.SAVE_PTD);
  }

  canSaveContract(): boolean {
    return this.can(HIRING_FUNC.SAVE_CONTRACT);
  }

  canReviewPtd(): boolean {
    return this.can(HIRING_FUNC.REVIEW_PTD);
  }

  canApprovePtdTh(): boolean {
    return this.can(HIRING_FUNC.APPROVE_PTD_TH);
  }

  canDeclinePtdTh(): boolean {
    return this.can(HIRING_FUNC.DECLINE_PTD_TH);
  }

}

function collectCodes(
  nodos: FuncionalidadNodo[],
  codes: Set<string>,
): void {
  forNext(nodos, (nodo) => {
    if (nodo.codigo) {
      codes.add(nodo.codigo);
    }

    collectCodes(nodo.funHijas, codes);
  });
}