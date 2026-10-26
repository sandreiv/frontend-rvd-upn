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
import { ProjectCallsForm } from '../../components/project-calls-form/project-calls-form';
import { ProjectCallsTable } from '../../components/project-calls-table/project-calls-table';
import { ProjectCallsService } from '../../data/project-calls.service';
import {
  ProjectCallFormData,
  ProjectCallItem,
} from '../../model/project-calls.model';

@Component({
  selector: 'app-project-calls',
  imports: [SectionFrame, ProjectCallsTable, ProjectCallsForm, NewModal],
  templateUrl: './project-calls.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCalls implements OnInit, OnDestroy {
  private readonly projectCallsService = inject(ProjectCallsService);
  private readonly breadcrumbTitle = inject(BreadcrumbTitle);

  readonly projectCalls = signal<ProjectCallItem[]>([]);
  readonly selectedProjectCallIds = signal<string[]>([]);
  readonly selectedProjectCall = signal<ProjectCallItem | null>(null);

  readonly showForm = signal(false);
  readonly showDeleteModal = signal(false);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  readonly idsToDelete = signal<number[]>([]);

  readonly deleteModalTitle = computed(() =>
    this.idsToDelete().length > 1
      ? 'Eliminar convocatorias de proyecto'
      : 'Eliminar convocatoria de proyecto',
  );

  readonly deleteModalMessage = computed(() => {
    const count = this.idsToDelete().length;

    if (count > 1) {
      return `¿Seguro que deseas eliminar las ${count} convocatorias de proyecto seleccionadas?`;
    }

    return `¿Seguro que deseas eliminar la convocatoria de proyecto "${this.selectedProjectCall()?.nombre ?? ''}"?`;
  });

  readonly deleteModalButtonText = computed(() =>
    this.isDeleting() ? 'Eliminando...' : 'Sí, eliminar',
  );

  async ngOnInit(): Promise<void> {
    this.breadcrumbTitle.setPageTitle(
      'Convocatorias de proyecto',
    );
    await this.refreshProjectCalls();
  }

  ngOnDestroy(): void {
    this.breadcrumbTitle.clearPageTitle();
  }

  openCreateForm(): void {
    this.selectedProjectCall.set(null);
    this.showForm.set(true);
  }

  openEditForm(projectCall: ProjectCallItem): void {
    this.selectedProjectCall.set(projectCall);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.selectedProjectCall.set(null);
  }

  async onSaveProjectCall(payload: ProjectCallFormData): Promise<void> {
    this.isSaving.set(true);

    try {
      const selected = this.selectedProjectCall();

      if (selected?.id) {
        await firstValueFrom(
          this.projectCallsService.updateProjectCall(selected.id, payload),
        );
      } else {
        await firstValueFrom(
          this.projectCallsService.saveProjectCall(payload),
        );
      }

      this.closeForm();
      await this.refreshProjectCalls();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  requestDeleteProjectCall(projectCall: ProjectCallItem): void {
    this.selectedProjectCall.set(projectCall);
    this.idsToDelete.set([projectCall.id]);
    this.showDeleteModal.set(true);
  }

  requestBulkDelete(ids: number[]): void {
    if (!ids.length) {
      return;
    }

    this.selectedProjectCall.set(null);
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
          this.projectCallsService.deleteProjectCall(ids[0]),
        );
      } else {
        await firstValueFrom(
          this.projectCallsService.deleteBulkProjectCalls({ ids }),
        );
      }

      this.selectedProjectCallIds.set([]);
      this.resetDeleteModalState();
      await this.refreshProjectCalls();
    } catch (error) {
      console.error(error);
    } finally {
      this.isDeleting.set(false);
    }
  }

  onSelectedIdsChange(ids: string[]): void {
    this.selectedProjectCallIds.set(ids);
  }

  async refreshProjectCalls(): Promise<void> {
    this.isLoading.set(true);

    try {
      const rows = await firstValueFrom(
        this.projectCallsService.listProjectCalls(),
      );
      this.projectCalls.set(rows ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private resetDeleteModalState(): void {
    this.showDeleteModal.set(false);
    this.idsToDelete.set([]);
    this.selectedProjectCall.set(null);
  }
}
