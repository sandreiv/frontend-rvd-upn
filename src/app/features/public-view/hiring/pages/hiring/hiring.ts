import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  rxResource,
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  firstValueFrom,
  of,
  Subject,
  switchMap,
} from 'rxjs';

import {DomSanitizer,SafeResourceUrl,} from '@angular/platform-browser';
import {DocumentPreview,} from '../../../../../shared/components/form/document-preview/document-preview';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { Button } from '../../../../../shared/ui/button/button';
import {NewModal,} from '../../../../../shared/ui/new-modal/new-modal';
import { HiringTable } from '../../components/hiring-table/hiring-table';
import { BasicInformation } from '../../components/basic-information/basic-information';
import { AcademicTraining } from '../../components/academic-training/academic-training';
import { DigitalWorkPlan } from '../../components/digital-work-plan/digital-work-plan';
import { Activities } from '../../components/activities/activities';
import {SupportDocuments,type SupportDocumentsUploadRequest,} from '../../components/support-documents/support-documents';
import { HiringService } from '../../data/hiring.service';
import { NotificationService } from '../../../../../core/service/notification-service';
import {
  PublicAcademicLevel,
  PublicAcademicTitle,
  PublicBasicInformation,
  PublicCountry,
  PublicHiringRecord,
  PublicAcademicTrainingSave,
  PublicAcademicTraining,
  PublicActivitySummary,
  PublicDigitalWorkPlan,
  PublicSupportDocumentCategory,
  PublicSupportDocuments,
  PublicSupportDocumentFile,
} from '../../model/hiring.model';

interface AcademicTitleSearch {
  academicLevelId: number;
  query: string;
}

@Component({
  selector: 'app-hiring',
  imports: [
    SectionFrame,
    Button,
    HiringTable,
    BasicInformation,
    AcademicTraining,
    Activities,
    DigitalWorkPlan,
    SupportDocuments,
    DocumentPreview,
    NewModal,
  ],
  templateUrl: './hiring.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class Hiring {
  private readonly hiringService =
    inject(HiringService);
  
  private readonly notificationService =
  inject(NotificationService);

  private readonly academicTrainingComponent =
    viewChild(AcademicTraining);

  readonly savingAcademicTraining =
    signal(false);  

  private readonly titleSearch$ =
    new Subject<AcademicTitleSearch>();

  readonly selectedHiringRecord =
    signal<PublicHiringRecord | null>(null);

  readonly ptdDecisionPending = signal<{
    idCargaDocente: number;
    nuevoEstado: '1' | '2';
  } | null>(null);

  readonly ptdDecisionSaving =
    signal(false);

  readonly ptdEstado = computed(() =>
    (
      this.selectedHiringRecord()
        ?.estadoPlanTrabajo ?? ''
    )
      .trim()
      .toLowerCase(),
  );

  readonly ptdCanDecide = computed(() =>
    this.ptdEstado() === 'estipulado' ||
    this.ptdEstado() === '0',
  );  

  readonly ptdReadOnly = computed(() =>
    ['aceptado', 'rechazado', '1', '2']
      .includes(this.ptdEstado()),
  );

  readonly ptdEditsBlocked = computed(() =>
    this.ptdReadOnly() ||
    this.ptdDecisionSaving(),
  );

  private hiringSelectionRequestId = 0;  

  readonly basicInformation =
    signal<PublicBasicInformation | null>(null);

  readonly isLoadingBasicInformation =
    signal(false);

  readonly basicInformationError =
    signal(false);

  readonly selectedAcademicLevelId =
    signal<number | null>(null);

  readonly academicTitles =
    signal<PublicAcademicTitle[]>([]);

  readonly titlesLoading =
    signal(false);

  readonly hiringRecordsResource =
    rxResource({
      stream: () =>
        this.hiringService
          .listHiringRecords(),

      defaultValue:
        [] as PublicHiringRecord[],
    });

  readonly academicLevelsResource =
    rxResource({
      params: () =>
        this.selectedHiringRecord()
          ? true
          : undefined,

      stream: () =>
        this.hiringService
          .getAcademicLevels(),

      defaultValue:
        [] as PublicAcademicLevel[],
    });

  readonly countriesResource =
    rxResource({
      params: () =>
        this.selectedHiringRecord()
          ? true
          : undefined,

      stream: () =>
        this.hiringService
          .getCountries(),

      defaultValue:
        [] as PublicCountry[],
    });

  readonly hiringRecords = computed(
    () =>
      this.hiringRecordsResource.value(),
  );

  readonly academicLevels = computed(
    () =>
      this.academicLevelsResource.value(),
  );

  readonly digitalWorkPlan =
    signal<PublicDigitalWorkPlan | null>(
      null,
    );

  readonly digitalWorkPlanLoading =
    signal(false);

  readonly digitalWorkPlanLoadError =
    signal(false);

  readonly digitalWorkPlanExpanded =
    signal(false);

  private readonly digitalWorkPlanLoadedForId =
    signal<number | null>(null);
  
  readonly supportDocumentCategories =
    signal<PublicSupportDocumentCategory[]>(
      [],
    );

  readonly supportDocuments =
    signal<PublicSupportDocuments | null>(
      null,
    );

  readonly supportDocumentsLoading =
    signal(false);

  readonly supportDocumentsLoadError =
    signal(false);
  
  readonly supportDocumentsUploading =
    signal(false);

  readonly supportDocumentsUploadProgress =
    signal<string | null>(null);  

  readonly supportDocumentPendingDeletion =
    signal<{
      archivo: PublicSupportDocumentFile;
      idCargaDocente: number;
    } | null>(null);

  readonly supportDocumentDeletingFileId =
    signal<string | null>(null);  
  
  readonly supportDocumentPreviewOpen =
    signal(false);

  readonly supportDocumentPreviewLoading =
    signal(false);

  readonly supportDocumentPreviewError =
    signal<string | null>(null);

  readonly supportDocumentPreviewUrl =
    signal<SafeResourceUrl | null>(null);

  readonly supportDocumentPreviewFileName =
    signal('Documento');

  readonly supportDocumentDownloadingFileId =
    signal<string | null>(null);

  private supportDocumentPreviewObjectUrl:
    string | null = null;

  private supportDocumentPreviewRequestId = 0;

  private readonly sanitizer =
    inject(DomSanitizer);

  private readonly destroyRef =
    inject(DestroyRef);  

  readonly supportDocumentsExpanded =
    signal(false);

  private readonly supportDocumentsLoadedForId =
    signal<number | null>(null);

  private supportDocumentsRequestSequence = 0;  

  readonly countries = computed(
    () =>
      this.countriesResource.value(),
  );

  readonly emptyMessage = computed(() => {
    if (
      this.hiringRecordsResource.isLoading()
    ) {
      return 'Cargando contrataciones...';
    }

    if (
      this.hiringRecordsResource.error()
    ) {
      return 'No fue posible cargar las contrataciones del docente.';
    }

    return 'No tienes contrataciones disponibles para iniciar el plan de trabajo.';
  });

  readonly latestAcademicTraining =
    signal<PublicAcademicTraining | null>(
      null,
    );

  readonly academicTrainingLoading =
    signal(false);

  readonly academicTrainingLoadError =
    signal(false);


  readonly activities =
    signal<PublicActivitySummary[]>([]);

  readonly activityObservation =
    signal<string | null>(null);  

  readonly activitiesLoading =
    signal(false);

  readonly activitiesLoadError =
    signal(false);

  readonly activitiesExpanded =
    signal(false);

  private readonly activitiesLoadedForId =
    signal<number | null>(null);  

  constructor() {

    this.destroyRef.onDestroy(() => {

      this.supportDocumentPreviewRequestId++;

      this.revokeSupportDocumentPreviewUrl();

    });

    this.titleSearch$
      .pipe(
        debounceTime(300),

        distinctUntilChanged(
          (previous, current) =>
            previous.academicLevelId ===
              current.academicLevelId &&
            previous.query ===
              current.query,
        ),

        switchMap((search) => {
          this.titlesLoading.set(true);

          return this.hiringService
            .getAcademicTitles(
              search.academicLevelId,
              search.query,
            )
            .pipe(
              catchError(() =>
                of(
                  [] as PublicAcademicTitle[],
                ),
              ),

              finalize(() =>
                this.titlesLoading.set(
                  false,
                ),
              ),
            );
        }),

        takeUntilDestroyed(),
      )
      .subscribe((titles) =>
        this.academicTitles.set(
          titles,
        ),
      );
  }

  onRequestPtdDecision(
    nuevoEstado: '1' | '2',
  ): void {

    const record =
      this.selectedHiringRecord();

    if (
      !record ||
      !this.ptdCanDecide() ||
      this.ptdDecisionSaving() ||
      this.savingAcademicTraining() ||
      this.supportDocumentsUploading() ||
      this.supportDocumentDeletingFileId() !== null
    ) {
      return;
    }

    this.ptdDecisionPending.set({
      idCargaDocente:
        record.idCargaDocente,

      nuevoEstado,
    });
  }

  closePtdDecisionModal(): void {

    if (this.ptdDecisionSaving()) {
      return;
    }

    this.ptdDecisionPending.set(
      null,
    );
  }

  async confirmPtdDecision(): Promise<void> {

    const pending =
      this.ptdDecisionPending();

    const record =
      this.selectedHiringRecord();

    if (this.ptdDecisionSaving()) {
      return;
    }

    if (
      !pending ||
      !record ||
      pending.idCargaDocente !== record.idCargaDocente ||
      !this.ptdCanDecide() ||
      this.savingAcademicTraining() ||
      this.supportDocumentsUploading() ||
      this.supportDocumentDeletingFileId() !== null
    ) {
      this.ptdDecisionPending.set(null);
      return;
    }

    this.ptdDecisionSaving.set(
      true,
    );

    try {

      await firstValueFrom(
        this.hiringService
          .decideDigitalWorkPlan(
            pending.idCargaDocente,
            pending.nuevoEstado,
          ),
      );

      const estado =
        pending.nuevoEstado === '1'
          ? 'Aceptado'
          : 'Rechazado';

      const selected =
        this.selectedHiringRecord();

      if (
        selected?.idCargaDocente ===
        pending.idCargaDocente
      ) {

        this.selectedHiringRecord.set({
          ...selected,

          estadoPlanTrabajo:
            estado,
        });
      }

      this.ptdDecisionPending.set(null);

      this.supportDocumentPendingDeletion.set(null);

      this.hiringRecordsResource.reload();

      this.notificationService.success(
        `El Plan de Trabajo Digital fue ${
          pending.nuevoEstado === '1'
            ? 'aprobado'
            : 'rechazado'
        } correctamente.`,

        'Plan de trabajo digital',
      );

    } catch {

      this.ptdDecisionPending.set(
        null,
      );

      this.hiringRecordsResource.reload();

      this.notificationService.error(
        'No fue posible registrar la decisión. Verifica el estado actual del PTD antes de intentarlo nuevamente.',

        'Plan de trabajo digital',
      );

    } finally {

      this.ptdDecisionSaving.set(
        false,
      );
    }
  }

  onRefreshRecords(): void {
    this.hiringRecordsResource.reload();
  }

  async onStartProcess(
    record: PublicHiringRecord,
  ): Promise<void> {

    const requestId =
      ++this.hiringSelectionRequestId;

    this.ptdDecisionPending.set(
      null,
    );

    this.selectedHiringRecord.set(
      record,
    );

    this.activitiesExpanded.set(
      false,
    );

    this.activities.set([]);

    this.activityObservation.set(
      null,
    );

    this.activitiesLoadError.set(
      false,
    );

    this.activitiesLoading.set(
      false,
    );

    this.activitiesLoadedForId.set(
      null,
    );

    this.digitalWorkPlanExpanded.set(
      false,
    );

    this.digitalWorkPlan.set(
      null,
    );

    this.digitalWorkPlanLoadError.set(
      false,
    );

    this.digitalWorkPlanLoading.set(
      false,
    );

    this.digitalWorkPlanLoadedForId.set(
      null,
    );

    this.supportDocumentsRequestSequence++;

    this.supportDocumentsExpanded.set(
      false,
    );

    this.supportDocuments.set(
      null,
    );

    this.supportDocumentCategories.set(
      [],
    );

    this.supportDocumentsLoading.set(
      false,
    );

    this.supportDocumentsLoadError.set(
      false,
    );

    this.supportDocumentsLoadedForId.set(
      null,
    );

    this.supportDocumentPendingDeletion.set(
      null,
    );

    this.supportDocumentDeletingFileId.set(
      null,
    );

    this.closeSupportDocumentPreview();

    this.supportDocumentDownloadingFileId.set(
      null,
    );

    this.supportDocumentsUploading.set(
      false,
    );

    this.supportDocumentsUploadProgress.set(
      null,
    );

    this.academicTrainingComponent()
      ?.resetView();

    void this.loadLatestAcademicTraining(
      record.idCargaDocente,
      requestId,
    );

    this.basicInformation.set(null);
    this.basicInformationError.set(false);
    this.isLoadingBasicInformation.set(
      true,
    );

    this.selectedAcademicLevelId.set(
      null,
    );

    this.academicTitles.set([]);

    try {
      const information =
        await firstValueFrom(
          this.hiringService
            .getBasicInformation(
              record.idCargaDocente,
            ),
        );
      if (
        requestId ===
        this.hiringSelectionRequestId
      ) {
        this.basicInformation.set(
          information,
        );
      }

    } catch {
      if (
        requestId ===
        this.hiringSelectionRequestId
      ) {
        this.basicInformationError.set(
          true,
        );
      }

    } finally {
      if (
        requestId ===
        this.hiringSelectionRequestId
      ) {
        this.isLoadingBasicInformation.set(
          false,
        );
      }
    }
  }

  onAcademicLevelChange(
    academicLevelId: number,
  ): void {
    this.selectedAcademicLevelId.set(
      academicLevelId,
    );

    this.academicTitles.set([]);
  }

  onTitleQueryChange(
    query: string,
  ): void {
    const academicLevelId =
      this.selectedAcademicLevelId();

    const normalizedQuery =
      query.trim();

    if (
      academicLevelId == null ||
      normalizedQuery.length < 2
    ) {
      this.academicTitles.set([]);
      return;
    }

    this.titleSearch$.next({
      academicLevelId,
      query: normalizedQuery,
    });
  }

  async onSaveAcademicTraining(
    payload: PublicAcademicTrainingSave,
  ): Promise<void> {

    const record =
      this.selectedHiringRecord();

    if (
      !record ||
      this.ptdEditsBlocked()
    ) {
      return;
    }

    if (this.savingAcademicTraining()) {
      return;
    }

    this.savingAcademicTraining.set(true);

    try {
      const saved =
      await firstValueFrom(
        this.hiringService
          .saveAcademicTraining(
            record.idCargaDocente,
            payload,
          ),
      );

      this.notificationService.success(
        'La formación académica fue registrada correctamente.',
        'Formación académica',
      );

      this.latestAcademicTraining.set(
        saved,
      );

      this.selectedAcademicLevelId.set(
        null,
      );

      this.academicTitles.set([]);

      this.academicTrainingComponent()
      ?.showLatestTraining();

    } catch {
      this.notificationService.error(
        'No fue posible registrar la formación académica.',
        'Formación académica',
      );
    } finally {
      this.savingAcademicTraining.set(false);
    }
  }


  private async loadLatestAcademicTraining(
    idCargaDocente: number,
    requestId: number,
  ): Promise<void> {

  
    this.academicTrainingLoading.set(
      true,
    );

    this.academicTrainingLoadError.set(
      false,
    );

    this.latestAcademicTraining.set(
      null,
    );

    try {

      const latest =
        await firstValueFrom(
          this.hiringService
            .getLatestAcademicTraining(
              idCargaDocente,
            ),
        );


      if (
        requestId ===
        this.hiringSelectionRequestId
      ) {
        this.latestAcademicTraining.set(
          latest ?? null,
        );
      }

    } catch {

      if (
        requestId ===
        this.hiringSelectionRequestId
      ) {
        this.academicTrainingLoadError.set(
          true,
        );
      }

    } finally {


      if (
        requestId ===
        this.hiringSelectionRequestId
      ) {
        this.academicTrainingLoading.set(
          false,
        );
      }
    }
  }

  async onActivitiesExpandedChange(
    expanded: boolean,
  ): Promise<void> {

    this.activitiesExpanded.set(
      expanded,
    );

    if (!expanded) {
      return;
    }

    const record =
      this.selectedHiringRecord();

    if (!record) {
      return;
    }

    if (
      this.activitiesLoadedForId() ===
      record.idCargaDocente
    ) {
      return;
    }

    await this.loadActivities(
      record.idCargaDocente,
    );
  }

  private async loadActivities(
    idCargaDocente: number,
  ): Promise<void> {

    this.activitiesLoading.set(true);
    this.activitiesLoadError.set(false);
    this.activities.set([]);
    this.activityObservation.set(null);

    try {

      const response =
      await firstValueFrom(
        this.hiringService
          .getActivities(
            idCargaDocente,
          ),
      );

      /*
      * Evita pintar una respuesta vieja
      * si el usuario cambió de contratación
      * mientras la petición estaba en curso.
      */
      if (
        this.selectedHiringRecord()
          ?.idCargaDocente !==
        idCargaDocente
      ) {
        return;
      }

      this.activities.set(
        response?.actividades ?? [],
      );

      this.activityObservation.set(
        response?.observacion ?? null,
      );

      this.activitiesLoadedForId.set(
        idCargaDocente,
      );

    } catch {

      if (
        this.selectedHiringRecord()
          ?.idCargaDocente ===
        idCargaDocente
      ) {
        this.activitiesLoadError.set(
          true,
        );
      }

    } finally {

      if (
        this.selectedHiringRecord()
          ?.idCargaDocente ===
        idCargaDocente
      ) {
        this.activitiesLoading.set(
          false,
        );
      }
    }
  }

  async onDigitalWorkPlanExpandedChange(
    expanded: boolean,
  ): Promise<void> {

    this.digitalWorkPlanExpanded.set(
      expanded,
    );

    if (!expanded) {
      return;
    }

    const record =
      this.selectedHiringRecord();

    if (!record) {
      return;
    }

    /*
    * Si ya consultamos el PTD para
    * esta contratación, no repetimos
    * la petición al volver a abrir.
    */
    if (
      this.digitalWorkPlanLoadedForId() ===
      record.idCargaDocente
    ) {
      return;
    }

    await this.loadDigitalWorkPlan(
      record.idCargaDocente,
    );
  }


  private async loadDigitalWorkPlan(
    idCargaDocente: number,
  ): Promise<void> {

    this.digitalWorkPlanLoading.set(
      true,
    );

    this.digitalWorkPlanLoadError.set(
      false,
    );

    this.digitalWorkPlan.set(
      null,
    );

    try {

      const plan =
        await firstValueFrom(
          this.hiringService
            .getDigitalWorkPlan(
              idCargaDocente,
            ),
        );

      /*
      * Si el usuario cambió de
      * contratación mientras respondía
      * el servidor, ignoramos la
      * respuesta anterior.
      */
      if (
        this.selectedHiringRecord()
          ?.idCargaDocente !==
        idCargaDocente
      ) {
        return;
      }

      this.digitalWorkPlan.set(
        plan ?? null,
      );

      /*
      * Incluso si el backend devolvió
      * 204, marcamos la contratación
      * como consultada para no volver
      * a pedirla cada vez que se abra.
      */
      this.digitalWorkPlanLoadedForId.set(
        idCargaDocente,
      );

    } catch {

      if (
        this.selectedHiringRecord()
          ?.idCargaDocente ===
        idCargaDocente
      ) {

        this.digitalWorkPlanLoadError.set(
          true,
        );

      }

    } finally {

      if (
        this.selectedHiringRecord()
          ?.idCargaDocente ===
        idCargaDocente
      ) {

        this.digitalWorkPlanLoading.set(
          false,
        );

      }

    }
  }

  async onSupportDocumentsExpandedChange(
    expanded: boolean,
  ): Promise<void> {

    this.supportDocumentsExpanded.set(
      expanded,
    );

    if (!expanded) {
      return;
    }

    const record =
      this.selectedHiringRecord();

    if (!record) {
      return;
    }

    if (
      this.supportDocumentsLoading()
    ) {
      return;
    }

    if (
      this.supportDocumentsLoadedForId() ===
      record.idCargaDocente
    ) {
      return;
    }

    await this.loadSupportDocuments(
      record.idCargaDocente,
    );
  }

  private async loadSupportDocuments(
    idCargaDocente: number,
  ): Promise<void> {

    const requestSequence =
      ++this.supportDocumentsRequestSequence;

    this.supportDocumentsLoading.set(
      true,
    );

    this.supportDocumentsLoadError.set(
      false,
    );

    this.supportDocuments.set(
      null,
    );

    this.supportDocumentCategories.set(
      [],
    );

    try {

      const [
        categories,
        documents,
      ] = await Promise.all([

        firstValueFrom(
          this.hiringService
            .getSupportDocumentCategories(),
        ),

        firstValueFrom(
          this.hiringService
            .getSupportDocuments(
              idCargaDocente,
            ),
        ),

      ]);

      if (
        requestSequence !==
          this.supportDocumentsRequestSequence ||
        this.selectedHiringRecord()
          ?.idCargaDocente !==
          idCargaDocente
      ) {
        return;
      }

      this.supportDocumentCategories.set(
        categories ?? [],
      );

      this.supportDocuments.set(
        documents ?? null,
      );

      this.supportDocumentsLoadedForId.set(
        idCargaDocente,
      );

    } catch {

      if (
        requestSequence ===
          this.supportDocumentsRequestSequence &&
        this.selectedHiringRecord()
          ?.idCargaDocente ===
          idCargaDocente
      ) {

        this.supportDocumentsLoadError.set(
          true,
        );

      }

    } finally {

      if (
        requestSequence ===
          this.supportDocumentsRequestSequence &&
        this.selectedHiringRecord()
          ?.idCargaDocente ===
          idCargaDocente
      ) {

        this.supportDocumentsLoading.set(
          false,
        );

      }

    }
  }

  async onUploadSupportDocuments(
    request: SupportDocumentsUploadRequest,
  ): Promise<void> {

    const record =
      this.selectedHiringRecord();

    if (
      !record ||
      this.ptdEditsBlocked() ||
      this.supportDocumentsUploading() ||
      this.supportDocumentDeletingFileId() !== null ||
      request.archivos.length === 0
    ) {
      return;
    }

    const idCargaDocente =
      record.idCargaDocente;

    const requestSequence =
      this.supportDocumentsRequestSequence;

    const {
      codigoCategoria,
      archivos,
    } = request;

    const BATCH_SIZE = 10;

    let archivosGuardados = 0;

    const isCurrentRequest = () =>
      requestSequence ===
        this.supportDocumentsRequestSequence &&
      this.selectedHiringRecord()
        ?.idCargaDocente ===
        idCargaDocente;

    this.supportDocumentsUploading.set(
      true,
    );

    this.supportDocumentsUploadProgress.set(
      `0 de ${archivos.length} archivos guardados`,
    );

    try {

      for (
        let index = 0;
        index < archivos.length;
        index += BATCH_SIZE
      ) {

        const lote =
          archivos.slice(
            index,
            index + BATCH_SIZE,
          );

        const resultado =
          await firstValueFrom(
            this.hiringService
              .uploadSupportDocuments(
                idCargaDocente,
                codigoCategoria,
                lote,
              ),
          );

        archivosGuardados +=
          lote.length;

        if (!isCurrentRequest()) {
          return;
        }

        this.supportDocuments.set(
          resultado,
        );

        this.supportDocumentsLoadedForId.set(
          idCargaDocente,
        );

        this.supportDocumentsUploadProgress.set(
          `${archivosGuardados} de ${archivos.length} archivos guardados`,
        );

      }

      if (isCurrentRequest()) {

        this.notificationService.success(
          `Se cargaron correctamente ${archivosGuardados} documentos.`,
          'Documentos de soporte',
        );

      }

    } catch {

      if (isCurrentRequest()) {

        try {

          const documentosActualizados =
            await firstValueFrom(
              this.hiringService
                .getSupportDocuments(
                  idCargaDocente,
                ),
            );

          if (isCurrentRequest()) {

            this.supportDocuments.set(
              documentosActualizados,
            );

          }

        } catch {

        }

        if (isCurrentRequest()) {

          this.notificationService.error(
            archivosGuardados > 0
              ? `La carga se interrumpió. Se confirmaron ${archivosGuardados} de ${archivos.length} archivos. Revisa los documentos registrados antes de reintentar.`
              : 'No fue posible completar la carga. Revisa los documentos registrados antes de reintentar.',
            'Documentos de soporte',
          );

        }

      }

    } finally {

      if (isCurrentRequest()) {

        this.supportDocumentsUploading.set(
          false,
        );

        this.supportDocumentsUploadProgress.set(
          null,
        );

      }

    }
  }

  async onViewSupportDocument(
    archivo: PublicSupportDocumentFile,
  ): Promise<void> {

    const record =
      this.selectedHiringRecord();

    if (!record) {
      return;
    }

    this.closeSupportDocumentPreview();

    const requestId =
      ++this.supportDocumentPreviewRequestId;

    const idCargaDocente =
      record.idCargaDocente;

    const documentRequestSequence =
      this.supportDocumentsRequestSequence;

    const extension =
      (archivo.extension ?? '')
        .replace('.', '')
        .trim()
        .toLowerCase();

    const mimeTypes:
      Record<string, string> = {
        pdf: 'application/pdf',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
      };

    const expectedMimeType =
      mimeTypes[extension];

    if (!expectedMimeType) {
      return;
    }

    this.supportDocumentPreviewFileName.set(
      archivo.nombre,
    );

    this.supportDocumentPreviewError.set(
      null,
    );

    this.supportDocumentPreviewUrl.set(
      null,
    );

    this.supportDocumentPreviewLoading.set(
      true,
    );

    this.supportDocumentPreviewOpen.set(
      true,
    );

    const isCurrentRequest = () =>
      requestId ===
        this.supportDocumentPreviewRequestId &&
      documentRequestSequence ===
        this.supportDocumentsRequestSequence &&
      this.selectedHiringRecord()
        ?.idCargaDocente ===
        idCargaDocente;

    try {

      const blob =
        await firstValueFrom(
          this.hiringService
            .getSupportDocumentFile(
              idCargaDocente,
              archivo.id,
            ),
        );

      if (!isCurrentRequest()) {
        return;
      }

      const responseMimeType =
        blob.type
          .split(';')[0]
          .trim()
          .toLowerCase();

      if (
        responseMimeType !==
        expectedMimeType
      ) {

        this.supportDocumentPreviewError.set(
          'El formato del documento no permite su previsualización.',
        );

        return;
      }

      const objectUrl =
        URL.createObjectURL(blob);

      this.supportDocumentPreviewObjectUrl =
        objectUrl;

      this.supportDocumentPreviewUrl.set(
        this.sanitizer
          .bypassSecurityTrustResourceUrl(
            objectUrl,
          ),
      );

    } catch {

      if (isCurrentRequest()) {

        this.supportDocumentPreviewError.set(
          'No fue posible recuperar el documento solicitado.',
        );

      }

    } finally {

      if (isCurrentRequest()) {

        this.supportDocumentPreviewLoading.set(
          false,
        );

      }

    }
  }

  closeSupportDocumentPreview(): void {

    this.supportDocumentPreviewRequestId++;

    this.supportDocumentPreviewOpen.set(
      false,
    );

    this.supportDocumentPreviewLoading.set(
      false,
    );

    this.supportDocumentPreviewError.set(
      null,
    );

    this.supportDocumentPreviewUrl.set(
      null,
    );

    this.revokeSupportDocumentPreviewUrl();
  }

  private revokeSupportDocumentPreviewUrl(): void {

    if (
      this.supportDocumentPreviewObjectUrl
    ) {

      URL.revokeObjectURL(
        this.supportDocumentPreviewObjectUrl,
      );

      this.supportDocumentPreviewObjectUrl =
        null;

    }
  }

  async onDownloadSupportDocument(
    archivo: PublicSupportDocumentFile,
  ): Promise<void> {

    const record =
      this.selectedHiringRecord();

    if (
      !record ||
      this.supportDocumentDownloadingFileId()
    ) {
      return;
    }

    const idCargaDocente =
      record.idCargaDocente;

    const requestSequence =
      this.supportDocumentsRequestSequence;

    this.supportDocumentDownloadingFileId.set(
      archivo.id,
    );

    const isCurrentRequest = () =>
      requestSequence ===
        this.supportDocumentsRequestSequence &&
      this.selectedHiringRecord()
        ?.idCargaDocente ===
        idCargaDocente;

    try {

      const blob =
        await firstValueFrom(
          this.hiringService
            .getSupportDocumentFile(
              idCargaDocente,
              archivo.id,
            ),
        );

      if (!isCurrentRequest()) {
        return;
      }

      const objectUrl =
        URL.createObjectURL(blob);

      const anchor =
        document.createElement('a');

      anchor.href =
        objectUrl;

      anchor.download =
        archivo.nombre;

      document.body.appendChild(
        anchor,
      );

      anchor.click();

      anchor.remove();

      setTimeout(() => {

        URL.revokeObjectURL(
          objectUrl,
        );

      }, 30000);

    } catch {

      if (isCurrentRequest()) {

        this.notificationService.error(
          'No fue posible descargar el documento.',
          'Documentos de soporte',
        );

      }

    } finally {

      if (isCurrentRequest()) {

        this.supportDocumentDownloadingFileId.set(
          null,
        );

      }

    }
  }

  downloadSupportDocumentPreview(): void {

    const objectUrl =
      this.supportDocumentPreviewObjectUrl;

    if (
      !objectUrl ||
      this.supportDocumentPreviewLoading()
    ) {
      return;
    }

    const anchor =
      document.createElement('a');

    anchor.href =
      objectUrl;

    anchor.download =
      this.supportDocumentPreviewFileName();

    document.body.appendChild(
      anchor,
    );

    anchor.click();

    anchor.remove();
  } 

  onRequestDeleteSupportDocument(
    archivo: PublicSupportDocumentFile,
  ): void {

    const record =
      this.selectedHiringRecord();

    if (
      !record ||
      this.ptdEditsBlocked() ||
      this.supportDocumentsUploading() ||
      this.supportDocumentDeletingFileId() !== null
    ) {
      return;
    }

    const archivoRegistrado =
      this.supportDocuments()
        ?.categorias.some(
          categoria =>
            categoria.archivos.some(
              documento =>
                documento.id === archivo.id,
            ),
        ) ?? false;

    if (!archivoRegistrado) {
      return;
    }

    this.supportDocumentPendingDeletion.set({
      archivo,
      idCargaDocente:
        record.idCargaDocente,
    });
  }

  closeSupportDocumentDeleteModal(): void {

    if (
      this.supportDocumentDeletingFileId() !== null
    ) {
      return;
    }

    this.supportDocumentPendingDeletion.set(
      null,
    );
  }

  async confirmDeleteSupportDocument(): Promise<void> {

    const pending =
      this.supportDocumentPendingDeletion();

    const record =
      this.selectedHiringRecord();

    if (
      !pending ||
      !record ||
      this.ptdEditsBlocked() ||
      this.supportDocumentsUploading() ||
      this.supportDocumentDeletingFileId() !== null ||
      record.idCargaDocente !== pending.idCargaDocente
    ) {
      return;
    }

    const {
      archivo,
      idCargaDocente,
    } = pending;

    const requestSequence =
      this.supportDocumentsRequestSequence;

    const isCurrentRequest = () =>
      requestSequence ===
        this.supportDocumentsRequestSequence &&
      this.selectedHiringRecord()
        ?.idCargaDocente ===
        idCargaDocente;

    this.supportDocumentDeletingFileId.set(
      archivo.id,
    );

    try {

      const resultado =
        await firstValueFrom(
          this.hiringService
            .deleteSupportDocumentFile(
              idCargaDocente,
              archivo.id,
            ),
        );

      if (!isCurrentRequest()) {
        return;
      }

      this.supportDocuments.set(
        resultado,
      );

      this.supportDocumentsLoadedForId.set(
        idCargaDocente,
      );

      if (this.supportDocumentPreviewOpen()) {
        this.closeSupportDocumentPreview();
      }

      this.notificationService.success(
        'El documento fue eliminado correctamente.',
        'Documentos de soporte',
      );

    } catch {

      if (!isCurrentRequest()) {
        return;
      }

      try {

        const documentosActualizados =
          await firstValueFrom(
            this.hiringService
              .getSupportDocuments(
                idCargaDocente,
              ),
          );

        if (isCurrentRequest()) {

          this.supportDocuments.set(
            documentosActualizados,
          );

          this.supportDocumentsLoadedForId.set(
            idCargaDocente,
          );
        }

      } catch {

        if (isCurrentRequest()) {

          this.supportDocumentsLoadedForId.set(
            null,
          );
        }
      }

      if (isCurrentRequest()) {

        this.notificationService.error(
          'No fue posible confirmar la eliminación. Revisa los documentos registrados antes de intentar nuevamente.',
          'Documentos de soporte',
        );
      }

    } finally {

      if (isCurrentRequest()) {

        this.supportDocumentDeletingFileId.set(
          null,
        );

        this.supportDocumentPendingDeletion.set(
          null,
        );
      }

    }
  }

}