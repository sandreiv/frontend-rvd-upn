import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BreadcrumbTitle } from '../../../../../core/service/breadcrumb-title';
import { NewModal } from '../../../../../shared/ui/new-modal/new-modal';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { PointsValidityForm } from '../../components/points-validity-form/points-validity-form';
import { PointsValidityTable } from '../../components/points-validity-table/points-validity-table';
import { PointsValidityService } from '../../data/points-validity.service';
import {
  PointsValidityFormData,
  PointsValidityItem,
} from '../../model/points-validity.model';

@Component({
  selector: 'app-points-validity',
  imports: [
    SectionFrame,
    PointsValidityTable,
    PointsValidityForm,
    NewModal,
  ],
  templateUrl:
    './points-validity.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class PointsValidity
  implements OnInit, OnDestroy {

  private readonly service =
    inject(PointsValidityService);

  private readonly breadcrumbTitle =
    inject(BreadcrumbTitle);

  readonly items =
    signal<PointsValidityItem[]>([]);

  readonly selectedIds =
    signal<string[]>([]);

  readonly selectedItem =
    signal<PointsValidityItem | null>(
      null,
    );

  readonly showForm =
    signal(false);

  readonly showDeleteModal =
    signal(false);

  readonly isLoading =
    signal(false);

  readonly isSaving =
    signal(false);

  readonly isDeleting =
    signal(false);

  readonly idsToDelete =
    signal<number[]>([]);

  readonly deleteModalTitle =
    computed(() =>
      this.idsToDelete().length > 1
        ? 'Eliminar vigencias'
        : 'Eliminar vigencia',
    );

  readonly deleteModalMessage =
    computed(() => {

      const count =
        this.idsToDelete().length;

      if (count > 1) {
        return `¿Seguro que deseas eliminar las ${count} vigencias seleccionadas?`;
      }

      return `¿Seguro que deseas eliminar la vigencia del año ${this.selectedItem()?.anio ?? ''}?`;
    });

  readonly deleteModalButtonText =
    computed(() =>
      this.isDeleting()
        ? 'Eliminando...'
        : 'Sí, eliminar',
    );

  async ngOnInit():
    Promise<void> {

    this.breadcrumbTitle.setPageTitle(
      'Puntos por vigencia',
    );

    await this.refresh();
  }

  ngOnDestroy(): void {
    this.breadcrumbTitle
      .clearPageTitle();
  }

  openCreateForm(): void {
    this.selectedItem.set(null);
    this.showForm.set(true);
  }

  openEditForm(
    item: PointsValidityItem,
  ): void {
    this.selectedItem.set(item);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.selectedItem.set(null);
  }

  async onSave(
    payload: PointsValidityFormData,
  ): Promise<void> {

    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    try {
      const selected =
        this.selectedItem();

      if (selected?.id) {
        await firstValueFrom(
          this.service.update(
            selected.id,
            payload,
          ),
        );
      } else {
        await firstValueFrom(
          this.service.save(
            payload,
          ),
        );
      }

      this.closeForm();
      await this.refresh();

    } catch (error) {
      console.error(error);

    } finally {
      this.isSaving.set(false);
    }
  }

  requestDelete(
    item: PointsValidityItem,
  ): void {

    this.selectedItem.set(item);

    this.idsToDelete.set([
      item.id,
    ]);

    this.showDeleteModal.set(true);
  }

  requestBulkDelete(
    ids: number[],
  ): void {

    if (!ids.length) {
      return;
    }

    /*
     * Si solo seleccionó una fila mediante
     * checkbox, conservamos la fila para
     * mostrar el año en el modal.
     */
    const selected =
      ids.length === 1
        ? this.items().find(
            (item) =>
              item.id === ids[0],
          ) ?? null
        : null;

    this.selectedItem.set(
      selected,
    );

    this.idsToDelete.set(ids);

    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {

    if (this.isDeleting()) {
      return;
    }

    this.resetDeleteState();
  }

  async confirmDelete():
    Promise<void> {

    const ids =
      this.idsToDelete();

    if (
      !ids.length ||
      this.isDeleting()
    ) {
      return;
    }

    this.isDeleting.set(true);

    try {
      if (ids.length === 1) {

        await firstValueFrom(
          this.service.delete(
            ids[0],
          ),
        );

      } else {

        await firstValueFrom(
          this.service.deleteBulk(
            { ids },
          ),
        );
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

  onSelectedIdsChange(
    ids: string[],
  ): void {
    this.selectedIds.set(ids);
  }

  async refresh():
    Promise<void> {

    this.isLoading.set(true);

    try {
      const rows =
        await firstValueFrom(
          this.service.list(),
        );

      this.items.set(
        rows ?? [],
      );

    } catch (error) {
      console.error(error);

    } finally {
      this.isLoading.set(false);
    }
  }

  private resetDeleteState():
    void {

    this.showDeleteModal.set(false);

    this.idsToDelete.set([]);

    this.selectedItem.set(null);
  }
}