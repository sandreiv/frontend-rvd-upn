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
import { NoveltiesForm } from '../../components/novelties-form/novelties-form';
import { NoveltiesTable } from '../../components/novelties-table/novelties-table';
import { NoveltiesService } from '../../data/novelties.service';
import {
  NoveltyFormData,
  NoveltyItem,
} from '../../model/novelties.model';

@Component({
  selector: 'app-novelties',
  imports: [
    SectionFrame,
    NoveltiesTable,
    NoveltiesForm,
    NewModal,
  ],
  templateUrl: './novelties.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class Novelties
  implements OnInit, OnDestroy
{
  private readonly noveltiesService =
    inject(NoveltiesService);

  private readonly breadcrumbTitle =
    inject(BreadcrumbTitle);

  readonly novelties =
    signal<NoveltyItem[]>([]);

  readonly selectedNoveltyIds =
    signal<string[]>([]);

  readonly selectedNovelty =
    signal<NoveltyItem | null>(null);

  readonly showForm = signal(false);
  readonly showDeleteModal =
    signal(false);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  readonly idsToDelete =
    signal<number[]>([]);

  readonly deleteModalTitle =
    computed(() =>
      this.idsToDelete().length > 1
        ? 'Eliminar novedades'
        : 'Eliminar novedad',
    );

  readonly deleteModalMessage =
    computed(() => {
      const count =
        this.idsToDelete().length;

      if (count > 1) {
        return `¿Seguro que deseas eliminar las ${count} novedades seleccionadas?`;
      }

      return `¿Seguro que deseas eliminar la novedad "${this.selectedNovelty()?.tipo ?? ''}"?`;
    });

  readonly deleteModalButtonText =
    computed(() =>
      this.isDeleting()
        ? 'Eliminando...'
        : 'Sí, eliminar',
    );

  async ngOnInit(): Promise<void> {
    this.breadcrumbTitle.setPageTitle(
      'Novedades',
    );

    await this.refreshNovelties();
  }

  ngOnDestroy(): void {
    this.breadcrumbTitle.clearPageTitle();
  }

  openCreateForm(): void {
    this.selectedNovelty.set(null);
    this.showForm.set(true);
  }

  openEditForm(
    novelty: NoveltyItem,
  ): void {
    this.selectedNovelty.set(novelty);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.selectedNovelty.set(null);
  }

  async onSaveNovelty(
    payload: NoveltyFormData,
  ): Promise<void> {
    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    try {
      const selected =
        this.selectedNovelty();

      if (selected?.id) {
        await firstValueFrom(
          this.noveltiesService.updateNovelty(
            selected.id,
            payload,
          ),
        );
      } else {
        await firstValueFrom(
          this.noveltiesService.saveNovelty(
            payload,
          ),
        );
      }

      this.closeForm();
      await this.refreshNovelties();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  requestDeleteNovelty(
    novelty: NoveltyItem,
  ): void {
    this.selectedNovelty.set(novelty);
    this.idsToDelete.set([novelty.id]);
    this.showDeleteModal.set(true);
  }

  requestBulkDelete(
    ids: number[],
    ): void {
    if (!ids.length) {
        return;
    }

    const selected =
        ids.length === 1
        ? this.novelties().find(
            (novelty) => novelty.id === ids[0],
            ) ?? null
        : null;

    this.selectedNovelty.set(selected);
    this.idsToDelete.set(ids);
    this.showDeleteModal.set(true);
   }

  closeDeleteModal(): void {
    if (this.isDeleting()) {
      return;
    }

    this.resetDeleteModalState();
  }

  async confirmDelete(): Promise<void> {
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
          this.noveltiesService.deleteNovelty(
            ids[0],
          ),
        );
      } else {
        await firstValueFrom(
          this.noveltiesService.deleteBulkNovelties(
            { ids },
          ),
        );
      }

      this.selectedNoveltyIds.set([]);

      this.resetDeleteModalState();

      await this.refreshNovelties();
    } catch (error) {
      console.error(error);
    } finally {
      this.isDeleting.set(false);
    }
  }

  onSelectedIdsChange(
    ids: string[],
  ): void {
    this.selectedNoveltyIds.set(ids);
  }

  async refreshNovelties():
    Promise<void> {
    this.isLoading.set(true);

    try {
      const rows =
        await firstValueFrom(
          this.noveltiesService.listNovelties(),
        );

      this.novelties.set(
        rows ?? [],
      );
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private resetDeleteModalState():
    void {
    this.showDeleteModal.set(false);
    this.idsToDelete.set([]);
    this.selectedNovelty.set(null);
  }
}