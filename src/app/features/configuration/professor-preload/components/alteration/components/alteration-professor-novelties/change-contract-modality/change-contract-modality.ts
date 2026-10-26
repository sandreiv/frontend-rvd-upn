import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { Label } from '../../../../../../../../shared/components/form/label/label';
import { Select } from '../../../../../../../../shared/components/form/select/select';
import { CoordinationService } from '../../../../../data/coordination.service';
import {
  ContractModalityItem,
  CoordinationItem,
  ModalityProfessor,
} from '../../../../../model/coordination.model';
import { SaveNovedadCargaDocenteRequest } from '../../../../../model/novelty-carga-docente.model';
import { buildSaveNovedadCargaDocenteRequest } from '../../../../../model/novelty-carga-docente.mapper';
import { NoveltyComponentState } from '../novelty-component-state';
import { NoveltyBudgetStore } from '../novelty-budget.store';
import { ChangeContractModalityForm } from './change-contract-modality-form/change-contract-modality-form';
import { ChangeContractModalityActivities } from './change-contract-modality-activities/change-contract-modality-activities';
import { buildSaveActivityDistributionRequest } from '../../../../../model/professor-activities-save.mapper';
import {
  computeProfessorContractTotal,
  isCatedraFormaPago,
  sumDetalleHours,
} from '../../../../../model/professor-contract-value';

@Component({
  selector: 'app-change-contract-modality',
  imports: [
    Label,
    Select,
    ReactiveFormsModule,
    ChangeContractModalityForm,
    ChangeContractModalityActivities,
  ],
  templateUrl: './change-contract-modality.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeContractModality {
  private readonly coordinationService = inject(CoordinationService);
  private readonly noveltyState = inject(NoveltyComponentState);
  private readonly budgetStore = inject(NoveltyBudgetStore);
  private readonly assignmentForm = viewChild(ChangeContractModalityForm);
  private readonly activitiesPanel = viewChild(
    ChangeContractModalityActivities,
  );

  readonly professor = input<ModalityProfessor | null>(null);
  readonly coordination = input<CoordinationItem | null>(null);
  readonly noveltyId = input<number | null>(null);

  readonly idModalidadControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly selectedModalityId = toSignal(
    this.idModalidadControl.valueChanges,
    { initialValue: this.idModalidadControl.value },
  );

  readonly modalitiesResource = rxResource({
    stream: () => this.coordinationService.getContractModalities(),
    defaultValue: [] as ContractModalityItem[],
  });

  readonly modalityOptions = computed(() => {
    return this.modalitiesResource.value().map((item) => ({
      value: String(item.id),
      label: item.nombre,
    }));
  });

  readonly selectedModality = computed(() => {
    const selectedId = this.selectedModalityId();
    return (
      this.modalitiesResource.value().find((item) => {
        return String(item.id) === selectedId;
      }) ?? null
    );
  });

  constructor() {
    effect(() => this.syncNoveltyState());
  }

  private syncNoveltyState(): void {
    this.trackDraftSources();
    const request = this.buildPayload();
    untracked(() => {
      this.writeNoveltyState(request);
      this.writeBudgetDraft();
    });
  }

  private trackDraftSources(): void {
    this.selectedModality();
    this.professor();
    this.noveltyId();
    this.coordination();
    const form = this.assignmentForm();
    form?.selectedWorkDate();
    form?.selectedCategoriaId();
    form?.manualNumeroPuntos();
    form?.contractValues();
    form?.asignacionSalarialNum();
    form?.valorHoraNum();
    form?.formaPago();
    form?.restrictionReady();
    this.budgetStore.budget();
    const activities = this.activitiesPanel();
    activities?.isLoading();
    activities?.directByCodigo();
    activities?.criteriaByCodigo();
    activities?.projectsByCodigo();
  }

  private writeNoveltyState(
    request: SaveNovedadCargaDocenteRequest | null,
  ): void {
    if (request != null) {
      this.noveltyState.setChangeContractModality(request);
      return;
    }
    const current = this.noveltyState.payload();
    if (current?.component === 'change-contract-modality') {
      this.noveltyState.clear();
    }
  }

  private buildPayload(): SaveNovedadCargaDocenteRequest | null {
    const professor = this.professor();
    const noveltyId = this.noveltyId();
    const assignment = this.assignmentForm()?.assignmentSnapshot();
    const activities = this.activitiesPanel()?.activitySnapshot();
    if (
      professor == null ||
      noveltyId == null ||
      assignment == null ||
      activities == null
    ) {
      return null;
    }

    return buildSaveNovedadCargaDocenteRequest({
      professor,
      noveltyId,
      assignment,
      activities,
    });
  }

  private writeBudgetDraft(): void {
    const professor = this.professor();
    const form = this.assignmentForm();
    const idCargaDocente = professor?.idCargaDocente;
    if (idCargaDocente == null || form == null) {
      this.budgetStore.clearDraft();
      return;
    }
    if (!form.restrictionReady()) {
      return;
    }

    const formaPago = form.formaPago();
    const isCatedra = isCatedraFormaPago(formaPago);
    const activities = this.activitiesPanel()?.activitySnapshot();
    if (isCatedra && activities == null) {
      return;
    }

    const hours = this.resolveDraftHours(isCatedra, activities ?? null);
    const workDate = form.selectedWorkDate();
    const totalNuevo = computeProfessorContractTotal({
      formaPago,
      fechaInicio: workDate?.fechaInicio,
      fechaFin: workDate?.fechaFin,
      asignacionSalarial: form.asignacionSalarialNum(),
      valorHora: form.valorHoraNum(),
      semanas: workDate?.semanas,
      horasActividades: hours,
    });

    this.budgetStore.setDraft({
      idCargaDocente,
      totalAnterior: this.budgetStore.totalAnteriorOf(idCargaDocente),
      totalNuevo,
    });
  }

  private resolveDraftHours(
    isCatedra: boolean,
    activities: ReturnType<
      ChangeContractModalityActivities['activitySnapshot']
    >,
  ): number {
    if (!isCatedra || activities == null) {
      return 0;
    }
    return sumDetalleHours(
      buildSaveActivityDistributionRequest(activities).detalles,
    );
  }
}
