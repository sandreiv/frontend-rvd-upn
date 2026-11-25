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

import { StatesForm } from '../../components/states-form/states-form';

import { StatesTable } from '../../components/states-table/states-table';

import { StatesService } from '../../data/states.service';

import {
  StateFormData,
  StateItem,
} from '../../model/states.model';

@Component({
  selector: 'app-states',
  imports: [
    SectionFrame,
    StatesTable,
    StatesForm,
    NewModal,
  ],
  templateUrl: './states.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class States implements OnInit, OnDestroy {

  private readonly statesService =
    inject(StatesService);

  private readonly breadcrumbTitle =
    inject(BreadcrumbTitle);

  readonly states = signal<StateItem[]>([]);

  readonly selectedStateIds = signal<string[]>([]);

  readonly selectedState = signal<StateItem | null>(null);

  readonly showForm = signal(false);

  readonly showDeleteModal = signal(false);

  readonly isLoading = signal(false);

  readonly isSaving = signal(false);

  readonly isDeleting = signal(false);

  readonly idsToDelete = signal<number[]>([]);

  readonly deleteModalTitle = computed(() =>
    this.idsToDelete().length > 1
      ? 'Eliminar estados'
      : 'Eliminar estado',
  );

  readonly deleteModalMessage = computed(() => {

    const count = this.idsToDelete().length;

    if (count > 1) {
      return `¿Seguro que deseas eliminar los ${count} estados seleccionados?`;
    }

    const name = this.selectedState()?.nombre;

    return name
      ? `¿Seguro que deseas eliminar el estado "${name}"?`
      : '¿Seguro que deseas eliminar el estado seleccionado?';
  });

  readonly deleteModalButtonText = computed(() =>
    this.isDeleting()
      ? 'Eliminando...'
      : 'Sí, eliminar',
  );

  async ngOnInit(): Promise<void> {

    this.breadcrumbTitle.setPageTitle('Estados');

    await this.refreshStates();
  }

  ngOnDestroy(): void {
    this.breadcrumbTitle.clearPageTitle();
  }

  openCreateForm(): void {

    this.selectedState.set(null);

    this.showForm.set(true);
  }

  openEditForm(state: StateItem): void {

    this.selectedState.set(state);

    this.showForm.set(true);
  }

  closeForm(): void {

    this.showForm.set(false);

    this.selectedState.set(null);
  }

  async onSaveState(
    payload: StateFormData,
  ): Promise<void> {

    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    try {

      const selected = this.selectedState();

      if (selected?.id) {

        await firstValueFrom(
          this.statesService.updateState(
            selected.id,
            payload,
          ),
        );

      } else {

        await firstValueFrom(
          this.statesService.saveState(payload),
        );
      }

      this.closeForm();

      await this.refreshStates();

    } catch (error) {

      console.error(error);

    } finally {

      this.isSaving.set(false);
    }
  }

  requestDeleteState(state: StateItem): void {

    this.selectedState.set(state);

    this.idsToDelete.set([state.id]);

    this.showDeleteModal.set(true);
  }

  requestBulkDelete(ids: number[]): void {

    if (!ids.length) {
      return;
    }

    this.selectedState.set(
      ids.length === 1
        ? this.states().find(
            (state) => state.id === ids[0],
          ) ?? null
        : null,
    );

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

    const ids = this.idsToDelete();

    if (!ids.length || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);

    try {

      if (ids.length === 1) {

        await firstValueFrom(
          this.statesService.deleteState(ids[0]),
        );

      } else {

        await firstValueFrom(
          this.statesService.deleteStates(ids),
        );
      }

      this.selectedStateIds.set([]);

      this.resetDeleteModalState();

      await this.refreshStates();

    } catch (error) {

      console.error(error);

    } finally {

      this.isDeleting.set(false);
    }
  }

  onSelectedIdsChange(ids: string[]): void {

    this.selectedStateIds.set(ids);
  }

  async refreshStates(): Promise<void> {

    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);

    try {

      const rows = await firstValueFrom(
        this.statesService.listStates(),
      );

      this.states.set(rows ?? []);

      this.selectedStateIds.set([]);

    } catch (error) {

      console.error(error);

    } finally {

      this.isLoading.set(false);
    }
  }

  private resetDeleteModalState(): void {

    this.showDeleteModal.set(false);

    this.idsToDelete.set([]);

    this.selectedState.set(null);
  }
}