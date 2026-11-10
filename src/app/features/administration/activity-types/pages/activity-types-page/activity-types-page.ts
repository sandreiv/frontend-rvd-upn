import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BreadcrumbTitle } from '../../../../../core/service/breadcrumb-title';
import { NewModal } from '../../../../../shared/ui/new-modal/new-modal';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { ActivityTypeForm } from '../../components/activity-type-form/activity-type-form';
import { ActivityTypeTable } from '../../components/activity-type-table/activity-type-table';
import { ActivityTypesService } from '../../data/activity-types.service';
import {
  ActivityTypeFormData,
  ActivityTypeItem,
  parseActivityHours,
  sumChildrenMaxHours,
} from '../../model/activity-types.model';

@Component({
  selector: 'app-activity-types-page',
  imports: [SectionFrame, ActivityTypeTable, ActivityTypeForm, NewModal],
  templateUrl: './activity-types-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTypesPage implements OnInit {
  private readonly activityTypesService = inject(ActivityTypesService);
  private readonly breadcrumbTitle = inject(BreadcrumbTitle);

  readonly activityTypes = signal<ActivityTypeItem[]>([]);
  readonly selectedActivityTypeIds = signal<string[]>([]);
  readonly selectedActivityType = signal<ActivityTypeItem | null>(null);
  readonly parentActivityType = signal<ActivityTypeItem | null>(null);

  readonly showForm = signal(false);
  readonly showDeleteModal = signal(false);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  readonly idsToDelete = signal<number[]>([]);

  readonly isChildForm = computed(() => this.parentActivityType() != null);

  readonly formTitle = computed(() =>
    this.isChildForm() ? 'Nueva actividad hija' : 'Nuevo tipo de actividad',
  );

  readonly formEditTitle = computed(() =>
    this.isChildForm() ? 'Editar actividad hija' : 'Editar tipo de actividad',
  );

  readonly formDescription = computed(() => {
    const parent = this.parentActivityType();
    return parent
      ? `Registra o modifica una actividad hija para ${parent.nombre}.`
      : 'Registra o modifica los tipos de actividad principales.';
  });

  readonly parentMinHoras = computed(() =>
    parseActivityHours(this.parentActivityType()?.minimoHoras),
  );

  readonly parentMaxHoras = computed(() =>
    parseActivityHours(this.parentActivityType()?.maximoHoras),
  );

  readonly siblingsMaxHoursSum = computed(() => {
    const parent = this.parentActivityType();
    if (!parent?.id) {
      return 0;
    }
    const siblings = this.activityTypes().filter((item) => item.idPadre === parent.id);
    return sumChildrenMaxHours(siblings, this.selectedActivityType()?.id ?? null);
  });

  readonly deleteModalTitle = computed(() =>
    this.idsToDelete().length > 1 ? 'Eliminar tipos de actividades' : 'Eliminar tipo de actividad',
  );

  readonly deleteModalMessage = computed(() => {
    const count = this.idsToDelete().length;
    if (count > 1) {
      return `¿Seguro que deseas eliminar los ${count} tipos de actividades seleccionados?`;
    }
    const name = this.selectedActivityType()?.nombre ?? '';
    return `¿Seguro que deseas eliminar el tipo de actividad "${name}"?`;
  });

  async ngOnInit(): Promise<void> {
    this.breadcrumbTitle.setPageTitle('Tipo actividades');
    await this.refreshActivityTypes();
  }

  openCreateRootForm(): void {
    this.parentActivityType.set(null);
    this.selectedActivityType.set(null);
    this.showForm.set(true);
  }

  openCreateChildForm(parent: ActivityTypeItem): void {
    this.parentActivityType.set(parent);
    this.selectedActivityType.set(null);
    this.showForm.set(true);
  }

  openEditForm(activityType: ActivityTypeItem): void {
    if (activityType.idPadre != null) {
      const parent = this.activityTypes().find((item) => item.id === activityType.idPadre) ?? null;
      this.parentActivityType.set(parent);
    } else {
      this.parentActivityType.set(null);
    }

    this.selectedActivityType.set(activityType);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.selectedActivityType.set(null);
    this.parentActivityType.set(null);
  }

  async onSaveActivityType(payload: ActivityTypeFormData): Promise<void> {
    this.isSaving.set(true);

    try {
      const selected = this.selectedActivityType();
      const parent = this.parentActivityType();

      if (selected?.id) {
        await firstValueFrom(
          this.activityTypesService.updateActivityType(selected.id, payload),
        );
      } else if (parent?.id) {
        await firstValueFrom(
          this.activityTypesService.saveChildActivityType(parent.id, payload),
        );
      } else {
        await firstValueFrom(
          this.activityTypesService.saveActivityType(payload),
        );
      }

      this.closeForm();
      await this.refreshActivityTypes();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  requestDeleteActivityType(activityType: ActivityTypeItem): void {
    this.selectedActivityType.set(activityType);
    this.idsToDelete.set([activityType.id]);
    this.showDeleteModal.set(true);
  }

  requestBulkDelete(ids: number[]): void {
    if (!ids.length) {
      return;
    }
    this.selectedActivityType.set(null);
    this.idsToDelete.set(ids);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.idsToDelete.set([]);
    this.selectedActivityType.set(null);
  }

  async confirmDelete(): Promise<void> {
    const ids = this.idsToDelete();
    if (!ids.length) {
      return;
    }

    this.isDeleting.set(true);

    try {
      if (ids.length === 1) {
        await firstValueFrom(this.activityTypesService.deleteActivityType(ids[0]));
      } else {
        await firstValueFrom(this.activityTypesService.deleteBulkActivityTypes({ ids }));
      }
      this.selectedActivityTypeIds.set([]);
      this.closeDeleteModal();
      await this.refreshActivityTypes();
    } catch (error) {
      console.error(error);
    } finally {
      this.isDeleting.set(false);
    }
  }

  async refreshActivityTypes(): Promise<void> {
    this.isLoading.set(true);

    try {
      const rows = await firstValueFrom(
        this.activityTypesService.listAllActivityTypes(),
      );
      this.activityTypes.set(rows ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
