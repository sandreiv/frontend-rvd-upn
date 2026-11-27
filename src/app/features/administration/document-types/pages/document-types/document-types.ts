import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { NewModal } from '../../../../../shared/ui/new-modal/new-modal';
import { DocumentTypesService } from '../../data/document-types.service';
import { BreadcrumbTitle } from '../../../../../core/service/breadcrumb-title';
import { DocumentTypesFormData, DocumentTypesItem } from '../../model/document-types.model';
import { firstValueFrom } from 'rxjs';
import { DocumentTypesForm } from '../../components/document-types-form/document-types-form';
import { DocumentTypesTable } from '../../components/document-types-table/document-types-table';

@Component({
  selector: 'app-document-types',
  imports: [SectionFrame, NewModal, DocumentTypesForm, DocumentTypesTable],
  templateUrl: './document-types.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentTypes implements OnInit, OnDestroy {

  private readonly service = inject(DocumentTypesService);
  private readonly breadcrumbTitle = inject(BreadcrumbTitle);

  readonly items = signal<DocumentTypesItem[]>([]);
  readonly selectedIds = signal<string[]>([]);
  readonly selectedItem = signal<DocumentTypesItem|null>(null);
  
  readonly showForm = signal(false);
  readonly showDeleteModal = signal(false);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly idsToDelete = signal<number[]>([]);

  readonly deleteModalTitle = computed(() => this.idsToDelete().length > 1
    ? 'Eliminar documentos'
    : 'Eliminar documento'
  );
  readonly deleteModalMessage = computed(() => {
    const count = this.idsToDelete().length;

    if (count > 1) {
      return `¿Seguro que deseas eliminar los ${count} documentos seleccionados?`;
    }

    return `¿Seguro que deseas eliminar el documento de ${this.selectedItem()?.nombre ?? ''}?`;
  })
  readonly deleteModalButtonText = computed(() => this.isDeleting()
    ? 'Eliminando...'
    : 'Sí, eliminar'
  );

  async ngOnInit(): Promise<void> {
    this.breadcrumbTitle.setPageTitle('Tipos de documentos')

    await this.refresh();
  }

  ngOnDestroy(): void {
    this.breadcrumbTitle.clearPageTitle();
  }

  openCreateForm(): void {
    this.selectedItem.set(null);
    this.showForm.set(true);
  }

  openEditForm(item: DocumentTypesItem): void {
    this.selectedItem.set(item);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.selectedItem.set(null);
    this.showForm.set(false);
  }

  
  async onSave(payload: DocumentTypesFormData): Promise<void> {
    if (this.isSaving()) {
      return
    }

    this.isSaving.set(true);
    try {
      const selected = this.selectedItem();

      if (selected?.id) {
        await firstValueFrom(this.service.update(selected.id, payload));
      } else {
        await firstValueFrom(this.service.save(payload));
      }

      this.closeForm();
      await this.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  requestDelete(item: DocumentTypesItem): void {
    this.selectedItem.set(item);
    this.idsToDelete.set([item.id]);
    this.showDeleteModal.set(true);
  }

  requestBulkDelete(ids: number[]): void {
    if (!ids.length) {
      return;
    }

    // Si solo selecciono una fila mediante checkbox, conservamos la fila
    // para mostrar el nombre en el modal
    const selected = ids.length === 1
      ? this.items().find((item) => item.id === ids[0]) ?? null
      : null;
    
    this.selectedItem.set(selected);
    this.idsToDelete.set(ids);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.resetDeleteState();
  }

  async confirmDelete(): Promise<void> {
    const ids = this.idsToDelete();

    if (!ids.length || this.isDeleting()) {
      return
    }

    this.isDeleting.set(true);
    try {
      if (ids.length === 1) {
        await firstValueFrom(this.service.delete(ids[0]));
      } else {
        await firstValueFrom(this.service.deleteBulk({ ids }))
      }

      this.selectedIds.set([]);
      this.resetDeleteState();
      await this.refresh();
    } catch (error) {
      console.error(error);
    } finally {
      this.isDeleting.set(false);
    }
  }

  onSelectedIdsChange(ids: string[]): void {
    this.selectedIds.set(ids);
  }

  async refresh(): Promise<void> {
    this.isLoading.set(true);
    try {
      const rows = await firstValueFrom(this.service.list());
      this.items.set(rows ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  
  private resetDeleteState(): void {
    this.showDeleteModal.set(false);
    this.idsToDelete.set([]);
    this.selectedItem.set(null);
  }
}