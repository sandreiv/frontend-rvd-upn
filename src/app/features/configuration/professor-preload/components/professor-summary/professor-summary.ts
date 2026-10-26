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
import { catchError, Observable, of } from 'rxjs';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { CollapsibleSection } from '../../../../../shared/components/form/collapsible-section/collapsible-section';
import { CoordinationService } from '../../data/coordination.service';
import {
  CAREER_PROFESSOR_TAB_LABEL,
  CoordinationContractModality,
  CoordinationItem,
  ModalityProfessor,
} from '../../model/coordination.model';
import {
  createInitialExpandedSections,
  EMPTY_PROFESSOR_LOAD_SUMMARY,
  mapActivitySummaryTables,
  mapContractValueRows,
  mapCostCenterRows,
  PROFESSOR_SUMMARY_SECTIONS,
  ProfessorLoadSummaryApi,
  ProfessorSummarySectionId,
} from '../../model/professor-summary.model';

const NN_LABEL = 'NN';

@Component({
  selector: 'app-professor-summary',
  imports: [Modal, Button, Icon, CollapsibleSection],
  templateUrl: './professor-summary.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorSummary {
  private readonly coordinationService = inject(CoordinationService);

  isOpen = input(false);
  professor = input<ModalityProfessor | null>(null);
  coordination = input<CoordinationItem | null>(null);
  contractModality = input<CoordinationContractModality | null>(null);
  isCareerProfessor = input(false);
  summaryFetcher = input<
    ((idCargaDocente: number) => Observable<ProfessorLoadSummaryApi>) | null
  >(null);
  close = output<void>();

  verificationMode = input(false);
  isProcessing = input(false);

  canVerify = input(false);
  canDecline = input(false);

  verify = output<string>();
  decline = output<string>();

  readonly observation = signal('');

  readonly showVerificationActions = computed(
    () =>
      this.verificationMode() &&
      this.professor()?.estado === '1',
  );

  readonly reviewActionsDisabled = computed(
    () =>
      !this.isOpen() ||
      !this.showVerificationActions() ||
      this.isLoading() ||
      this.isProcessing() ||
      this.professor()?.idCargaDocente == null ||
      this.observation().trim().length > 500,
  );

  readonly sections = PROFESSOR_SUMMARY_SECTIONS;

  readonly visibleSections = computed(() =>
    this.sections.filter(
      (section) =>
        !(this.isCareerProfessor() && section.id === 'valores-contratacion'),
    ),
  );

  readonly expandedSections = signal(createInitialExpandedSections());

  readonly summaryResource = rxResource({
    params: () => {
      if (!this.isOpen()) {
        return undefined;
      }

      const idCargaDocente = this.professor()?.idCargaDocente;
      if (idCargaDocente == null) {
        return undefined;
      }

      return { idCargaDocente };
    },
    stream: ({ params }) => {
      const fetcher = this.summaryFetcher();
      const request$ = fetcher
        ? fetcher(params.idCargaDocente)
        : this.coordinationService.getProfessorLoadSummary(
            params.idCargaDocente,
          );

      return request$.pipe(
        catchError(() => of(EMPTY_PROFESSOR_LOAD_SUMMARY)),
      );
    },
    defaultValue: EMPTY_PROFESSOR_LOAD_SUMMARY,
  });

  readonly summary = computed(
    () => this.summaryResource.value() ?? EMPTY_PROFESSOR_LOAD_SUMMARY,
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
    mapContractValueRows(this.summary().valorContratacion),
  );

  readonly activityTables = computed(() =>
    mapActivitySummaryTables(this.summary().horasActividades),
  );

  readonly costCenterRows = computed(() =>
    mapCostCenterRows(this.summary().centrosCosto),
  );

  readonly observations = computed(() => this.summary().observaciones ?? []);

  constructor() {
    effect(() => {
      const isOpen = this.isOpen();
      const idCargaDocente = this.professor()?.idCargaDocente;

      if (!isOpen || idCargaDocente == null) {
        return;
      }

      untracked(() => {
        this.expandedSections.set(createInitialExpandedSections());
        this.observation.set('');
      });
    });
  }

  isSectionExpanded(sectionId: ProfessorSummarySectionId): boolean {
    return this.expandedSections()[sectionId];
  }

  onSectionExpandedChange(
    sectionId: ProfessorSummarySectionId,
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
    if (this.isProcessing()) {
      return;
    }

    this.close.emit();
  }

  onObservationInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.observation.set(textarea.value);
  }

  onVerify(): void {
    if (this.reviewActionsDisabled() || !this.canVerify()) {
      return;
    }

    this.verify.emit(this.observation().trim());
  }

  onDecline(): void {
    if (this.reviewActionsDisabled() || !this.canDecline()) {
      return;
    }

    this.decline.emit(this.observation().trim());
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



}
