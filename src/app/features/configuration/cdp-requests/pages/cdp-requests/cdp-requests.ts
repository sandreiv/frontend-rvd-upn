import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  OnInit,
  signal,
  WritableSignal,
} from '@angular/core';

import { NotificationService } from '../../../../../core/service/notification-service';

import { CdpService } from '../../data/cdp.service';
import { CdpContext, CdpSearchResult, FacultyCoordinationItem } from '../../model/cdp-context.model';
import {
  CdpAttachment,
  CdpRequest,
} from '../../model/cdp-request.model';

import { DocumentPreview } from '../../../../../shared/components/form/document-preview/document-preview';
import { DocumentRequest } from '../../../../../shared/model/document.model';

import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, firstValueFrom, Observable } from 'rxjs';

import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { getFileTypeIconPath } from '../../../../../shared/utils/file-type-icon.util';
import {
  Select,
  type Option as SelectOption,
} from '../../../../../shared/components/form/select/select';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { Tooltip } from '../../../../../shared/ui/tooltip/tooltip';

import { UniversityPeriodItem } from '../../../preload-call/model/preload-call.model';

import { CoordinationTable } from '../../../professor-preload/components/coordination-table/coordination-table';
import { CoordinationService } from '../../../professor-preload/data/coordination.service';

import { NewModal } from '../../../../../shared/ui/new-modal/new-modal';

import {
  CoordinationItem,
  CoordinationPreloadCallApi,
} from '../../../professor-preload/model/coordination.model';
import { PermissionService } from '../../../../../core/service/permission-service';
import { AuthService } from '../../../../../core/service/auth-service';
import { CdpSearchModal } from '../../components/cdp-search-modal/cdp-search-modal';

@Component({
  selector: 'app-cdp-requests',
  imports: [
    Button,
    Select,
    SectionFrame,
    CoordinationTable,
    Icon,
    Tooltip,
    NewModal,
    DocumentPreview,
    CdpSearchModal,
  ],
  templateUrl: './cdp-requests.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CdpRequests implements OnInit {

  private readonly coordinationService = inject(CoordinationService);
  private readonly cdpService = inject(CdpService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly permissions = inject(PermissionService);

  readonly getFileTypeIconPath = getFileTypeIconPath;


  readonly universityPeriods = signal<UniversityPeriodItem[]>([]);
  readonly selectedPeriodId = signal('');
  readonly appliedPeriodId = signal<number | null>(null);

  readonly selectedPreloadCallId = signal('');
  readonly appliedPreloadCallId = signal<string | null>(null);

  readonly selectedCoordinationIds = signal<string[]>([]);
  readonly selectedFaculty = signal<FacultyCoordinationItem | null>(null);

  readonly isLoadingPeriods = signal(false);

  readonly cdpObservation = signal('');
  readonly cdpAttachments = signal<File[]>([]);
  readonly isRequestingCdp = signal(false);
  readonly isSendingCdp = signal(false);
  readonly isDisassociatingCdp = signal(false);

  readonly showCdpSearchModal = signal(false);

  readonly showDocumentPreview = signal(false);
  readonly selectedDocument = signal<DocumentRequest | null>(null);

  readonly isCdpOnAcademicDevelopment = computed(() => this.selectedFaculty()?.solicitud.estado === 'DESARROLLO ACADEMICO');
  readonly isCdpOnViceAcademic = computed(() => ['VICERRECTORIA ACADEMICA', 'CDP APROBADO'].includes(this.selectedFaculty()?.solicitud.estado ?? ''));

  readonly showRequestCdpModal = signal(false);

  readonly cdpObservationMaxLength = 250;

  readonly cdpMaxFileSize =
    10 * 1024 * 1024;

  readonly cdpMaxTotalSize =
    100 * 1024 * 1024;

  readonly canRequestCdp = computed(
    () =>
      this.resolveActiveCdpFacultyId() != null &&
      this.appliedPeriodId() != null &&
      this.appliedPreloadCallId() != null &&
      this.hasCdpCoordinations() &&
      !this.isLoadingCurrentCdpRequest() &&
      !this.hasCdpRequest() &&
      this.cdpObservation().trim().length > 0 &&
      this.cdpAttachments().length > 0 &&
      !this.isRequestingCdp(),
  );

  readonly isDownloadingReport = signal(false);
  readonly isDownloadingPdfReport = signal(false);


  readonly isDean = computed(() => {
    const rolesUsuario = this.authService.getRoles();

    return rolesUsuario.includes('Decano');
  });

  readonly isAcademicDev = computed(() => {
    const rolesUsuario = this.authService.getRoles();

    return rolesUsuario.includes('Desarrollo academico');
  });

  readonly isViceAcademic = computed(() => {
    const rolesUsuario = this.authService.getRoles();

    return rolesUsuario.includes('Vicerrectoria academica');
  });

  readonly selectedCdpContextId = signal('');

  readonly cdpContextResource = rxResource({
    params: () => {
      return this.isDean() ? {} : undefined;
    },

    stream: () =>
      this.cdpService.getContexts(),

    defaultValue: [] as CdpContext[],
  });

  readonly cdpContexts = computed(
    () => this.cdpContextResource.value(),
  );

  readonly activeCdpContextId = computed(() => {
    const contexts = this.cdpContexts();

    if (!contexts.length) {
      return '';
    }

    const selectedId =
      this.selectedCdpContextId();

    if (
      selectedId &&
      contexts.some(
        (context) =>
          String(context.idCoordinacionFacultad) ===
          selectedId,
      )
    ) {
      return selectedId;
    }

    return String(
      contexts[0].idCoordinacionFacultad,
    );
  });

  readonly activeCdpContext = computed<CdpContext | null>(
    () => {
      const activeId =
        this.activeCdpContextId();

      if (!activeId) {
        return null;
      }

      return (
        this.cdpContexts().find(
          (context) =>
            String(
              context.idCoordinacionFacultad,
            ) === activeId,
        ) ?? null
      );
    },
  );

  readonly hasMultipleCdpContexts = computed(
    () => this.cdpContexts().length > 1,
  );

  readonly cdpContextOptions =
    computed<SelectOption[]>(() =>
      this.cdpContexts().map((context) => ({
        value: String(
          context.idCoordinacionFacultad,
        ),
        label: context.facultad,
      })),
    );
  
  readonly currentCdpRequestResource = rxResource({
    params: () => {
      if (!this.isDean()) {
        return undefined;
      }

      const idCoordinacionFacultad =
        this.resolveActiveCdpFacultyId();

      const idPeriodoUniversidad =
        this.appliedPeriodId();

      const idConvocatoria =
        this.appliedPreloadCallId();

      if (
        idCoordinacionFacultad == null ||
        idPeriodoUniversidad == null ||
        idConvocatoria == null ||
        !idConvocatoria
      ) {
        return undefined;
      }

      return {
        idCoordinacionFacultad,
        idPeriodoUniversidad,
      };
    },

    stream: ({ params }) =>
      this.cdpService.getCurrentRequest(
        params.idCoordinacionFacultad,
        params.idPeriodoUniversidad,
      ),

    defaultValue: null as CdpRequest | null,
  });

  readonly currentCdpRequest = computed(
    () => this.currentCdpRequestResource.value(),
  );

  readonly isLoadingCurrentCdpRequest = computed(
    () => this.currentCdpRequestResource.isLoading(),
  );

  readonly hasCdpRequest = computed(
    () => this.currentCdpRequest() != null,
  );

  readonly assignedCdp = computed(() => this.selectedFaculty()?.cdpTesoreria ?? null);


  readonly cdpObservationRemaining = computed(
    () =>
      this.cdpObservationMaxLength -
      this.cdpObservation().length,
  );

  readonly activePreloadCallsResource = rxResource({
    params: () => {
      const idPeriodoUniversidad =
        this.resolveSelectedPeriodId();

      if (idPeriodoUniversidad == null) {
        return undefined;
      }

      return {
        idPeriodoUniversidad,
      };
    },

    stream: ({ params }) =>
      this.coordinationService.getActivePreloadCall(
        params.idPeriodoUniversidad,
      ),

    defaultValue: [] as CoordinationPreloadCallApi[],
  });

  readonly cdpRequestsForDeanResource = rxResource({
    params: () => {
      const idPeriodoUniversidad =
        this.appliedPeriodId();

      const preloadCallId =
        this.appliedPreloadCallId();

      const idCoordinacionFacultad =
        this.resolveActiveCdpFacultyId();  

      if (
        idPeriodoUniversidad == null ||
        preloadCallId == null ||
        !preloadCallId ||
        idCoordinacionFacultad == null
      ) {
        return undefined;
      }

      const idConvocatoria =
        Number(preloadCallId);

      if (Number.isNaN(idConvocatoria)) {
        return undefined;
      }

      if (!this.isDean()) {
        return undefined;
      }

      return {
        idPeriodoUniversidad,
        idConvocatoria,
        idCoordinacionFacultad,
      };
    },

    stream: ({ params }) =>
      this.coordinationService.getCdpRequests(
        params.idPeriodoUniversidad,
        params.idConvocatoria,
        params.idCoordinacionFacultad,
      ),

    defaultValue: [] as CoordinationItem[],
  });

  readonly cdpRequestsForAcademicsResource = rxResource({
    params: () => {
      const idPeriodoUniversidad = this.appliedPeriodId();

      if (idPeriodoUniversidad == null) {
        return undefined;
      }
      if (this.isDean()) {
        return undefined;
      }

      return { idPeriodoUniversidad };
    },

    stream: ({ params }) =>
      this.coordinationService.getCdpRequestsForAcademics(
        params.idPeriodoUniversidad,
      ),

    defaultValue: [] as FacultyCoordinationItem[],
  });

  readonly periodOptions =
    computed<SelectOption[]>(() =>
      this.universityPeriods().map((item) => ({
        value: String(item.id),
        label: `${item.anio} - ${item.periodo}`,
      })),
    );

  readonly preloadCallOptions =
    computed<SelectOption[]>(() =>
      this.activePreloadCallsResource
        .value()
        .map((item) => ({
          value: String(item.id),
          label: item.nombre,
        })),
    );

  readonly tableItems = computed(() => {
    return this.isDean() ? this.cdpRequestsForDeanResource.value() : this.cdpRequestsForAcademicsResource.value();
  })

  readonly selectedFacultyAttachments = computed(() => this.selectedFaculty()?.solicitud.adjuntos ?? []);

  readonly isLoadingPreloadCalls = computed(
    () =>
      this.activePreloadCallsResource.isLoading(),
  );

  readonly isLoadingCoordinations = computed(
    () =>
      this.cdpRequestsForDeanResource.isLoading(),
  );

  readonly isLoadingFaculties = computed(() => this.cdpRequestsForAcademicsResource.isLoading())

  readonly hasAppliedFilter = computed(() => {
    if (this.isDean()) {
      return (this.appliedPeriodId() != null) && (this.appliedPreloadCallId() != null)
    }

    return this.appliedPeriodId() != null;
  })

  readonly tableEmptyMessage = computed(() => {
    if (this.hasAppliedFilter()) {
      return 'No hay coordinaciones con carga avalada para el período y la convocatoria seleccionados.';
    }

    if (!this.selectedPeriodId()) {
      return 'Seleccione un periodo y pulse Filtrar.';
    }

    if (this.isDean() && !this.selectedPreloadCallId()) {
      return 'Seleccione una convocatoria y pulse Filtrar.';
    }

    return 'Seleccione un periodo y pulse Filtrar.';
  });

  readonly titleSection = computed(() => {
    return this.isDean() ? 'Coordinaciones' : 'Facultades';
  })
  
  readonly descriptionSection = computed(() => {
    return this.isDean() ? 'Consulta las coordinaciones de la facultad con carga avalada para la solicitud del CDP.' : 'Selecciona las facultades para revisar el CDP.';
  })

  readonly titleCdpSection = computed(() => {
    return this.isDean() ? 'Solicitar CDP' : 'Revisar CDP';
  })
  readonly descriptionCdpSection = computed(() => {
    if (this.isDean()) {
      return 'Registra las observaciones y adjuntos de la solicitud.';
    }

    const faculty = this.selectedFaculty();
    if (faculty) {
      return `Revisa las observaciones y adjuntos de ${faculty.nombre}.`
    }

    return 'Revisa las observaciones y adjuntos de la solicitud.';
  })

  readonly canShowCdpReportButtons = computed(() => this.permissions.canDownloadCdpReport());
  readonly canCreateCdpRequest = computed(() => this.permissions.canAddCdpRequest());
  readonly canSendCdpToVice = computed(() => this.permissions.canSendCdpToVice());
  readonly canApproveCdpRequest = computed(() => this.permissions.canApproveCdpRequest());

  readonly hasPendingDeanFilterChanges = computed(() => {
    if (!this.isDean()) {
      return false;
    }

    const selectedPeriodId =
      this.resolveSelectedPeriodId();

    const selectedConvocatoriaId =
      this.resolveSelectedConvocatoriaId();

    const appliedPeriodId =
      this.appliedPeriodId();

    const appliedConvocatoriaId =
      this.appliedPreloadCallId();

    return (
      selectedPeriodId !== appliedPeriodId ||
      String(selectedConvocatoriaId ?? '') !==
        String(appliedConvocatoriaId ?? '')
    );
  });

  readonly canDownloadCdpReport = computed(() => {
    if (!this.canShowCdpReportButtons()) {
      return false;
    }

    const periodId =
      this.resolveSelectedPeriodId();

    const convocatoriaId =
      this.resolveSelectedConvocatoriaId();

    const idCoordinacionFacultad =
      this.resolveActiveCdpFacultyId();

    return (
      periodId != null &&
      convocatoriaId != null &&
      idCoordinacionFacultad != null &&
      this.hasAppliedFilter() &&
      !this.hasPendingDeanFilterChanges() &&
      !this.isLoadingCoordinations() &&
      this.hasCdpCoordinations()
    );
  });

  readonly downloadReportTooltip = computed(() => {
    if (this.canDownloadCdpReport()) {
      return '';
    }

    if (
      this.hasAppliedFilter() &&
      !this.isLoadingCoordinations() &&
      !this.hasCdpCoordinations()
    ) {
      return 'No es posible descargar el reporte porque no hay coordinaciones con carga en Aval Desarrollo para el periodo y la convocatoria seleccionados.';
    }

    return 'Seleccione un periodo y una convocatoria para generar el reporte.';
  });

  readonly isFilterDisabled = computed(() => {
    if (this.isLoadingPeriods()) return true;

    if (!this.selectedPeriodId()) return true;

    if (this.isDean()) {
      return (
        this.cdpContextResource.isLoading() ||
        this.resolveActiveCdpFacultyId() == null ||
        !this.selectedPreloadCallId() ||
        this.isLoadingPreloadCalls() ||
        this.isLoadingCoordinations()
      );
    }

    return this.isLoadingFaculties();
  })

  readonly canShowCdpSection = computed(() => {
    if (this.isDean()) {
      return (
        this.hasAppliedFilter() &&
        !this.hasPendingDeanFilterChanges() &&
        !this.isLoadingCoordinations() &&
        this.hasCdpCoordinations()
      );
    }

    return this.selectedFaculty() !== null;
  });

  readonly hasCdpCoordinations = computed(() => {
    if (!this.isDean()) {
      return true;
    }

    return this.cdpRequestsForDeanResource.value().length > 0;
  });

  constructor() {
    effect(() => {
      const faculty = this.selectedFaculty();
      const isLoading = this.cdpRequestsForAcademicsResource.isLoading();
      if (!faculty || isLoading) {
        return;
      }

      const refreshedFaculty = this.cdpRequestsForAcademicsResource.value()
        .find((item) => item.solicitud.id === faculty.solicitud.id);

      // Actualizar el objeto en memoria de la facultad seleccionada despues de asignar un CDP
      if (refreshedFaculty) {
        this.selectedFaculty.set(refreshedFaculty);
      }
    });
  }

  ngOnInit(): void {
    void this.loadUniversityPeriods();
  }

  onPeriodChange(periodId: string): void {
    const changed =
      this.selectedPeriodId() !== periodId;

    this.selectedPeriodId.set(periodId);
    this.selectedPreloadCallId.set('');

    if (changed && this.isDean()) {
      this.resetCdpDraft();
    }
  }

  onCdpContextChange(
    idCoordinacionFacultad: string,
  ): void {

    if (
      !idCoordinacionFacultad ||
      idCoordinacionFacultad ===
        this.activeCdpContextId()
    ) {
      return;
    }

    const exists =
      this.cdpContexts().some(
        (context) =>
          String(
            context.idCoordinacionFacultad,
          ) === idCoordinacionFacultad,
      );

    if (!exists) {
      return;
    }

    this.resetDeanContextState();

    this.selectedCdpContextId.set(
      idCoordinacionFacultad,
    );
  }

  onPreloadCallChange(
    preloadCallId: string,
  ): void {
    this.selectedPreloadCallId.set(
      preloadCallId,
    );
  }

  onApplyFilter(): void {
    if (this.isDean()) {
      this.applyDeanFilters();
      return;
    }

    this.applyAcademicDevelopmentFilters();
  }

  onRefreshCoordinations(): void {
    if (
      this.appliedPeriodId() == null ||
      this.appliedPreloadCallId() == null
    ) {
      return;
    }

    this.cdpRequestsForDeanResource.reload();
  }

  onRefreshFaculties(): void {
    if (this.appliedPeriodId() == null) {
      return;
    }

    this.selectedFaculty.set(null);
    this.cdpObservation.set('');
    this.cdpAttachments.set([]);
    this.cdpRequestsForAcademicsResource.reload();
  }

  onCdpObservationChange(event: Event): void {
    const textarea =
      event.target as HTMLTextAreaElement;

    this.cdpObservation.set(
      textarea.value.slice(
        0,
        this.cdpObservationMaxLength,
      ),
    );
  }

  onOpenFacultyCdpRequest(row: CoordinationItem): void {
    const faculty = row as FacultyCoordinationItem;
    this.selectedFaculty.set(faculty);

    this.cdpObservation.set(
      faculty.solicitud.observacion ?? ''
    );

    this.cdpAttachments.set([]);
  }

  onCdpAttachmentSelected(event: Event): void {
    const input =
      event.target as HTMLInputElement;

    const selectedFiles =
      Array.from(input.files ?? []);

    input.value = '';

    if (!selectedFiles.length) {
      return;
    }

    const oversizedFile =
      selectedFiles.find(
        (file) =>
          file.size > this.cdpMaxFileSize,
      );

    if (oversizedFile) {

      this.notificationService.error(
        `El archivo "${oversizedFile.name}" supera el tamaño máximo permitido de 10 MB.`,
        'Adjunto no permitido',
      );

      return;
    }

    const currentTotal =
      this.cdpAttachments()
        .reduce(
          (total, file) =>
            total + file.size,
          0,
        );

    const selectedTotal =
      selectedFiles.reduce(
        (total, file) =>
          total + file.size,
        0,
      );

    if (
      currentTotal + selectedTotal >
      this.cdpMaxTotalSize
    ) {

      this.notificationService.error(
        'Los archivos adjuntos no pueden superar los 100 MB por solicitud.',
        'Límite de adjuntos',
      );

      return;
    }

    this.cdpAttachments.update(
      (current) => [
        ...current,
        ...selectedFiles,
      ],
    );
  }

  removeCdpAttachment(index: number): void {
    this.cdpAttachments.update(
      (current) =>
        current.filter(
          (_, currentIndex) =>
            currentIndex !== index,
        ),
    );
  }

  async onRequestCdp(): Promise<void> {
    if (
      this.isRequestingCdp() ||
      !this.canRequestCdp()
    ) {
      return;
    }

    const periodId =
      this.appliedPeriodId();

    const idCoordinacionFacultad =
      this.resolveActiveCdpFacultyId();

    const convocatoriaId =
      this.appliedPreloadCallId();  

    if (
      periodId == null ||
      convocatoriaId == null ||
      idCoordinacionFacultad == null
    ) {
      return;
    }

    this.isRequestingCdp.set(true);

    try {

      await firstValueFrom(
        this.cdpService.createRequest(
          this.cdpObservation(),
          this.cdpAttachments(),
          String(periodId),
          String(idCoordinacionFacultad),
          String(convocatoriaId),
        ),
      );

      this.notificationService.success(
        'La solicitud CDP fue registrada correctamente.',
        'Solicitud CDP',
      );

      this.currentCdpRequestResource.reload();
      this.resetCdpDraft();

    } catch (error) {

      console.error(
        'Error al registrar la solicitud CDP:',
        error,
      );

      this.notificationService.error(
        'No fue posible registrar la solicitud CDP.',
        'Solicitud CDP',
      );

    } finally {

      this.isRequestingCdp.set(false);

    }
  }

  private resolveSelectedPeriodId():
    number | null {

    const periodId =
      this.selectedPeriodId();

    if (!periodId) {
      return null;
    }

    const parsed = Number(periodId);

    return Number.isNaN(parsed)
      ? null
      : parsed;
  }

  private resolveSelectedConvocatoriaId():
    number | null {

    const convocatoriaId =
      this.selectedPreloadCallId();

    if (!convocatoriaId) {
      return null;
    }

    const parsed = Number(convocatoriaId);

    return Number.isNaN(parsed)
      ? null
      : parsed;
  }

  private triggerBrowserDownload(
    blob: Blob,
    fileName: string,
  ): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private async loadUniversityPeriods():
    Promise<void> {

    this.isLoadingPeriods.set(true);

    try {
      const periods =
        await firstValueFrom(
          this.coordinationService
            .getUniversityPeriod(),
        );

      this.universityPeriods.set(
        periods ?? [],
      );
    } catch (error) {
      console.error(
        'Error al cargar periodos universitarios:',
        error,
      );

      this.universityPeriods.set([]);
    } finally {
      this.isLoadingPeriods.set(false);
    }
  }

  async downloadCdpReport(): Promise<void> {
    await this.runCdpDownload(
      this.isDownloadingReport,
      (
        idConvocatoria,
        idPeriodoUniversidad,
        idCoordinacionFacultad,
      ) =>
        this.cdpService.downloadCdpReport(
          idConvocatoria,
          idPeriodoUniversidad,
          idCoordinacionFacultad,
        ),
      'Error al descargar el reporte CDP:',
    );
  }

  async downloadCdpPdfReport(): Promise<void> {
    await this.runCdpDownload(
      this.isDownloadingPdfReport,
      (
        idConvocatoria,
        idPeriodoUniversidad,
        idCoordinacionFacultad,
      ) =>
        this.cdpService.downloadCdpPdfReport(
          idConvocatoria,
          idPeriodoUniversidad,
          idCoordinacionFacultad,
        ),
      'Error al descargar el reporte PDF CDP:',
    );
  }

  private async runCdpDownload(
    isDownloading: WritableSignal<boolean>,
    request: (
      idConvocatoria: number,
      idPeriodoUniversidad: number,
      idCoordinacionFacultad: number,
    ) => Observable<{ blob: Blob; fileName: string }>,
    errorMessage: string,
  ): Promise<void> {
    if (
      this.isDownloadingReport() ||
      this.isDownloadingPdfReport() ||
      !this.canDownloadCdpReport()
    ) {
      return;
    }

    const idPeriodoUniversidad =
      this.appliedPeriodId();

    const appliedConvocatoriaId =
      this.appliedPreloadCallId();

    const idConvocatoria =
      appliedConvocatoriaId != null
        ? Number(appliedConvocatoriaId)
        : null;

    const idCoordinacionFacultad =
      this.resolveActiveCdpFacultyId();  

    if (
      idPeriodoUniversidad == null ||
      idConvocatoria == null ||
      idCoordinacionFacultad == null
    ) {
      return;
    }

    isDownloading.set(true);

    try {
      const file = await firstValueFrom(
        request(
          idConvocatoria,
          idPeriodoUniversidad,
          idCoordinacionFacultad,
        ),
      );

      this.triggerBrowserDownload(
        file.blob,
        file.fileName,
      );
    } catch (error) {
      console.error(errorMessage, error);
    } finally {
      isDownloading.set(false);
    }
  }

  openRequestCdpModal(): void {
    if (!this.canRequestCdp()) {
      return;
    }

    this.showRequestCdpModal.set(true);
  }

  closeRequestCdpModal(): void {
    if (this.isRequestingCdp()) {
      return;
    }

    this.showRequestCdpModal.set(false);
  }

  sendCdpToViceAcademic(): void {
    const idSolicitud = this.selectedFaculty()?.solicitud.id
    if (!idSolicitud) return;

    if (this.isSendingCdp() || !this.isCdpOnAcademicDevelopment()) {
      return;
    }
    
    this.isSendingCdp.set(true);
    this.cdpService
      .sendCdpToVice(idSolicitud)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSendingCdp.set(false)),
      )
    .subscribe({
      next: () => {
        this.resetSelectedFaculty();
        this.cdpRequestsForAcademicsResource.reload();
      }
    });
  }

  openCdpSearchModal(): void {
    if (!this.isCdpOnViceAcademic()) {
      return;
    }

    this.showCdpSearchModal.set(true);
  }

  closeCdpSearchModal(): void {
    this.showCdpSearchModal.set(false);
  }

  async onCdpApproved(): Promise<void> {
    this.closeCdpSearchModal();
    this.cdpRequestsForAcademicsResource.reload()
  }

  onDisassociate(): void {
    const idSolicitud = this.selectedFaculty()?.solicitud.id
    if (!idSolicitud) return;

    if (this.isDisassociatingCdp() || !this.isCdpOnViceAcademic()) {
      return;
    }

    this.isDisassociatingCdp.set(true);
    this.cdpService
      .disapproveCdpRequest(idSolicitud)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isDisassociatingCdp.set(false)),
      )
      .subscribe({
        next: () => {
          this.cdpRequestsForAcademicsResource.reload();
        }
      });
  }

  openAttachmentPreview(
    adjunto: CdpAttachment,
  ): void {
    const extension =
      adjunto.nombre
        .split('.')
        .pop()
        ?.toLowerCase() ?? '';

    this.selectedDocument.set({
      mimeType: '',
      tamano: 0,
      extension,
      path: adjunto.path,
      descripcion: adjunto.nombre,
      nombreArchivo: adjunto.nombre,
    });

    this.showDocumentPreview.set(true);
  }

  openLocalAttachmentPreview(
    file: File,
  ): void {
    const extension =
      file.name
        .split('.')
        .pop()
        ?.toLowerCase() ?? '';

    this.selectedDocument.set({
      archivo: file,
      mimeType:
        file.type ||
        'application/octet-stream',
      tamano: file.size,
      extension,
      path: '',
      descripcion: file.name,
      nombreArchivo: file.name,
    });

    this.showDocumentPreview.set(true);
  }

  closeDocumentPreview(): void {
    this.showDocumentPreview.set(false);
    this.selectedDocument.set(null);
  }

  private resolveActiveCdpFacultyId():
    number | null {

    const context =
      this.activeCdpContext();

    return context?.idCoordinacionFacultad ?? null;
  }

  private resetCdpDraft(): void {
    this.cdpObservation.set('');
    this.cdpAttachments.set([]);
    this.showRequestCdpModal.set(false);
  }

  private resetDeanContextState(): void {
    this.selectedCoordinationIds.set([]);
    this.selectedFaculty.set(null);

    this.resetCdpDraft();

    this.closeDocumentPreview();
  }

  private applyDeanFilters(): void {
    const periodId =
      this.selectedPeriodId();

    const preloadCallId =
      this.selectedPreloadCallId();

    if (!periodId || !preloadCallId) {
      this.appliedPeriodId.set(null);
      this.appliedPreloadCallId.set(null);
      this.selectedCoordinationIds.set([]);
      return;
    }

    const parsedPeriodId =
      Number(periodId);

    if (Number.isNaN(parsedPeriodId)) {
      return;
    }

    this.appliedPeriodId.set(
      parsedPeriodId,
    );

    this.appliedPreloadCallId.set(
      preloadCallId,
    );

    this.selectedCoordinationIds.set([]);
  }

  private applyAcademicDevelopmentFilters(): void {
    const periodId = this.selectedPeriodId();

    if (!periodId) {
      this.appliedPeriodId.set(null);
      return;
    }

    const parsedPeriodId = Number(periodId);

    if (Number.isNaN(parsedPeriodId)) {
      return;
    }

    this.resetSelectedFaculty();
    this.appliedPeriodId.set(parsedPeriodId);
  }

  private resetSelectedFaculty(): void {
    this.selectedFaculty.set(null);
    this.cdpObservation.set('');
    this.cdpAttachments.set([]);
  }
}