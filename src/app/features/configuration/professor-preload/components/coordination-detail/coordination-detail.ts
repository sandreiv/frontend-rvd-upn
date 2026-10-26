import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { CoordinationItem } from '../../model/coordination.model';
import { CoordinationService } from '../../data/coordination.service';
import { ContractModalityDetail } from '../contract-modality-detail/contract-modality-detail';
import { TotalCoordination } from '../total-coordination/total-coordination';
import { TotalActivitiesGraph } from '../total-activities-graph/total-activities-graph';
import { Tooltip } from '../../../../../shared/ui/tooltip/tooltip';
import { PermissionService } from '../../../../../core/service/permission-service';
import { AuthService } from '../../../../../core/service/auth-service';
import { DeclinePreloadDeanRequest } from '../../model/preload-carga.model';
import { DeclinePreloadModal } from "../decline-preload-modal/decline-preload-modal";
import { ObservationsModal } from "../observations-modal/observations-modal";
import { ObservacionesCargaItem } from '../../model/observations-load';
import { CoordinationPreloadCallModal } from "../coordination-preload-call-modal/coordination-preload-call-modal";

@Component({
  selector: 'app-coordination-detail',
  imports: [
    Button,
    Icon,
    ContractModalityDetail,
    TotalCoordination,
    TotalActivitiesGraph,
    Tooltip,
    DeclinePreloadModal,
    ObservationsModal,
    CoordinationPreloadCallModal
],
  templateUrl: './coordination-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class CoordinationDetail {
  private readonly authService = inject(AuthService);
  private readonly coordinationService = inject(CoordinationService);
  private readonly destroyRef = inject(DestroyRef);
  readonly permissions = inject(PermissionService);

  coordination = input.required<CoordinationItem>();
  coordinationsCatalog = input<CoordinationItem[]>([]);
  idPeriodoUniversidad = input<number | null>(null);

  back = output<void>();
  coordinationUpdated = output<CoordinationItem>();

  readonly resolvedPeriodId = computed(
    () =>
      this.idPeriodoUniversidad() ??
      this.coordination().idPeriodoUniversidad,
  );
  readonly isAssignModalOpen = signal(false);
  readonly isDeclineModalOpen = signal(false);
  readonly isObservationModalOpen = signal(false);
  readonly hasLoadedProfessors = signal(false);
  readonly totalRefreshKey = signal(0);
  readonly professorRefreshKey = signal(0);
  readonly isDownloadingReport = signal(false);
  readonly isDownloadingPdfReport = signal(false);
  readonly isEndorsingPreload = signal(false);
  readonly isDecliningPreload = signal(false);
  readonly isApprovingProfessors = signal(false);
  readonly isSearchingObservations = signal(false);
  readonly isApprovingPreloadDean = signal(false);
  readonly isApprovingPreloadDevelopment = signal(false);
  readonly anyProfessorsPreloadVerified = signal(false);
  readonly allProfessorsPreloadApproved = signal(false);

  readonly searchObservations = signal<ObservacionesCargaItem[]>([]);

  /**
 * Determina si la coordinación seleccionada puede ejecutar acciones de edición.
 * Este valor viene calculado desde backend según convocatoria, restricción y fechas.
 */
  readonly canEditPreassignment = computed(
    () => this.coordination().canEditPreassignment === true,
  );

  /**
 * Mensaje que explica por qué la coordinación se encuentra en modo solo lectura.
 * Se utiliza en tooltips y botones deshabilitados.
 */

  readonly editBlockReason = computed(
    () =>
      this.coordination().editBlockReason ??
      'La coordinación no está habilitada para edición en esta convocatoria.',
  );

  readonly canShowPreloadCallButton = computed(() => !this.hasLoadedProfessors());
  readonly canChangePreloadCall = computed(
    () => this.canShowPreloadCallButton() && this.canEditPreassignment(),
  );

  readonly canDownloadReport = computed(
    () => this.coordination().idCarga != null && !this.isDownloadingReport(),
  );
  readonly allViewedObservations = computed(() => this.searchObservations().every(observation => observation.visto));

  readonly canShowObservations = computed(() => (this.coordination().estadoCarga === 'REGISTRADO') && (this.permissions.canListObservations()) && (this.searchObservations().length > 0))
  readonly canShowEndorseButton = computed(() => (this.coordination().estadoCarga === 'REGISTRADO') && (!this.isEndorsingPreload()));
  readonly canShowApproveProfessorsButton = computed(() => (this.coordination().estadoCarga === 'REGISTRADO') && (!this.isApprovingProfessors()));
  readonly canShowDeanApprovalButtons = computed( () => this.coordination().estadoCarga === 'INSCRITO' && (this.permissions.canDeclineLoadDean() || this.permissions.canApproveLoadDean()));
  readonly canShowDevelopmentApprovalButtons = computed(() => this.coordination().estadoCarga === 'APROBADO DECANO' && (this.permissions.canDeclineLoadDevelopment() || this.permissions.canApproveLoadDevelopment()));
  readonly canShowActivitiesGraph = computed(() =>
    this.permissions.canViewActivitiesGraph(),
  );

  constructor() {
    effect(() => {
      this.coordination().id;
      this.hasLoadedProfessors.set(false);
      this.totalRefreshKey.set(0);
      this.professorRefreshKey.set(0);

      this.triggerLoadObservations(this.coordination().idCarga);
    });
  }
  

  openAssignModal(): void {
    if (!this.canChangePreloadCall()) {
      return;
    }

    this.isAssignModalOpen.set(true);
  }

  openDeclineModal(): void {
    this.isDeclineModalOpen.set(true);
  }

  openObservationModal(): void {
    if (!this.canShowObservations()) {
      return;
    }

    this.markObservationsAsSeen(this.coordination().idCarga);
    this.isObservationModalOpen.set(true);
  }

  closeAssignModal(): void {
    this.isAssignModalOpen.set(false);
  }

  closeDeclineModal(): void {
    this.isDeclineModalOpen.set(false);
  }

  closeObservationModal(): void {
    this.isObservationModalOpen.set(false);
  }

  onPreloadCallAssigned(updated: CoordinationItem): void {
    this.coordinationUpdated.emit(updated);
    this.closeAssignModal();
  }

  onHasProfessorsChange(hasProfessors: boolean): void {
    this.hasLoadedProfessors.set(hasProfessors);
  }

  onAnyProfessorsVerified(verified: boolean): void {
    this.anyProfessorsPreloadVerified.set(verified);
  }

  onAllProfessorsApproved(approved: boolean): void {
    this.allProfessorsPreloadApproved.set(approved);
  }

  onPreloadChanged(): void {
    this.totalRefreshKey.update((value) => value + 1);
  }

  onProfessorsRefresh(): void {
    this.professorRefreshKey.update((value) => value + 1);
  }

  downloadPreloadReport(): void {
    if (!this.permissions.canDownloadPreloadExcel()) {
      return;
    }

    const idCarga = this.coordination().idCarga;
    if (idCarga == null || this.isDownloadingReport()) {
      return;
    }

    this.isDownloadingReport.set(true);
    this.coordinationService
      .downloadPreloadReport(idCarga)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isDownloadingReport.set(false)),
      )
    .subscribe(({ blob, fileName }) => {
        this.triggerBrowserDownload(blob, fileName);
      });
  }

  approveProfessors() {
    if (!this.permissions.canApprove()) return;

    const idCarga = this.coordination().idCarga;
    if ((idCarga == null) || this.isApprovingProfessors()) return;

    this.isApprovingProfessors.set(true);
    this.coordinationService
      .approveProfessorsPreassignment(idCarga)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isApprovingProfessors.set(false)),
      )
    .subscribe({
      next: () => {
        this.onProfessorsRefresh();
      }
    });
  }


  endorsePreloadDean() {
    if (!this.permissions.canEndorseLoadDean()) return;

    const idCarga = this.coordination().idCarga;
    if ((idCarga == null) || this.isEndorsingPreload()) return;

    this.isEndorsingPreload.set(true);
    this.coordinationService
      .endorsePreloadDean(idCarga)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isEndorsingPreload.set(false)),
      )
    .subscribe({
      next: () => {
        // Redirigir al listado
        this.back.emit();
      }
    });
  }

  onDeclinePreloadDean(observacion: string) {
    if (!this.permissions.canDeclineLoadDean()) return;

    const currentUser = this.authService.currentUser();
    if (!currentUser || currentUser.idPersona === null) return;

    const idCarga = this.coordination().idCarga;
    if ((idCarga == null) || this.isDecliningPreload()) return;

    const body: DeclinePreloadDeanRequest = {
      idPersonaGeneral: Number(currentUser.idPersona),
      observacion: observacion
    }

    this.isDecliningPreload.set(true);

    this.coordinationService
      .declinePreloadDean(idCarga, body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isDecliningPreload.set(false)),
      )
    .subscribe({
      next: () => {
        // Redirigir al listado
        this.isDeclineModalOpen.set(false);
        this.back.emit();
      }
    });
  }

  approvePreloadDean(): void {
    if (!this.permissions.canApproveLoadDean()) {
      return;
    }

    const idCarga = this.coordination().idCarga;

    if (
      idCarga == null ||
      this.isApprovingPreloadDean()
    ) {
      return;
    }

    this.isApprovingPreloadDean.set(true);

    this.coordinationService
      .approvePreloadDean(idCarga)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() =>
          this.isApprovingPreloadDean.set(false),
        ),
      )
      .subscribe({
        next: () => {
          this.back.emit();
        },
      });
  }

  onDeclinePreloadDevelopment(observacion: string): void {
    if (!this.permissions.canDeclineLoadDevelopment()) {
      return;
    }

    const currentUser = this.authService.currentUser();

    if (!currentUser || currentUser.idPersona === null) {
      return;
    }

    const idCarga = this.coordination().idCarga;

    if (
      idCarga == null ||
      this.isDecliningPreload()
    ) {
      return;
    }

    const body: DeclinePreloadDeanRequest = {
      idPersonaGeneral: Number(currentUser.idPersona),
      observacion,
    };

    this.isDecliningPreload.set(true);

    this.coordinationService
      .declinePreloadDevelopment(idCarga, body)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() =>
          this.isDecliningPreload.set(false),
        ),
      )
      .subscribe({
        next: () => {
          this.isDeclineModalOpen.set(false);
          this.back.emit();
        },
      });
  }

  approvePreloadDevelopment(): void {
    if (!this.permissions.canApproveLoadDevelopment()) {
      return;
    }

    const idCarga = this.coordination().idCarga;

    if (
      idCarga == null ||
      this.isApprovingPreloadDevelopment()
    ) {
      return;
    }

    this.isApprovingPreloadDevelopment.set(true);

    this.coordinationService
      .approvePreloadDevelopment(idCarga)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() =>
          this.isApprovingPreloadDevelopment.set(false),
        ),
      )
      .subscribe({
        next: () => {
          this.back.emit();
        },
      });
  }



  private triggerBrowserDownload(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  private triggerLoadObservations(idCarga: number|null): void {
    if (!this.permissions.canListObservations()) return;

    if ((idCarga == null)) return;

    this.isSearchingObservations.set(true);

    this.coordinationService
      .listPreloadObservations(idCarga)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSearchingObservations.set(false)),
      )
    .subscribe({
      next: (observations) => {
        this.searchObservations.set(observations);
      },
      error: () => {
        this.searchObservations.set([]);
      }
    });
  }

  private markObservationsAsSeen(idCarga: number|null): void {
    if (!this.permissions.canListObservations()) return;

    if (this.allViewedObservations()) return;

    if ((idCarga == null)) return;

    this.coordinationService
      .markSeenObservations(idCarga)
      .pipe(
        takeUntilDestroyed(this.destroyRef)
      )
    .subscribe({
      next: () => {
        this.searchObservations.update(observations => observations.map(
          observation => ({
            ...observation,
            visto: true
          })
        ));
      }
    });
  }
}