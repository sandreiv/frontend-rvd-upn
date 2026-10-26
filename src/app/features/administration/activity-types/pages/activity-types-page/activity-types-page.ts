import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BreadcrumbTitle } from '../../../../../core/service/breadcrumb-title';
import { NewModal } from '../../../../../shared/ui/new-modal/new-modal';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { ActivityTypeForm } from '../../components/activity-type-form/activity-type-form';
import { ActivityTypeTable } from '../../components/activity-type-table/activity-type-table';
import { ActivityTypesService } from '../../data/activity-types.service';
import { Button } from '../../../../../shared/ui/button/button';
import {
  ActivityTypeFormData,
  ActivityTypeItem,
  parseActivityHours,
  sumChildrenMaxHours,
} from '../../model/activity-types.model';

@Component({
  selector: 'app-activity-types-page',
  imports: [SectionFrame, ActivityTypeTable, ActivityTypeForm, NewModal, Button],
  templateUrl: './activity-types-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityTypesPage implements OnInit {
  private readonly activityTypesService = inject(ActivityTypesService);
  private readonly breadcrumbTitle = inject(BreadcrumbTitle);

  readonly activityTypes = signal<ActivityTypeItem[]>([]);
  readonly selectedActivityTypeIds = signal<string[]>([]);
  readonly selectedActivityType = signal<ActivityTypeItem | null>(null);

  readonly showForm = signal(false);
  readonly showDeleteModal = signal(false);

  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  readonly idsToDelete = signal<number[]>([]);

  readonly deleteModalTitle = computed(() =>
    this.idsToDelete().length > 1 ? 'Eliminar tipos de actividades' : 'Eliminar tipo de actividad',
  );

  readonly deleteModalMessage = computed(() => {
    const count = this.idsToDelete().length;

    if (count > 1) {
      return `¿Seguro que deseas eliminar los ${count} tipos de actividades seleccionados?`;
    }

    return `¿Seguro que deseas eliminar el tipo de actividad ${this.selectedActivityType()?.nombre ?? ''}?`;
  });

    readonly parentActivityType = signal<ActivityTypeItem | null>(null);
    readonly childActivityTypes = signal<ActivityTypeItem[]>([]);
    readonly selectedChildActivityTypeIds = signal<string[]>([]);

    readonly isChildrenView = computed(() => this.parentActivityType() != null);

    readonly displayedActivityTypes = computed(() =>
    this.isChildrenView() ? this.childActivityTypes() : this.activityTypes(),
    );

    readonly displayedSelectedIds = computed(() =>
    this.isChildrenView()
        ? this.selectedChildActivityTypeIds()
        : this.selectedActivityTypeIds(),
    );

    readonly tableEmptyMessage = computed(() =>
    this.isChildrenView()
        ? 'No hay actividades hijas registradas.'
        : 'No hay tipos de actividades registrados.',
    );

    readonly tableSearchPlaceholder = computed(() =>
    this.isChildrenView()
        ? 'Buscar actividad hija...'
        : 'Buscar tipo de actividad...',
    );

    readonly formTitle = computed(() =>
    this.isChildrenView() ? 'Nueva actividad hija' : 'Nuevo tipo de actividad',
    );

    readonly formEditTitle = computed(() =>
    this.isChildrenView() ? 'Editar actividad hija' : 'Editar tipo de actividad',
    );

    readonly formDescription = computed(() =>
    this.isChildrenView()
        ? `Registra una actividad hija para ${this.parentActivityType()?.nombre ?? ''}. El orden se calculará automáticamente.`
        : 'Registra actividades padre. El orden se calculará automáticamente.',
    );

    readonly parentMinHoras = computed(() =>
      parseActivityHours(this.parentActivityType()?.minimoHoras),
    );

    readonly parentMaxHoras = computed(() =>
      parseActivityHours(this.parentActivityType()?.maximoHoras),
    );

    readonly siblingsMaxHoursSum = computed(() =>
      sumChildrenMaxHours(
        this.childActivityTypes(),
        this.selectedActivityType()?.id ?? null,
      ),
    );

    readonly remainingParentHours = computed(() => {
      const parentMax = this.parentMaxHoras();
      if (parentMax == null) {
        return null;
      }

      return Math.max(parentMax - this.siblingsMaxHoursSum(), 0);
    });

    readonly childrenHoursSoftAlert = computed(() => {
      if (!this.isChildrenView() || this.showForm()) {
        return null;
      }

      const parentMin = this.parentMinHoras();
      const parentMax = this.parentMaxHoras();
      if (parentMin == null && parentMax == null) {
        return null;
      }

      const assigned = sumChildrenMaxHours(this.childActivityTypes());
      const parts: string[] = [];

      if (parentMin != null) {
        parts.push(
          `Horas mínimas que una actividad puede tener: ${parentMin}.`,
        );
      }

      if (parentMax != null) {
        const remaining = Math.max(parentMax - assigned, 0);
        parts.push(
          `Horas asignadas: ${assigned}/${parentMax}. Disponibles: ${remaining}.`,
        );
      }

      return parts.join(' ');
    });

    readonly canAddChildActivity = computed(() => {
      if (!this.isChildrenView()) {
        return true;
      }

      const remaining = this.remainingParentHours();
      if (remaining == null) {
        return true;
      }

      return remaining > 0;
    });

  async ngOnInit(): Promise<void> {
    this.breadcrumbTitle.setPageTitle('Tipo actividades');
    await this.refreshActivityTypes();
  }

  openCreateForm(): void {
    if (this.isChildrenView() && !this.canAddChildActivity()) {
      return;
    }

    this.selectedActivityType.set(null);
    this.showForm.set(true);
  }

  openEditForm(activityType: ActivityTypeItem): void {
    this.selectedActivityType.set(activityType);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.selectedActivityType.set(null);
  }

  async onSaveActivityType(payload: ActivityTypeFormData): Promise<void> {
    this.isSaving.set(true);

    try {
      const selected = this.selectedActivityType();

      if (selected?.id) {
        await firstValueFrom(
            this.activityTypesService.updateActivityType(selected.id, payload),
        );
        } else if (this.isChildrenView() && this.parentActivityType()?.id) {
        await firstValueFrom(
            this.activityTypesService.saveChildActivityType(
            this.parentActivityType()!.id,
            payload,
            ),
        );
        } else {
        await firstValueFrom(
            this.activityTypesService.saveActivityType(payload),
        );
        }

        this.closeForm();
       await this.refreshCurrentList();
      
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
        await firstValueFrom(
          this.activityTypesService.deleteActivityType(ids[0]),
        );
      } else {
        await firstValueFrom(
          this.activityTypesService.deleteBulkActivityTypes({ ids }),
        );
      }

      if (this.isChildrenView()) {
        this.selectedChildActivityTypeIds.set([]);
        } else {
        this.selectedActivityTypeIds.set([]);
        }

        this.closeDeleteModal();
        await this.refreshCurrentList();
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
        this.activityTypesService.listActivityTypes(),
      );

      this.activityTypes.set(rows ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

    async openChildrenView(activityType: ActivityTypeItem): Promise<void> {
    this.parentActivityType.set(activityType);
    this.selectedActivityType.set(null);
    this.selectedChildActivityTypeIds.set([]);
    this.showForm.set(false);
    await this.refreshChildActivityTypes();
    }

    backToParents(): void {
    this.parentActivityType.set(null);
    this.childActivityTypes.set([]);
    this.selectedChildActivityTypeIds.set([]);
    this.selectedActivityType.set(null);
    this.showForm.set(false);
    }

    onSelectedIdsChange(ids: string[]): void {
    if (this.isChildrenView()) {
        this.selectedChildActivityTypeIds.set(ids);
        return;
    }

    this.selectedActivityTypeIds.set(ids);
    }

    async refreshCurrentList(): Promise<void> {
    if (this.isChildrenView()) {
        await this.refreshChildActivityTypes();
        return;
    }

    await this.refreshActivityTypes();
    }

    async refreshChildActivityTypes(): Promise<void> {
    const parent = this.parentActivityType();

    if (!parent?.id) {
        return;
    }

    this.isLoading.set(true);

    try {
        const rows = await firstValueFrom(
        this.activityTypesService.listChildActivityTypes(parent.id),
        );

        this.childActivityTypes.set(rows ?? []);
    } catch (error) {
        console.error(error);
    } finally {
        this.isLoading.set(false);
    }
    }

}