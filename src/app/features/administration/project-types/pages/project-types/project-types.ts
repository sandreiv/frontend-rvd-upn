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
import { ProjectTypesForm } from '../../components/project-types-form/project-types-form';
import { ProjectTypesTable } from '../../components/project-types-table/project-types-table';
import { ProjectTypesService } from '../../data/project-types.service';
import {
  ProjectTypeFormData,
  ProjectTypeItem,
} from '../../model/project-types.model';

@Component({
  selector: 'app-project-types',
  imports: [SectionFrame, ProjectTypesTable, ProjectTypesForm, NewModal],
  templateUrl: './project-types.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTypes implements OnInit, OnDestroy {
  private readonly projectTypesService = inject(ProjectTypesService);
  private readonly breadcrumbTitle = inject(BreadcrumbTitle);

  readonly projectTypes = signal<ProjectTypeItem[]>([]);
  readonly selectedProjectTypeIds = signal<string[]>([]);
  readonly selectedProjectType = signal<ProjectTypeItem | null>(null);

  readonly showForm = signal(false);
  readonly showDeleteModal = signal(false);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  readonly idsToDelete = signal<number[]>([]);

  readonly deleteModalTitle = computed(() =>
    this.idsToDelete().length > 1
      ? 'Eliminar tipos de proyecto'
      : 'Eliminar tipo de proyecto',
  );

  readonly deleteModalMessage = computed(() => {
    const count = this.idsToDelete().length;

    if (count > 1) {
      return `¿Seguro que deseas eliminar los ${count} tipos de proyecto seleccionados?`;
    }

    return `¿Seguro que deseas eliminar el tipo de proyecto "${this.selectedProjectType()?.nombre ?? ''}"?`;
  });

  readonly deleteModalButtonText = computed(() =>
    this.isDeleting() ? 'Eliminando...' : 'Sí, eliminar',
  );

  async ngOnInit(): Promise<void> {
    this.breadcrumbTitle.setPageTitle('Tipos de proyecto');
    await this.refreshProjectTypes();
  }

  ngOnDestroy(): void {
    this.breadcrumbTitle.clearPageTitle();
  }

  openCreateForm(): void {
    this.selectedProjectType.set(null);
    this.showForm.set(true);
  }

  openEditForm(projectType: ProjectTypeItem): void {
    this.selectedProjectType.set(projectType);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.selectedProjectType.set(null);
  }

  async onSaveProjectType(payload: ProjectTypeFormData): Promise<void> {
    this.isSaving.set(true);

    try {
      const selected = this.selectedProjectType();

      if (selected?.id) {
        await firstValueFrom(
          this.projectTypesService.updateProjectType(selected.id, payload),
        );
      } else {
        await firstValueFrom(
          this.projectTypesService.saveProjectType(payload),
        );
      }

      this.closeForm();
      await this.refreshProjectTypes();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  requestDeleteProjectType(projectType: ProjectTypeItem): void {
    this.selectedProjectType.set(projectType);
    this.idsToDelete.set([projectType.id]);
    this.showDeleteModal.set(true);
  }

  requestBulkDelete(ids: number[]): void {
    if (!ids.length) {
      return;
    }

    this.selectedProjectType.set(null);
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
          this.projectTypesService.deleteProjectType(ids[0]),
        );
      } else {
        await firstValueFrom(
          this.projectTypesService.deleteBulkProjectTypes({ ids }),
        );
      }

      this.selectedProjectTypeIds.set([]);
      this.resetDeleteModalState();
      await this.refreshProjectTypes();
    } catch (error) {
      console.error(error);
    } finally {
      this.isDeleting.set(false);
    }
  }

  onSelectedIdsChange(ids: string[]): void {
    this.selectedProjectTypeIds.set(ids);
  }

  async refreshProjectTypes(): Promise<void> {
    this.isLoading.set(true);

    try {
      const rows = await firstValueFrom(
        this.projectTypesService.listProjectTypes(),
      );
      this.projectTypes.set(rows ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private resetDeleteModalState(): void {
    this.showDeleteModal.set(false);
    this.idsToDelete.set([]);
    this.selectedProjectType.set(null);
  }
}
