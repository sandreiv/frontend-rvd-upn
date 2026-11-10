import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom, Observable } from 'rxjs';
import { BreadcrumbTitle } from '../../../../../core/service/breadcrumb-title';
import { Button } from '../../../../../shared/ui/button/button';
import { NewModal } from '../../../../../shared/ui/new-modal/new-modal';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { Option as SelectOption, Select } from '../../../../../shared/components/form/select/select';
import { PreloadCallForm } from '../../components/preload-call-form/preload-call-form';
import { PreloadCallTable } from '../../components/preload-call-table/preload-call-table';
import { LinkPreloadCallModal, type PreloadCallLinkKind } from '../../components/link-preload-call-modal/link-preload-call-modal';
import { PreloadCallService } from '../../data/preload-call.service';
import {
  ConvocatoriaFormularioDTO,
  PreloadCallItem,
  UniversityPeriodItem,
  formatUniversityPeriodLabel,
} from '../../model/preload-call.model';
import { formatSentenceValue } from '../../../../../shared/utils/normalized-text.util';

@Component({
  selector: 'app-preload-call',
  imports: [
    SectionFrame,
    PreloadCallTable,
    PreloadCallForm,
    NewModal,
    LinkPreloadCallModal,
    Select,
    Button,
  ],
  templateUrl: './preload-call.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreloadCall implements OnInit, OnDestroy {
  private readonly preloadCallService = inject(PreloadCallService);
  private readonly breadcrumbTitleService = inject(BreadcrumbTitle);

  readonly universityPeriodsResource = rxResource({
    stream: () => this.preloadCallService.getUniversityPeriod(),
    defaultValue: [] as UniversityPeriodItem[],
  });

  readonly universityPeriods = computed(() => this.universityPeriodsResource.value());

  readonly universityPeriodOptions = computed((): SelectOption[] =>
    this.universityPeriods().map((period) => {
      const anio = period.anio ?? period.ano ?? '';
      const codigo = period.codigoPeriodo ? ` (${period.codigoPeriodo})` : '';
      return {
        value: String(period.id),
        label: `${anio} - ${period.periodo}${codigo}`,
        badge: formatSentenceValue(period.tipoPeriodo?.trim()) || undefined,
      };
    }),
  );

  readonly selectedUniversityPeriodId = signal<string>('');
  readonly activeFilterPeriodId = signal<number | null>(null);

  readonly preloadCallsResource = rxResource({
    params: () => ({ idPeriodo: this.activeFilterPeriodId() }),
    stream: ({ params }) =>
      this.preloadCallService.getPreloadCallList(params.idPeriodo ?? undefined),
    defaultValue: [] as PreloadCallItem[],
  });

  readonly preloadCalls = computed(() => this.preloadCallsResource.value());
  readonly isLoading = computed(() => this.preloadCallsResource.isLoading());
  readonly tableEmptyMessage = computed(() => 'No hay convocatorias registradas.');

  readonly selectedPreloadCallIds = signal<string[]>([]);
  readonly selectedPreloadCall = signal<ConvocatoriaFormularioDTO | null>(null);
  readonly showPreloadCallForm = signal(false);
  readonly isSaving = signal(false);
  readonly formMode = signal<'create' | 'edit' | 'read'>('create');

  readonly isDeleteModalOpen = signal(false);
  readonly deleteMode = signal<'single' | 'bulk'>('single');
  readonly preloadCallToDelete = signal<PreloadCallItem | null>(null);
  readonly idsToDelete = signal<string[]>([]);
  readonly isDeleting = signal(false);

  readonly isLinkModalOpen = signal(false);
  readonly preloadCallToLink = signal<PreloadCallItem | null>(null);
  readonly isSavingLink = signal(false);
  readonly linkKind = signal<PreloadCallLinkKind>('period1');

  readonly firstPeriodCallsResource = rxResource({
    params: () => {
      if (!this.isLinkModalOpen() || this.linkKind() !== 'period1') {
        return undefined;
      }
      const call = this.preloadCallToLink();
      const yearMatch = call?.periodoUniversidad?.match(/\d{4}/);
      const year = yearMatch ? Number(yearMatch[0]) : new Date().getFullYear();
      return { year };
    },
    stream: ({ params }) =>
      this.preloadCallService.listPreloadCallByFirstPeriodByYear(params.year),
    defaultValue: [] as PreloadCallItem[],
  });

  readonly linkModalCalls = computed(() => this.firstPeriodCallsResource.value());
  readonly isLoadingLinkOptions = computed(() => this.firstPeriodCallsResource.isLoading());

  readonly deleteModalTitle = computed(() =>
    this.deleteMode() === 'single'
      ? 'Eliminar convocatoria'
      : 'Eliminar convocatorias',
  );

  readonly deleteModalMessage = computed(() => {
    if (this.deleteMode() === 'single') {
      const record = this.preloadCallToDelete();
      return `¿Deseas eliminar la convocatoria "${record?.nombre || record?.descripcion || ''}"?`;
    }
    return `¿Deseas eliminar ${this.idsToDelete().length} convocatoria(s)?`;
  });

  readonly deleteModalButtonText = computed(() =>
    this.isDeleting() ? 'Eliminando...' : 'Eliminar',
  );

  ngOnInit(): void {
    this.breadcrumbTitleService.setPageTitle('Convocatorias');
  }

  ngOnDestroy(): void {
    this.breadcrumbTitleService.clearPageTitle();
  }

  onFilterByPeriod(): void {
    const selected = this.selectedUniversityPeriodId();
    this.activeFilterPeriodId.set(selected ? Number(selected) : null);
  }

  onClearFilter(): void {
    this.selectedUniversityPeriodId.set('');
    this.activeFilterPeriodId.set(null);
  }

  openPreloadCallForm(): void {
    this.closeLinkModal();
    const currentPeriodId = this.activeFilterPeriodId();
    this.selectedPreloadCall.set({
      id: null,
      idPeriodoUniversidad: currentPeriodId ?? 0,
      idRelacion: null,
      nombre: '',
      descripcion: '',
      fechaInicio: '',
      fechaFin: '',
      estado: '1',
      esIntersemestral: '0',
      vinculaciones: [],
    });
    this.formMode.set('create');
    this.showPreloadCallForm.set(true);
  }

  closePreloadCallForm(): void {
    this.showPreloadCallForm.set(false);
    this.selectedPreloadCall.set(null);
    this.formMode.set('create');
  }

  openEditPreloadCallForm(item: PreloadCallItem): void {
    this.closeLinkModal();
    this.formMode.set('edit');
    this.showPreloadCallForm.set(true);
    this.preloadCallService.getPreloadCallDetails(item.id).subscribe({
      next: (detail: ConvocatoriaFormularioDTO) => {
        this.selectedPreloadCall.set(detail);
      },
      error: () => {
        this.selectedPreloadCall.set({
          id: item.id,
          idPeriodoUniversidad: item.idPeriodoUniversidad,
          idRelacion: item.idRelacion,
          nombre: item.nombre,
          descripcion: item.descripcion,
          fechaInicio: item.fechaInicio,
          fechaFin: item.fechaFin,
          estado: item.estado,
          esIntersemestral: item.esIntersemestral,
          vinculaciones: [],
        });
      },
    });
  }

  onRefreshPreloadCallList(): void {
    this.preloadCallsResource.reload();
  }

  onSelectedPreloadCallIdsChange(ids: string[]): void {
    this.selectedPreloadCallIds.set(ids);
  }

  onSubmitPreloadCall(dto: ConvocatoriaFormularioDTO): void {
    this.isSaving.set(true);
    const request$: Observable<void> =
      this.formMode() === 'edit' && dto.id != null
        ? this.preloadCallService.updatePreloadCall(dto.id, dto)
        : this.preloadCallService.savePreloadCall(dto);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closePreloadCallForm();
        this.onRefreshPreloadCallList();
      },
      error: (err) => {
        this.isSaving.set(false);
        console.error('Error al guardar convocatoria:', err);
      },
    });
  }

  onDeletePreloadCall(item: PreloadCallItem): void {
    this.deleteMode.set('single');
    this.preloadCallToDelete.set(item);
    this.idsToDelete.set([String(item.id)]);
    this.isDeleteModalOpen.set(true);
  }

  onDeleteAllPreloadCall(ids: string[]): void {
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
    this.isDeleteModalOpen.set(false);
    this.preloadCallToDelete.set(null);
    this.idsToDelete.set([]);
  }

  confirmDelete(): void {
    const ids = this.idsToDelete().map((id) => Number(id)).filter((id) => !isNaN(id));
    if (!ids.length) {
      this.closeDeleteModal();
      return;
    }

    this.isDeleting.set(true);
    const deleteObservables = ids.map((id) => this.preloadCallService.deletePreloadCall(id));

    Promise.all(deleteObservables.map((obs) => firstValueFrom(obs)))
      .then(() => {
        this.isDeleting.set(false);
        this.closeDeleteModal();
        this.selectedPreloadCallIds.set([]);
        this.onRefreshPreloadCallList();
      })
      .catch((err) => {
        this.isDeleting.set(false);
        console.error('Error al eliminar convocatorias:', err);
      });
  }

  openLinkPreloadCallModal(item: PreloadCallItem): void {
    this.preloadCallToLink.set(item);
    this.linkKind.set('period1');
    this.isLinkModalOpen.set(true);
  }

  closeLinkModal(): void {
    if (this.isSavingLink()) {
      return;
    }
    this.isLinkModalOpen.set(false);
    this.preloadCallToLink.set(null);
  }

  onSaveLink(idRelacion: number): void {
    const currentCall = this.preloadCallToLink();
    if (!currentCall) return;

    this.isSavingLink.set(true);
    this.preloadCallService
      .updatePreloadCallRelation(currentCall.id, idRelacion)
      .subscribe({
        next: () => {
          this.isSavingLink.set(false);
          this.closeLinkModal();
          this.onRefreshPreloadCallList();
        },
        error: (err) => {
          this.isSavingLink.set(false);
          console.error('Error al asociar convocatoria:', err);
        },
      });
  }

  onUnlink(): void {
    const currentCall = this.preloadCallToLink();
    if (!currentCall) return;

    this.isSavingLink.set(true);
    this.preloadCallService
      .updatePreloadCallRelation(currentCall.id, null)
      .subscribe({
        next: () => {
          this.isSavingLink.set(false);
          this.closeLinkModal();
          this.onRefreshPreloadCallList();
        },
        error: (err) => {
          this.isSavingLink.set(false);
          console.error('Error al desvincular convocatoria:', err);
        },
      });
  }
}
