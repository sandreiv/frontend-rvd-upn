import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, catchError, of } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Modal } from '../../../../../../../shared/ui/modal/modal';
import { Icon } from '../../../../../../../shared/ui/icon/icon';
import { CollapsibleSection } from '../../../../../../../shared/components/form/collapsible-section/collapsible-section';
import { Button } from '../../../../../../../shared/ui/button/button';
import { CoordinationService } from '../../../../data/coordination.service';
import {
  CAREER_PROFESSOR_TAB_LABEL,
  CoordinationContractModality,
  CoordinationItem,
  ModalityProfessor,
  RejectProfessorNoveltyRequest,
} from '../../../../model/coordination.model';
import {
  mapActivitySummaryTables,
  mapCostCenterRows,
} from '../../../../model/professor-summary.model';
import {
  createInitialNoveltyExpandedSections,
  EMPTY_PROFESSOR_NOVELTY_SUMMARY,
  mapNoveltyContractValueRows,
  mapNoveltyHistoryRows,
  NOVELTY_SUMMARY_SECTIONS,
  NoveltySummarySectionId,
} from '../../../../model/novelty-summary.model';
import { isProfessorNoveltyPendingReview } from '../../../../model/professor-novelty-state';
import { PermissionService } from '../../../../../../../core/service/permission-service';
import { AuthService } from '../../../../../../../core/service/auth-service';
import { NotificationService } from '../../../../../../../core/service/notification-service';

const NN_LABEL = 'NN';

@Component({
  selector: 'app-novelty-summary',
  imports: [Modal, Icon, CollapsibleSection, Button, ReactiveFormsModule],
  templateUrl: './novelty-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoveltySummary {
  private readonly coordinationService = inject(CoordinationService);
  private readonly permissions = inject(PermissionService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly fb = inject(FormBuilder);

  isOpen = input(false);
  professor = input<ModalityProfessor | null>(null);
  coordination = input<CoordinationItem | null>(null);
  contractModality = input<CoordinationContractModality | null>(null);
  isCareerProfessor = input(false);
  close = output<void>();
  reviewChanged = output<void>();

  readonly isSavingReview = signal(false);
  readonly savingAction = signal<'approve' | 'reject' | null>(null);

  readonly observationForm = this.fb.group({
    observacion: [''],
  });

  readonly observationError = signal(false);

  readonly showObservationError = computed(
    () => this.canRejectNovelty() && this.observationError(),
  );

  readonly sections = NOVELTY_SUMMARY_SECTIONS;

  readonly visibleSections = computed(() =>
    this.sections.filter(
      (section) =>
        !(
          this.isCareerProfessor() &&
          section.id === 'valores-contratacion'
        ),
    ),
  );

  readonly expandedSections = signal(
    createInitialNoveltyExpandedSections(),
  );

  readonly summaryResource = rxResource({
    params: () => this.resolveSummaryParams(),
    stream: ({ params }) =>
      this.coordinationService
        .getProfessorNoveltySummary(params.idCargaDocente)
        .pipe(catchError(() => of(EMPTY_PROFESSOR_NOVELTY_SUMMARY))),
    defaultValue: EMPTY_PROFESSOR_NOVELTY_SUMMARY,
  });

  readonly summary = computed(
    () => this.summaryResource.value() ?? EMPTY_PROFESSOR_NOVELTY_SUMMARY,
  );

  readonly isLoading = computed(() => this.summaryResource.isLoading());

  readonly professorDisplayName = computed(() => {
    const professor = this.professor();
    if (!professor || professor.idPersonaGeneral == null) {
      return NN_LABEL;
    }
    return professor.nombreCompleto?.trim() || NN_LABEL;
  });

  readonly modalityLabel = computed(() => {
    if (this.isCareerProfessor()) {
      return CAREER_PROFESSOR_TAB_LABEL;
    }
    return this.contractModality()?.nombre ?? '-';
  });

  readonly coordinationLabel = computed(() => {
    const coordination = this.coordination();
    if (!coordination) {
      return '-';
    }
    return coordination.descripcion || coordination.nombre || '-';
  });

  readonly contractValueRows = computed(() =>
    mapNoveltyContractValueRows(this.summary().valorContratacion),
  );

  readonly activityTables = computed(() =>
    mapActivitySummaryTables(this.summary().horasActividades),
  );

  readonly costCenterRows = computed(() =>
    mapCostCenterRows(this.summary().centrosCosto),
  );

  readonly observations = computed(() => this.summary().observaciones ?? []);

  readonly noveltyRows = computed(() =>
    mapNoveltyHistoryRows(this.summary().novedades),
  );

  readonly isCargaEnAvalDesarrollo = computed(
    () => this.coordination()?.estadoCarga === 'AVAL DESARROLLO',
  );

  readonly canReviewNovelty = computed(() => {
    const professor = this.professor();

    if (
      professor == null ||
      professor.idCargaDocente == null ||
      !this.isCargaEnAvalDesarrollo() ||
      professor.tieneCarga !== true
    ) {
      return false;
    }

    return isProfessorNoveltyPendingReview(professor.estadoNovedad);
  });

  readonly canApproveNovelty = computed(
    () =>
      this.canReviewNovelty() &&
      this.permissions.canApproveProfessorNovelty(),
  );

  readonly canRejectNovelty = computed(
    () =>
      this.canReviewNovelty() &&
      this.permissions.canRejectProfessorNovelty(),
  );

  readonly canSubmitReview = computed(
    () => this.canApproveNovelty() || this.canRejectNovelty(),
  );

  constructor() {
    effect(() => {
      const isOpen = this.isOpen();
      const idCargaDocente = this.professor()?.idCargaDocente;

      if (!isOpen || idCargaDocente == null) {
        return;
      }

      untracked(() => {
        this.expandedSections.set(createInitialNoveltyExpandedSections());
        this.resetObservation();
      });
    });
  }

  isSectionExpanded(sectionId: NoveltySummarySectionId): boolean {
    return this.expandedSections()[sectionId];
  }

  onSectionExpandedChange(
    sectionId: NoveltySummarySectionId,
    expanded: boolean,
  ): void {
    this.expandedSections.update((current) => ({
      ...current,
      [sectionId]: expanded,
    }));
  }

  hoursLabel(hours: number): string {
    return `${hours ?? 0}h`;
  }

  onClose(): void {
    if (this.isSavingReview()) {
      return;
    }

    this.resetObservation();
    this.close.emit();
  }

  async onApprove(): Promise<void> {
    const idCargaDocente = this.professor()?.idCargaDocente;

    if (
      idCargaDocente == null ||
      this.isSavingReview() ||
      !this.canApproveNovelty()
    ) {
      return;
    }

    this.savingAction.set('approve');
    this.isSavingReview.set(true);
    try {
      await firstValueFrom(
        this.coordinationService.approveProfessorNovelty(idCargaDocente),
      );
      this.notificationService.success(
        'La novedad fue aprobada correctamente.',
        'Novedad aprobada',
      );
      this.finishReview();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSavingReview.set(false);
      this.savingAction.set(null);
    }
  }

  async onReject(): Promise<void> {
    const idCargaDocente = this.professor()?.idCargaDocente;

    if (
      idCargaDocente == null ||
      this.isSavingReview() ||
      !this.canRejectNovelty()
    ) {
      return;
    }

    if (this.observationForm.invalid) {
      this.observationForm.markAllAsTouched();
      return;
    }

    const observacion = this.observationForm.controls.observacion.value?.trim();
    if (!observacion) {
      this.observationError.set(true);
      return;
    }

    const currentUser = this.authService.currentUser();
    if (!currentUser || currentUser.idPersona === null) {
      return;
    }

    const request: RejectProfessorNoveltyRequest = {
      idPersonaGeneral: Number(currentUser.idPersona),
      observacion,
    };

    this.savingAction.set('reject');
    this.isSavingReview.set(true);
    try {
      await firstValueFrom(
        this.coordinationService.rejectProfessorNovelty(
          idCargaDocente,
          request,
        ),
      );
      this.notificationService.success(
        'La novedad fue rechazada correctamente.',
        'Novedad rechazada',
      );
      this.finishReview();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSavingReview.set(false);
      this.savingAction.set(null);
    }
  }

  observationDateLabel(value: string | null | undefined): string {
    if (!value) {
      return '-';
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
    if (!match) {
      return value;
    }

    const [, year, month, day, hour, minute] = match;
    return `${day}/${month}/${year} ${hour}:${minute}`;
  }

  private finishReview(): void {
    this.resetObservation();
    this.reviewChanged.emit();
    this.close.emit();
  }

  private resetObservation(): void {
    this.observationForm.reset({ observacion: '' });
    this.observationError.set(false);
  }

  private resolveSummaryParams(): { idCargaDocente: number } | undefined {
    if (!this.isOpen()) {
      return undefined;
    }

    const idCargaDocente = this.professor()?.idCargaDocente;
    if (idCargaDocente == null) {
      return undefined;
    }

    return { idCargaDocente };
  }
}
