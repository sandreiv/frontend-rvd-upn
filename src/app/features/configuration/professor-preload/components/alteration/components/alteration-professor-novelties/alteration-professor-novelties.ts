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
  viewChild,
  untracked,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import {
  rxResource,
  takeUntilDestroyed,
  toSignal,
} from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  CoordinationContractModality,
  CoordinationItem,
  ModalityProfessor,
} from '../../../../model/coordination.model';
import {
  isNoveltyComponentKey,
  NoveltyComponentKey,
  NoveltiesItem,
} from '../../../../model/novelties.model';
import { CoordinationService } from '../../../../data/coordination.service';
import {
  SaveNovedadCargaDocenteRequest,
  SaveNoveltyProjectActivitiesRequest,
} from '../../../../model/novelty-carga-docente.model';
import { NotificationService } from '../../../../../../../core/service/notification-service';
import { PermissionService } from '../../../../../../../core/service/permission-service';
import { forNext } from '../../../../../../../core/utils/for-next.function';
import {
  hasNoveltySavePermission,
} from '../../../../model/novelty-save-permission.map';
import { Modal } from '../../../../../../../shared/ui/modal/modal';
import { Icon } from '../../../../../../../shared/ui/icon/icon';
import { Label } from '../../../../../../../shared/components/form/label/label';
import { Select } from '../../../../../../../shared/components/form/select/select';
import { NOVELTY_COMPONENTS } from './novelty-components';
import {
  NoveltyComponentPayload,
  NoveltyComponentState,
} from './novelty-component-state';
import { isProfessorNoveltyPendingReview } from '../../../../model/professor-novelty-state';
import { NoveltyBudgetStore } from './novelty-budget.store';
import { Button } from '../../../../../../../shared/ui/button/button';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-alteration-professor-novelties',
  imports: [
    Modal,
    Icon,
    Label,
    Select,
    ReactiveFormsModule,
    NgComponentOutlet,
    Button
],
  providers: [NoveltyComponentState],
  templateUrl: './alteration-professor-novelties.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlterationProfessorNovelties {
  private readonly coordinationService = inject(CoordinationService);
  private readonly notificationService = inject(NotificationService);
  private readonly permissions = inject(PermissionService);
  readonly noveltyState = inject(NoveltyComponentState);
  readonly budgetStore = inject(NoveltyBudgetStore);

  readonly isOpen = input(false);
  readonly professor = input<ModalityProfessor | null>(null);
  readonly contractModality = input<CoordinationContractModality | null>(null);
  readonly coordination = input<CoordinationItem | null>(null);
  readonly close = output<void>();
  readonly saved = output<void>();

  readonly saving = signal(false);

  readonly hasNoveltyInReview = computed(() =>
    isProfessorNoveltyPendingReview(
      this.professor()?.estadoNovedad,
    ),
  );

  readonly idNovedadControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  readonly selectedNoveltyId = toSignal(
    this.idNovedadControl.valueChanges,
    { initialValue: this.idNovedadControl.value },
  );

  readonly noveltiesResource = rxResource({
    params: () => {
      if (!this.isOpen()) {
        return undefined;
      }
      return {
        modalityId: this.contractModality()?.id ?? null,
      };
    },
    stream: ({ params }) =>
      this.coordinationService.getNoveltiesTypes(params.modalityId),
    defaultValue: [] as NoveltiesItem[],
  });

  readonly noveltyOptions = computed(() => {
    const options: { value: string; label: string }[] = [];
    forNext(this.noveltiesResource.value(), (novelty) => {
      if (!this.canSelectNovelty(novelty)) {
        return;
      }
      options.push({
        value: String(novelty.id),
        label: novelty.tipo,
      });
    });
    return options;
  });

  readonly selectedNoveltyKey = computed(() => {
    const selectedId = this.selectedNoveltyId();
    const novelty = this.noveltiesResource.value().find((item) => {
      return String(item.id) === selectedId;
    });
    const key = novelty?.componente;
    return isNoveltyComponentKey(key) ? key : null;
  });

  readonly selectedNoveltyComponent = computed(() => {
    const key = this.selectedNoveltyKey();
    return key == null ? null : NOVELTY_COMPONENTS[key];
  });

  readonly noveltyInputs = computed(() => ({
    professor: this.professor(),
    coordination: this.coordination(),
    contractModality: this.contractModality(),
    noveltyId: this.parseNoveltyId(this.selectedNoveltyId()),
  }));

  readonly canSaveSelectedNovelty = computed(() => {
    return this.canSaveNoveltyKey(this.selectedNoveltyKey());
  });

  constructor() {
    effect(() => {
      this.selectedNoveltyId();
      untracked(() => {
        this.noveltyState.clear();
        this.budgetStore.clearDraft();
      });
    });
  }

  async onSave(): Promise<void> {
    if (
      this.saving() ||
      this.idNovedadControl.invalid ||
      this.budgetStore.excede() ||
      !this.canSaveSelectedNovelty()
    ) {
      return;
    }

    const professor = this.professor();
    const payload = this.noveltyState.payload();
    const idNovedad = Number(this.selectedNoveltyId());
    if (
      professor?.idCargaDocente == null ||
      payload == null ||
      !Number.isFinite(idNovedad)
    ) {
      return;
    }

    this.saving.set(true);
    try {
      const saved = await this.persistNovelty(
        idNovedad,
        professor.idCargaDocente,
      );
      if (!saved) {
        return;
      }
      await this.refreshBudget();
      this.notificationService.success(
        'La novedad fue registrada correctamente.',
        'Novedad registrada',
      );
      this.saved.emit();
      this.saving.set(false);
      this.resetModal();
    } finally {
      this.saving.set(false);
    }
  }

  onClose(): void {
    if (this.saving()) {
      return;
    }
    this.resetModal();
  }

  private resetModal(): void {
    this.idNovedadControl.reset('');
    this.noveltyState.clear();
    this.budgetStore.clearDraft();
    this.close.emit();
  }

  private persistNovelty(
    idNovedad: number,
    idCargaDocente: number,
  ): Promise<boolean> {
    const payload = this.noveltyState.payload();
    if (!this.canSaveNoveltyKey(payload?.component ?? null)) {
      return Promise.resolve(false);
    }
    return this.dispatchNoveltySave(
      payload,
      idNovedad,
      idCargaDocente,
    );
  }

  private dispatchNoveltySave(
    payload: NoveltyComponentPayload | null,
    idNovedad: number,
    idCargaDocente: number,
  ): Promise<boolean> {
    if (payload?.component === 'asign-name-nn') {
      return this.saveAssignNameNn(
        idNovedad,
        idCargaDocente,
        payload.idPersonaGeneral,
        payload.idEscalafon,
      );
    }

    if (payload?.component === 'update-contract-value') {
      return this.updateContractValue(
        idNovedad,
        idCargaDocente,
      );
    }

    if (payload?.component === 'change-professor') {
      return this.saveChangeProfessor(
        idNovedad,
        idCargaDocente,
        payload.idPersonaGeneral,
        payload.idEscalafon,
      );
    }
    if (payload?.component === 'change-contract-modality') {
      return this.saveChangeContractModality({
        ...payload.request,
        idNovedad,
        idCargaDocente,
      });
    }
    if (
      payload?.component === 'change-project-activities' ||
      payload?.component === 'change-direct-activities'
    ) {
      return this.saveNoveltyActivityDetails({
        detallesNuevos: payload.saveRequest.detalles,
        detallesActualizados: payload.updateRequests,
        detallesEliminados: payload.deleteIds,
        idNovedad,
        idCargaDocente,
      });
    }
    return Promise.resolve(false);
  }

  private async saveAssignNameNn(
    idNovedad: number,
    idCargaDocente: number,
    idPersonaGeneral: number,
    idEscalafon: number,
  ): Promise<boolean> {

    await firstValueFrom(
      this.coordinationService.assignNameToNn({
        idCargaDocente,
        idNovedad,
        idPersonaGeneral,
        idEscalafon,
      }),
    );

    return true;
  }

  private async updateContractValue(
    idNovedad: number,
    idCargaDocente: number,
  ): Promise<boolean> {
    await firstValueFrom(
      this.coordinationService.updateContractValue({
        idCargaDocente,
        idNovedad,
      }),
    );
    return true;
  }

  private async saveChangeProfessor(
    idNovedad: number,
    idCargaDocente: number,
    idPersonaGeneral: number,
    idEscalafon: number,
  ): Promise<boolean> {

    await firstValueFrom(
      this.coordinationService.changeProfessor({
        idCargaDocente,
        idNovedad,
        idPersonaGeneral,
        idEscalafon,
      }),
    );

    return true;
  }

  private async saveChangeContractModality(
    request: SaveNovedadCargaDocenteRequest,
  ): Promise<boolean> {
    if (!this.permissions.canSaveContractModalityProfessor()) {
      return false;
    }

    await firstValueFrom(
      this.coordinationService.saveContractModalityProfessor(request),
    );
    return true;
  }

  private async saveNoveltyActivityDetails(
    request: SaveNoveltyProjectActivitiesRequest,
  ): Promise<boolean> {
    const { detallesNuevos, detallesActualizados, detallesEliminados } = request;
    if (detallesNuevos.length === 0 && detallesActualizados.length === 0 && detallesEliminados.length === 0) {
      this.notificationService.warning(
        'Agrega, modifica o elimina al menos una actividad para guardar.',
        'Sin actividades',
      );
      return false;
    }

    await firstValueFrom(
      this.coordinationService.saveNoveltyProjectActivities(request),
    );
    return true;
  }

  private canSelectNovelty(novelty: NoveltiesItem): boolean {
    const key = novelty.componente;
    if (!isNoveltyComponentKey(key)) {
      return true;
    }
    return this.canSaveNoveltyKey(key);
  }

  private canSaveNoveltyKey(
    key: NoveltyComponentKey | null,
  ): boolean {
    return hasNoveltySavePermission(
      (codigo) => this.permissions.can(codigo),
      key,
    );
  }

  private parseNoveltyId(value: string): number | null {
    const id = Number(value);
    return Number.isFinite(id) && id > 0 ? id : null;
  }

  private async refreshBudget(): Promise<void> {
    const idCarga = this.coordination()?.idCarga;
    this.budgetStore.clearDraft();
    if (idCarga == null) {
      return;
    }
    const budget = await firstValueFrom(
      this.coordinationService.getCargaBudget(idCarga),
    );
    this.budgetStore.setBudget(budget);
  }
}
