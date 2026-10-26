import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, Observable } from 'rxjs';
import { BreadcrumbTitle } from '../../../../../core/service/breadcrumb-title';
import { NewModal } from '../../../../../shared/ui/new-modal/new-modal';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { PreloadCallForm } from '../../components/preload-call-form/preload-call-form';
import { PreloadCallTable } from '../../components/preload-call-table/preload-call-table';
import { LinkPreloadCallModal, type PreloadCallLinkKind } from '../../components/link-preload-call-modal/link-preload-call-modal';
import { PreloadCallService } from '../../data/preload-call.service';
import {
  PreloadCallDetailResponse,
  PreloadCallItem,
  RestrictCoordinationItem,
  RestrictCoordinationSaveEvent,
  UniversityPeriodItem,
} from '../../model/preload-call.model';
import { buildPreloadCallDeletePayload } from '../../model/build-preload-call-delete-payload.function';
import {
  PreloadCallDeleteRequest,
  PreloadCallSaveRequest,
} from '../../model/preload-call-save.model';
import { RestrictCoordinationTable } from "../../components/restrict-coordination/restrict-coordination-table/restrict-coordination-table";
import { Option, Select } from "../../../../../shared/components/form/select/select";
import { Button } from "../../../../../shared/ui/button/button";

@Component({
  selector: 'app-preload-call',
  imports: [
    SectionFrame,
    PreloadCallTable,
    PreloadCallForm,
    NewModal,
    RestrictCoordinationTable,
    Select,
    Button,
    LinkPreloadCallModal,
  ],
  templateUrl: './preload-call.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreloadCall implements OnInit, OnDestroy {
  private readonly preloadCallService = inject(PreloadCallService);
  private readonly breadcrumbTitleService = inject(BreadcrumbTitle);
  private readonly restrictCoordinationTable = viewChild(RestrictCoordinationTable);

  readonly showRestrictCoordination = signal(false);
  readonly preloadCallForRestriction = signal<PreloadCallItem | null>(null);
  readonly preloadCallDetailForRestriction =
    signal<PreloadCallDetailResponse | null>(null);
  readonly restrictCoordinations = signal<RestrictCoordinationItem[]>([]);

  readonly universityPeriods = signal<UniversityPeriodItem[]>([]);
  readonly selectedPeriodId = signal('');
  readonly appliedPeriodId = signal<number | null>(null);
  readonly isLoadingPeriods = signal(false);

  readonly preloadCallsResource = rxResource({
    params: () => {
      const idPeriodoUniversidad = this.appliedPeriodId();
      if (idPeriodoUniversidad == null) {
        return undefined;
      }
      return { idPeriodoUniversidad };
    },
    stream: ({ params }) =>
      this.preloadCallService.getPreloadCallList(params.idPeriodoUniversidad),
    defaultValue: [] as PreloadCallItem[],
  });

  readonly preloadCalls = computed(() => this.preloadCallsResource.value());
  readonly isLoading = computed(() => this.preloadCallsResource.isLoading());

  readonly appliedPeriod = computed(() => {
    const id = this.appliedPeriodId();
    if (id == null) {
      return null;
    }
    return (
      this.universityPeriods().find((item) => item.id === id) ?? null
    );
  });

  readonly isSecondPeriodFilter = computed(() => {
    const period = this.appliedPeriod()?.periodo;
    if (period == null || period === '') {
      return false;
    }
    return Number(String(period).trim()) === 2;
  });

  readonly periodOptions = computed<Option[]>(() =>
    this.universityPeriods().map((item) => ({
      value: String(item.id),
      label: `${item.anio} - ${item.periodo}`,
    })),
  );

  readonly tableEmptyMessage = computed(() =>
    this.appliedPeriodId() != null
      ? 'No hay convocatorias de precarga para el periodo seleccionado.'
      : 'Seleccione un periodo y pulse Filtrar.',
  );

  readonly selectedPreloadCallIds = signal<string[]>([]);
  readonly selectedPreloadCall = signal<PreloadCallDetailResponse | null>(null);
  readonly showPreloadCallForm = signal(false);
  readonly isSaving = signal(false);
  readonly formMode = signal<'create' | 'edit' | 'read'>('create');

  readonly isDeleteModalOpen = signal(false);
  readonly deleteMode = signal<'single' | 'bulk'>('single');
  readonly preloadCallToDelete = signal<PreloadCallItem | null>(null);
  readonly idsToDelete = signal<string[]>([]);
  readonly isDeleting = signal(false);

  readonly isSavingRestriction = signal(false);
  readonly selectedRestrictCoordinationIds = signal<string[]>([]);

  readonly isRestrictionDeleteModalOpen = signal(false);
  readonly restrictionDeleteMode = signal<'single' | 'bulk'>('single');
  readonly restrictionToDelete = signal<RestrictCoordinationItem | null>(null);
  readonly restrictionIdsToDelete = signal<string[]>([]);
  readonly isDeletingRestriction = signal(false);

  readonly isLinkModalOpen = signal(false);
  readonly preloadCallToLink = signal<PreloadCallItem | null>(null);
  readonly isSavingLink = signal(false);
  readonly linkKind = signal<PreloadCallLinkKind>('period1');

  readonly firstPeriodCallsResource = rxResource({
    params: () => {
      if (!this.isLinkModalOpen() || this.linkKind() !== 'period1') {
        return undefined;
      }
      const year = this.appliedPeriod()?.anio;
      if (year == null) {
        return undefined;
      }
      return { year };
    },
    stream: ({ params }) =>
      this.preloadCallService.listPreloadCallByFirstPeriodByYear(params.year),
    defaultValue: [] as PreloadCallItem[],
  });

  readonly preassignmentCallsResource = rxResource({
    params: () => {
      if (!this.isLinkModalOpen() || this.linkKind() !== 'preassignment') {
        return undefined;
      }
      const idPeriodoUniversidad = this.appliedPeriodId();
      if (idPeriodoUniversidad == null) {
        return undefined;
      }
      return { idPeriodoUniversidad };
    },
    stream: ({ params }) =>
      this.preloadCallService.listPreassignmentCalls(
        params.idPeriodoUniversidad,
      ),
    defaultValue: [] as PreloadCallItem[],
  });

  readonly linkModalCalls = computed(() =>
    this.linkKind() === 'preassignment'
      ? this.preassignmentCallsResource.value()
      : this.firstPeriodCallsResource.value(),
  );

  readonly isLoadingLinkOptions = computed(() =>
    this.linkKind() === 'preassignment'
      ? this.preassignmentCallsResource.isLoading()
      : this.firstPeriodCallsResource.isLoading(),
  );

  readonly deleteModalTitle = computed(() =>
    this.deleteMode() === 'single'
      ? 'Eliminar convocatoria precarga'
      : 'Eliminar convocatorias precarga',
  );

  readonly deleteModalMessage = computed(() => {
    if (this.deleteMode() === 'single') {
      const record = this.preloadCallToDelete();
      return `¿Deseas eliminar la convocatoria "${record?.descripcion ?? ''}"?`;
    }

    return `¿Deseas eliminar ${this.idsToDelete().length} convocatoria(s)?`;
  });

  readonly deleteModalButtonText = computed(() =>
    this.isDeleting() ? 'Eliminando...' : 'Eliminar',
  );

  readonly restrictionDeleteModalTitle = computed(() =>
    this.restrictionDeleteMode() === 'single'
      ? 'Eliminar restricción de coordinación'
      : 'Eliminar restricciones de coordinación',
  );

  readonly restrictionDeleteModalMessage = computed(() => {
    if (this.restrictionDeleteMode() === 'single') {
      const record = this.restrictionToDelete();
      return `¿Deseas eliminar la restricción de "${record?.coordinacion?.nombre ?? ''}"?`;
    }

    return `¿Deseas eliminar ${this.restrictionIdsToDelete().length} restricción(es)?`;
  });

  readonly restrictionDeleteModalButtonText = computed(() =>
    this.isDeletingRestriction() ? 'Eliminando...' : 'Eliminar',
  );

  ngOnInit(): void {
    this.breadcrumbTitleService.setPageTitle('Convocatoria precarga');
    void this.loadUniversityPeriods();
  }

  ngOnDestroy(): void {
    this.breadcrumbTitleService.clearPageTitle();
  }

  onPeriodChange(periodId: string): void {
    this.selectedPeriodId.set(periodId);
  }

  onApplyPeriodFilter(): void {
    const periodId = this.selectedPeriodId();

    if (!periodId) {
      this.appliedPeriodId.set(null);
      this.selectedPreloadCallIds.set([]);
      this.closePreloadCallForm();
      this.closeRestrictCoordination();
      this.closeLinkModal();
      return;
    }

    const nextId = Number(periodId);

    if (Number.isNaN(nextId)) {
      return;
    }

    this.selectedPreloadCallIds.set([]);
    this.closeRestrictCoordination();
    this.closeLinkModal();

    if (this.appliedPeriodId() === nextId) {
      this.preloadCallsResource.reload();
      return;
    }

    this.appliedPeriodId.set(nextId);
  }

  private async loadUniversityPeriods(): Promise<void> {
    this.isLoadingPeriods.set(true);

    try {
      const periods = await firstValueFrom(
        this.preloadCallService.getUniversityPeriod(),
      );
      this.universityPeriods.set(periods ?? []);
    } catch (error) {
      console.error('Error al cargar periodos universitarios:', error);
      this.universityPeriods.set([]);
    } finally {
      this.isLoadingPeriods.set(false);
    }
  }

  openPreloadCallForm(): void {
    this.closeRestrictCoordination();
    this.closeLinkModal();
    this.selectedPreloadCall.set(null);
    this.formMode.set('create');
    this.showPreloadCallForm.set(true);
  }

  closePreloadCallForm(): void {
    this.showPreloadCallForm.set(false);
    this.selectedPreloadCall.set(null);
    this.formMode.set('create');
  }

  async openEditPreloadCallForm(preloadCall: PreloadCallItem): Promise<void> {
    if (!preloadCall?.id) {
      return;
    }

    this.closeRestrictCoordination();
    this.closeLinkModal();

    const response = await firstValueFrom(
      this.preloadCallService.getPreloadCallDetails(preloadCall.id),
    );

    this.selectedPreloadCall.set(response);
    this.formMode.set('edit');
    this.showPreloadCallForm.set(true);
  }

  async onSubmitPreloadCall(payload: PreloadCallSaveRequest): Promise<void> {
    const mode = this.formMode();
    this.isSaving.set(true);

    try {
      if (mode === 'edit') {
        const id = this.selectedPreloadCall()?.convocatoria?.id;

        if (!id) {
          return;
        }

        await firstValueFrom(
          this.preloadCallService.updatePreloadCall(id, payload),
        );
      } else {
        await firstValueFrom(
          this.preloadCallService.savePreloadCall(payload),
        );
      }

      this.preloadCallsResource.reload();
      this.closePreloadCallForm();
    } catch (error) {
      console.error('Error al guardar convocatoria:', error);
    } finally {
      this.isSaving.set(false);
    }
  }

  onSelectedPreloadCallIdsChange(ids: string[]): void {
    this.selectedPreloadCallIds.set(ids);
  }

  onDeletePreloadCall(preloadCall: PreloadCallItem): void {
    this.openSingleDeleteModal(preloadCall);
  }

  onRefreshPreloadCallList(): void {
    if (this.appliedPeriodId() == null) {
      return;
    }

    this.preloadCallsResource.reload();
  }

  onDeleteAllPreloadCall(ids: string[]): void {
    this.openBulkDeleteModal(ids);
  }

  openSingleDeleteModal(record: PreloadCallItem): void {
    if (!record?.id) {
      return;
    }

    this.deleteMode.set('single');
    this.preloadCallToDelete.set(record);
    this.idsToDelete.set([]);
    this.isDeleteModalOpen.set(true);
  }

  openBulkDeleteModal(ids: string[]): void {
    if (!ids.length) {
      return;
    }

    this.deleteMode.set('bulk');
    this.preloadCallToDelete.set(null);
    this.idsToDelete.set(ids);
    this.isDeleteModalOpen.set(true);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.resetDeleteModalState();
  }

  private resetDeleteModalState(): void {
    this.isDeleteModalOpen.set(false);
    this.preloadCallToDelete.set(null);
    this.idsToDelete.set([]);
  }

  async confirmDelete(): Promise<void> {
    if (this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    try {
      if (this.deleteMode() === 'single') {
        await this.deletePreloadCallById(this.preloadCallToDelete()?.id);
      } else {
        await this.bulkDeletePreloadCalls(this.idsToDelete());
      }
      this.preloadCallsResource.reload();
      this.resetDeleteModalState();
    } catch (error) {
      console.error('Error eliminando convocatoria:', error);
    } finally {
      this.isDeleting.set(false);
    }
  }

  private async deletePreloadCallById(id: number | undefined): Promise<void> {
    if (!id) {
      return;
    }

    const payload = await this.buildDeletePayload(id);

    await firstValueFrom(
      this.preloadCallService.deletePreloadCall(id, payload),
    );

    this.afterPreloadCallDeleted(id);
  }

  private async buildDeletePayload(
    id: number,
  ): Promise<PreloadCallDeleteRequest> {
    const detail = await firstValueFrom(
      this.preloadCallService.getPreloadCallDetails(id),
    );

    return buildPreloadCallDeletePayload(detail);
  }

  private async bulkDeletePreloadCalls(ids: string[]): Promise<void> {
    const payloads = await Promise.all(
      ids.map((idStr) => this.buildDeletePayload(Number(idStr))),
    );

    await firstValueFrom(
      this.preloadCallService.bulkDeletePreloadCall(payloads),
    );

    ids.forEach((idStr) => this.afterPreloadCallDeleted(Number(idStr)));
    this.selectedPreloadCallIds.set([]);
  }

  private afterPreloadCallDeleted(id: number): void {
    this.selectedPreloadCallIds.update((selectedIds) =>
      selectedIds.filter((selectedId) => selectedId !== String(id)),
    );

    const editingId = this.selectedPreloadCall()?.convocatoria?.id;
    if (editingId === id) {
      this.closePreloadCallForm();
    }
  }

  openLinkPreloadCallModal(preloadCall: PreloadCallItem): void {
    this.openCallLinkModal(preloadCall, 'period1');
  }

  openLinkPreassignmentModal(preloadCall: PreloadCallItem): void {
    this.openCallLinkModal(preloadCall, 'preassignment');
  }

  private openCallLinkModal(
    preloadCall: PreloadCallItem,
    kind: PreloadCallLinkKind,
  ): void {
    if (!preloadCall?.id) {
      return;
    }

    if (kind === 'period1' && !this.isSecondPeriodFilter()) {
      return;
    }

    this.closePreloadCallForm();
    this.closeRestrictCoordination();
    this.linkKind.set(kind);
    this.preloadCallToLink.set(preloadCall);
    this.isLinkModalOpen.set(true);
  }

  closeLinkModal(): void {
    if (this.isSavingLink()) {
      return;
    }

    this.isLinkModalOpen.set(false);
    this.preloadCallToLink.set(null);
    this.linkKind.set('period1');
  }

  async onSavePreloadCallLink(idRelacion: number): Promise<void> {
    await this.persistCallRelation(idRelacion);
  }

  async onUnlinkPreloadCall(): Promise<void> {
    const call = this.preloadCallToLink();
    if (!call?.id || call.idRelacion == null || this.isSavingLink()) {
      return;
    }

    await this.persistCallRelation(null);
  }

  private async persistCallRelation(
    idRelacion: number | null,
  ): Promise<void> {
    const call = this.preloadCallToLink();
    if (!call?.id || this.isSavingLink()) {
      return;
    }

    this.isSavingLink.set(true);

    try {
      await firstValueFrom(this.relationRequest(call.id, idRelacion));
      this.preloadCallsResource.reload();
      this.isLinkModalOpen.set(false);
      this.preloadCallToLink.set(null);
      this.linkKind.set('period1');
    } catch (error) {
      console.error('Error al relacionar convocatoria:', error);
    } finally {
      this.isSavingLink.set(false);
    }
  }

  private relationRequest(
    callId: number,
    idRelacion: number | null,
  ): Observable<void> {
    if (this.linkKind() === 'preassignment') {
      return this.preloadCallService.updatePreassignmentRelation(
        callId,
        idRelacion,
      );
    }

    return this.preloadCallService.updatePreloadCallRelation(
      callId,
      idRelacion,
    );
  }

  async openRestrictCoordination(preloadCall: PreloadCallItem): Promise<void> {
    if (!preloadCall?.id) {
      return;
    }

    this.preloadCallForRestriction.set(preloadCall);
    this.closePreloadCallForm();
    this.closeLinkModal();
    this.showRestrictCoordination.set(true);

    const detail = await firstValueFrom(
      this.preloadCallService.getPreloadCallDetails(preloadCall.id),
    );
    this.preloadCallDetailForRestriction.set(detail);

    await this.refreshRestrictCoordinations();
  }

  closeRestrictCoordination(): void {
    this.showRestrictCoordination.set(false);
    this.preloadCallForRestriction.set(null);
    this.restrictCoordinations.set([]);
    this.preloadCallDetailForRestriction.set(null);
    this.selectedRestrictCoordinationIds.set([]);
    this.resetRestrictionDeleteModalState();
  }

  async refreshRestrictCoordinations(): Promise<void> {
    const idConvocatoria =
      this.preloadCallDetailForRestriction()?.convocatoria?.id ??
      this.preloadCallForRestriction()?.id;

    if (!idConvocatoria) {
      this.restrictCoordinations.set([]);
      return;
    }

    try {
      const rows = await firstValueFrom(
        this.preloadCallService.listCoordinationRestriction(idConvocatoria),
      );
      this.restrictCoordinations.set(rows ?? []);
    } catch (error) {
      console.error('Error al listar restricciones de coordinación:', error);
      this.restrictCoordinations.set([]);
    }
  }

  onSelectedRestrictCoordinationIdsChange(ids: string[]): void {
    this.selectedRestrictCoordinationIds.set(ids);
  }

  async onSaveRestriction(
    event: RestrictCoordinationSaveEvent,
  ): Promise<void> {
    const detail = this.preloadCallDetailForRestriction();
    const idConvocatoria = detail?.convocatoria?.id ?? null;
    const idFechasConvocatoria =
      detail?.fechas.find((fecha) => fecha.codigo === 'CNV')?.id ?? null;

    if (!idConvocatoria || !idFechasConvocatoria) {
      console.error('Faltan datos para guardar restricción de coordinación');
      return;
    }

    const payload = {
      ...event.data,
      idConvocatoria,
      idFechasConvocatoria,
    };

    this.isSavingRestriction.set(true);

    try {
      if (event.id != null) {
        await firstValueFrom(
          this.preloadCallService.updateCoordinationRestriction(
            event.id,
            payload,
          ),
        );
      } else {
        await firstValueFrom(
          this.preloadCallService.saveCoordinationRestriction(payload),
        );
      }

      this.restrictCoordinationTable()?.closeRestrictionForm();
      await this.refreshRestrictCoordinations();
    } catch (error) {
      console.error('Error al guardar restricción de coordinación:', error);
    } finally {
      this.isSavingRestriction.set(false);
    }
  }

  onDeleteRestrictCoordination(item: RestrictCoordinationItem): void {
    if (!item?.id) {
      return;
    }

    this.restrictionDeleteMode.set('single');
    this.restrictionToDelete.set(item);
    this.restrictionIdsToDelete.set([]);
    this.isRestrictionDeleteModalOpen.set(true);
  }

  onDeleteAllRestrictCoordination(ids: string[]): void {
    if (!ids.length) {
      return;
    }

    this.restrictionDeleteMode.set('bulk');
    this.restrictionToDelete.set(null);
    this.restrictionIdsToDelete.set(ids);
    this.isRestrictionDeleteModalOpen.set(true);
  }

  closeRestrictionDeleteModal(): void {
    if (this.isDeletingRestriction()) {
      return;
    }

    this.resetRestrictionDeleteModalState();
  }

  private resetRestrictionDeleteModalState(): void {
    this.isRestrictionDeleteModalOpen.set(false);
    this.restrictionToDelete.set(null);
    this.restrictionIdsToDelete.set([]);
  }

  async confirmRestrictionDelete(): Promise<void> {
    if (this.isDeletingRestriction()) {
      return;
    }

    this.isDeletingRestriction.set(true);

    try {
      if (this.restrictionDeleteMode() === 'single') {
        await this.deleteRestrictionByItem(this.restrictionToDelete());
      } else {
        await this.bulkDeleteRestrictions(this.restrictionIdsToDelete());
      }

      this.selectedRestrictCoordinationIds.set([]);
      this.resetRestrictionDeleteModalState();
      await this.refreshRestrictCoordinations();
    } catch (error) {
      console.error('Error eliminando restricción de coordinación:', error);
    } finally {
      this.isDeletingRestriction.set(false);
    }
  }

  private async deleteRestrictionByItem(
    item: RestrictCoordinationItem | null,
  ): Promise<void> {
    if (!item?.id) {
      return;
    }

    await firstValueFrom(
      this.preloadCallService.deleteCoordinationRestriction(item.id, item),
    );
  }

  private async bulkDeleteRestrictions(ids: string[]): Promise<void> {
    const payloads = this.restrictCoordinations().filter((item) =>
      ids.includes(String(item.id)),
    );

    if (!payloads.length) {
      return;
    }

    await firstValueFrom(
      this.preloadCallService.bulkDeleteCoordinationRestriction(payloads),
    );
  }
}
