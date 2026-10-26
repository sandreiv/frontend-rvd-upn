import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { WebRequestService } from '../../../../core/service/web-request-service';
import {
  PublicAcademicLevel,
  PublicAcademicTitle,
  PublicBasicInformation,
  PublicCountry,
  PublicHiringRecord,
  PublicAcademicTrainingSave,
  PublicAcademicTraining,
  PublicActivitySummary,
  PublicActivitiesResponse,
  PublicDigitalWorkPlan,
  PublicSupportDocumentCategory,
  PublicSupportDocuments,
} from '../model/hiring.model';

@Injectable({ providedIn: 'root' })
export class HiringService {
  private readonly webRequestService =
    inject(WebRequestService);

  private readonly endpoint =
    '/public/work-plan';

  listHiringRecords(): Observable<
    PublicHiringRecord[]
  > {
    return this.webRequestService.get<
      PublicHiringRecord[]
    >(
      `${this.endpoint}/hiring-records`,
    );
  }

  getAcademicLevels(): Observable<
    PublicAcademicLevel[]
  > {
    return this.webRequestService.get<
      PublicAcademicLevel[]
    >(
      `${this.endpoint}/academic-training/levels`,
    );
  }

  getAcademicTitles(
    academicLevelId: number,
    query: string,
  ): Observable<PublicAcademicTitle[]> {
    return this.webRequestService.get<
      PublicAcademicTitle[]
    >(
      `${this.endpoint}/academic-training/titles`,
      {
        academicLevelId,
        query,
      },
    );
  }

  getCountries(): Observable<
    PublicCountry[]
  > {
    return this.webRequestService.get<
      PublicCountry[]
    >(
      `${this.endpoint}/academic-training/countries`,
    );
  }

  getBasicInformation(
    idCargaDocente: number,
  ): Observable<PublicBasicInformation> {
    return this.webRequestService.get<
      PublicBasicInformation
    >(
      `${this.endpoint}/hiring-records/${idCargaDocente}/basic-information`,
    );
  }

  saveAcademicTraining(
    idCargaDocente: number,
    payload: PublicAcademicTrainingSave,
    ): Observable<PublicAcademicTraining> {
    return this.webRequestService.post<
        PublicAcademicTraining
    >(
        `${this.endpoint}/hiring-records/${idCargaDocente}/academic-training`,
        payload,
    );
   }

   getLatestAcademicTraining(
    idCargaDocente: number,
    ): Observable<PublicAcademicTraining | null> {
    return this.webRequestService.get<
        PublicAcademicTraining | null
    >(
        `${this.endpoint}/hiring-records/${idCargaDocente}/academic-training/latest`,
    );
   }

   getActivities(
    idCargaDocente: number,
    ): Observable<PublicActivitiesResponse> {
    return this.webRequestService.get<
        PublicActivitiesResponse
    >(
        `${this.endpoint}/hiring-records/${idCargaDocente}/activities`,
    );
   }

  decideDigitalWorkPlan(
    idCargaDocente: number,
    nuevoEstado: '1' | '2',
  ): Observable<void> {

    return this.webRequestService.put<void>(
      `${this.endpoint}/hiring-records/${idCargaDocente}/digital-work-plan/status/${nuevoEstado}`,
      null,
    );
  }

   getDigitalWorkPlan(
    idCargaDocente: number,
    ): Observable<PublicDigitalWorkPlan | null> {
    return this.webRequestService.get<
        PublicDigitalWorkPlan | null
    >(
        `${this.endpoint}/hiring-records/${idCargaDocente}/digital-work-plan`,
    );
   }

    getSupportDocumentCategories(): Observable<
    PublicSupportDocumentCategory[]
    > {

    return this.webRequestService.get<
        PublicSupportDocumentCategory[]
    >(
        `${this.endpoint}/support-documents/categories`,
    );
    }

    getSupportDocuments(
    idCargaDocente: number,
    ): Observable<PublicSupportDocuments> {

    return this.webRequestService.get<
        PublicSupportDocuments
    >(
        `${this.endpoint}/hiring-records/${idCargaDocente}/support-documents`,
    );
    }

    uploadSupportDocuments(
    idCargaDocente: number,
    codigoCategoria: string,
    archivos: File[],
    ): Observable<PublicSupportDocuments> {

    const formData = new FormData();

    formData.append(
        'codigoCategoria',
        codigoCategoria,
    );

    for (const archivo of archivos) {

        formData.append(
        'archivos',
        archivo,
        archivo.name,
        );

    }

    return this.webRequestService
        .postFormData<PublicSupportDocuments>(
        `${this.endpoint}/hiring-records/${idCargaDocente}/support-documents`,
        formData,
        );
    }

    getSupportDocumentFile(
    idCargaDocente: number,
    fileId: string,
    ): Observable<Blob> {

    return this.webRequestService.getBlob(
        `${this.endpoint}/hiring-records/${idCargaDocente}/support-documents/${encodeURIComponent(fileId)}/file`,
    );
    }

    deleteSupportDocumentFile(
    idCargaDocente: number,
    fileId: string,
    ): Observable<PublicSupportDocuments> {

    return this.webRequestService.delete<
        PublicSupportDocuments
    >(
        `${this.endpoint}/hiring-records/${idCargaDocente}/support-documents/${encodeURIComponent(fileId)}`,
    );
    }

}