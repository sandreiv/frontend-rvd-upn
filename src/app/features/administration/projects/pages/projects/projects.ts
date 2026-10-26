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
import { Button } from '../../../../../shared/ui/button/button';
import { ProjectForm } from '../../components/project-form/project-form';
import { ProjectTable } from '../../components/project-table/project-table';
import { ProjectPersonForm } from '../../components/project-person-form/project-person-form';
import { ProjectPersonTable } from '../../components/project-person-table/project-person-table';
import { ProjectsService } from '../../data/projects.service';
import { ProjectCallsService } from '../../../project-calls/data/project-calls.service';
import { ProjectTypesService } from '../../../project-types/data/project-types.service';
import { CoordinationService } from '../../../../configuration/professor-preload/data/coordination.service';
import { PreloadCallService } from '../../../../configuration/preload-call/data/preload-call.service';
import { ActivityTypesService } from '../../../activity-types/data/activity-types.service';
import {
  enrichProjectItem,
  ProjectFormData,
  ProjectItem,
  ProjectPersonFormData,
  ProjectPersonItem,
  resolveProjectTypeLimits,
} from '../../model/projects.model';
import { ProjectTypeItem } from '../../../project-types/model/project-types.model';
import { CoordinationItem } from '../../../../configuration/professor-preload/model/coordination.model';

type ProjectsView = 'projects' | 'products' | 'persons';

@Component({
  selector: 'app-projects',
  imports: [
    SectionFrame,
    Button,
    ProjectTable,
    ProjectForm,
    ProjectPersonTable,
    ProjectPersonForm,
    NewModal,
  ],
  templateUrl: './projects.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Projects implements OnInit, OnDestroy {
  private readonly projectsService = inject(ProjectsService);
  private readonly projectCallsService = inject(ProjectCallsService);
  private readonly projectTypesService = inject(ProjectTypesService);
  private readonly coordinationService = inject(CoordinationService);
  private readonly preloadCallService = inject(PreloadCallService);
  private readonly activityTypesService = inject(ActivityTypesService);
  private readonly breadcrumbTitle = inject(BreadcrumbTitle);

  readonly activeView = signal<ProjectsView>('projects');
  readonly parentProject = signal<ProjectItem | null>(null);

  readonly projects = signal<ProjectItem[]>([]);
  readonly products = signal<ProjectItem[]>([]);
  readonly persons = signal<ProjectPersonItem[]>([]);

  readonly selectedProjectIds = signal<string[]>([]);
  readonly selectedProductIds = signal<string[]>([]);
  readonly selectedPersonIds = signal<string[]>([]);

  readonly selectedProject = signal<ProjectItem | null>(null);
  readonly selectedPerson = signal<ProjectPersonItem | null>(null);

  readonly showForm = signal(false);
  readonly showDeleteModal = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly isLoading = signal(false);
  readonly idsToDelete = signal<number[]>([]);
  readonly deleteTarget = signal<'project' | 'person'>('project');

  private convocatoriaMap = new Map<number, string>();
  private tipoMap = new Map<number, string>();
  private coordinacionMap = new Map<number, string>();
  private activityTypeMap = new Map<number, string>();
  private projectTypesById = new Map<number, ProjectTypeItem>();

  readonly isProductsView = computed(() => this.activeView() === 'products');
  readonly isPersonsView = computed(() => this.activeView() === 'persons');

  readonly parentTypeLimits = computed(() => {
    const parent = this.parentProject();
    if (!parent) {
      return null;
    }

    return resolveProjectTypeLimits(
      this.projectTypesById.get(parent.idTipoProyecto),
    );
  });

  readonly participantsSoftAlert = computed(() => {
    if (!this.isPersonsView()) {
      return null;
    }

    const min = this.parentTypeLimits()?.minimoParticipantes;
    if (min == null) {
      return null;
    }

    const missing = min - this.persons().length;
    if (missing <= 0) {
      return null;
    }

    return `Faltan ${missing} para cumplir con el mínimo de participantes.`;
  });

  readonly productsSoftAlert = computed(() => {
    if (!this.isProductsView()) {
      return null;
    }

    const min = this.parentTypeLimits()?.minimoProductos;
    if (min == null) {
      return null;
    }

    const missing = min - this.products().length;
    if (missing <= 0) {
      return null;
    }

    return `Faltan ${missing} productos para cumplir con el mínimo requerido.`;
  });

  readonly canAddPerson = computed(() => {
    const max = this.parentTypeLimits()?.maximoParticipantes;
    if (max == null) {
      return true;
    }

    return this.persons().length < max;
  });

  readonly displayedProjects = computed(() =>
    this.isProductsView() ? this.products() : this.projects(),
  );

  readonly displayedSelectedIds = computed(() =>
    this.isProductsView()
      ? this.selectedProductIds()
      : this.selectedProjectIds(),
  );

  readonly nestedBannerTitle = computed(() => {
    const parent = this.parentProject()?.nombre ?? '';
    if (this.isProductsView()) {
      return `Productos de: ${parent}`;
    }
    if (this.isPersonsView()) {
      return `Personas de: ${parent}`;
    }
    return '';
  });

  readonly nestedBannerDescription = computed(() => {
    if (this.isProductsView()) {
      return 'Administra los productos del proyecto seleccionado.';
    }
    if (this.isPersonsView()) {
      return 'Administra las personas asociadas al proyecto seleccionado.';
    }
    return '';
  });

  readonly formTitle = computed(() =>
    this.isProductsView() ? 'Nuevo producto' : 'Nuevo proyecto',
  );

  readonly formEditTitle = computed(() =>
    this.isProductsView() ? 'Editar producto' : 'Editar proyecto',
  );

  readonly formDescription = computed(() =>
    this.isProductsView()
      ? 'Registra un producto asociado al proyecto padre.'
      : 'Registra la información básica del proyecto.',
  );

  readonly tableEmptyMessage = computed(() =>
    this.isProductsView()
      ? 'No hay productos registrados.'
      : 'No hay proyectos registrados.',
  );

  readonly tableSearchPlaceholder = computed(() =>
    this.isProductsView() ? 'Buscar producto...' : 'Buscar proyecto...',
  );

  readonly deleteModalTitle = computed(() => {
    if (this.deleteTarget() === 'person') {
      return this.idsToDelete().length > 1
        ? 'Eliminar personas'
        : 'Eliminar persona';
    }
    const label = this.isProductsView() ? 'producto' : 'proyecto';
    return this.idsToDelete().length > 1
      ? `Eliminar ${label}s`
      : `Eliminar ${label}`;
  });

  readonly deleteModalMessage = computed(() => {
    const count = this.idsToDelete().length;
    if (this.deleteTarget() === 'person') {
      if (count > 1) {
        return `¿Seguro que deseas eliminar las ${count} personas seleccionadas?`;
      }
      return `¿Seguro que deseas eliminar a "${this.selectedPerson()?.nombreCompleto ?? ''}"?`;
    }

    const label = this.isProductsView() ? 'producto' : 'proyecto';
    if (count > 1) {
      return `¿Seguro que deseas eliminar los ${count} ${label}s seleccionados?`;
    }
    return `¿Seguro que deseas eliminar el ${label} "${this.selectedProject()?.nombre ?? ''}"?`;
  });

  readonly deleteModalButtonText = computed(() =>
    this.isDeleting() ? 'Eliminando...' : 'Sí, eliminar',
  );

  async ngOnInit(): Promise<void> {
    this.breadcrumbTitle.setPageTitle('Proyectos');
    await this.loadCatalogMaps();
    await this.refreshProjects();
  }

  ngOnDestroy(): void {
    this.breadcrumbTitle.clearPageTitle();
  }

  backToProjects(): void {
    this.activeView.set('projects');
    this.parentProject.set(null);
    this.products.set([]);
    this.persons.set([]);
    this.selectedProductIds.set([]);
    this.selectedPersonIds.set([]);
    this.selectedProject.set(null);
    this.selectedPerson.set(null);
    this.showForm.set(false);
  }

  openCreateForm(): void {
    if (this.isPersonsView() && !this.canAddPerson()) {
      return;
    }

    this.selectedProject.set(null);
    this.selectedPerson.set(null);
    this.showForm.set(true);
  }

  openEditProject(project: ProjectItem): void {
    this.selectedProject.set(project);
    this.showForm.set(true);
  }

  openEditPerson(person: ProjectPersonItem): void {
    this.selectedPerson.set(person);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.selectedProject.set(null);
    this.selectedPerson.set(null);
  }

  async openProductsView(project: ProjectItem): Promise<void> {
    this.parentProject.set(project);
    this.activeView.set('products');
    this.showForm.set(false);
    this.selectedProject.set(null);
    this.selectedProductIds.set([]);
    await this.refreshProducts();
  }

  async openPersonsView(project: ProjectItem): Promise<void> {
    this.parentProject.set(project);
    this.activeView.set('persons');
    this.showForm.set(false);
    this.selectedPerson.set(null);
    this.selectedPersonIds.set([]);
    await this.refreshPersons();
  }

  async onSaveProject(payload: ProjectFormData): Promise<void> {
    this.isSaving.set(true);

    try {
      const selected = this.selectedProject();
      if (selected?.id) {
        await firstValueFrom(
          this.projectsService.updateProject(selected.id, payload),
        );
      } else {
        await firstValueFrom(this.projectsService.saveProject(payload));
      }

      this.closeForm();
      await this.refreshCurrentList();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  async onSavePerson(payload: ProjectPersonFormData): Promise<void> {
    this.isSaving.set(true);

    try {
      const selected = this.selectedPerson();
      if (selected?.id) {
        await firstValueFrom(
          this.projectsService.updateProjectPerson(selected.id, payload),
        );
      } else {
        await firstValueFrom(this.projectsService.saveProjectPerson(payload));
      }

      this.closeForm();
      await this.refreshPersons();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  requestDeleteProject(project: ProjectItem): void {
    this.deleteTarget.set('project');
    this.selectedProject.set(project);
    this.idsToDelete.set([project.id]);
    this.showDeleteModal.set(true);
  }

  requestBulkDeleteProjects(ids: number[]): void {
    if (!ids.length) {
      return;
    }
    this.deleteTarget.set('project');
    this.selectedProject.set(null);
    this.idsToDelete.set(ids);
    this.showDeleteModal.set(true);
  }

  requestDeletePerson(person: ProjectPersonItem): void {
    this.deleteTarget.set('person');
    this.selectedPerson.set(person);
    this.idsToDelete.set([person.id]);
    this.showDeleteModal.set(true);
  }

  requestBulkDeletePersons(ids: number[]): void {
    if (!ids.length) {
      return;
    }
    this.deleteTarget.set('person');
    this.selectedPerson.set(null);
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
      if (this.deleteTarget() === 'person') {
        await this.deletePersons(ids);
      } else {
        await this.deleteProjects(ids);
      }

      this.resetDeleteModalState();
      await this.refreshCurrentList();
    } catch (error) {
      console.error(error);
    } finally {
      this.isDeleting.set(false);
    }
  }

  onSelectedProjectIdsChange(ids: string[]): void {
    if (this.isProductsView()) {
      this.selectedProductIds.set(ids);
      return;
    }
    this.selectedProjectIds.set(ids);
  }

  onSelectedPersonIdsChange(ids: string[]): void {
    this.selectedPersonIds.set(ids);
  }

  async refreshCurrentList(): Promise<void> {
    if (this.isProductsView()) {
      await this.refreshProducts();
      return;
    }
    if (this.isPersonsView()) {
      await this.refreshPersons();
      return;
    }
    await this.refreshProjects();
  }

  async refreshProjects(): Promise<void> {
    this.isLoading.set(true);
    try {
      const rows = await firstValueFrom(this.projectsService.listProjects());
      this.projects.set(this.enrichProjects(rows ?? []));
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async refreshProducts(): Promise<void> {
    const parent = this.parentProject();
    if (!parent?.id) {
      return;
    }

    this.isLoading.set(true);
    try {
      const rows = await firstValueFrom(
        this.projectsService.listProducts(parent.id),
      );
      this.products.set(this.enrichProjects(rows ?? []));
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async refreshPersons(): Promise<void> {
    const parent = this.parentProject();
    if (!parent?.id) {
      return;
    }

    this.isLoading.set(true);
    try {
      const rows = await firstValueFrom(
        this.projectsService.listProjectPersons(parent.id),
      );
      this.persons.set(this.enrichPersons(rows ?? []));
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async deleteProjects(ids: number[]): Promise<void> {
    if (ids.length === 1) {
      await firstValueFrom(this.projectsService.deleteProject(ids[0]));
    } else {
      await firstValueFrom(
        this.projectsService.deleteBulkProjects({ ids }),
      );
    }

    if (this.isProductsView()) {
      this.selectedProductIds.set([]);
    } else {
      this.selectedProjectIds.set([]);
    }
  }

  private async deletePersons(ids: number[]): Promise<void> {
    if (ids.length === 1) {
      await firstValueFrom(this.projectsService.deleteProjectPerson(ids[0]));
    } else {
      await firstValueFrom(
        this.projectsService.deleteBulkProjectPersons({ ids }),
      );
    }
    this.selectedPersonIds.set([]);
  }

  private async loadCatalogMaps(): Promise<void> {
    try {
      const [calls, types, coordinations, activityTypes] = await Promise.all([
        firstValueFrom(this.projectCallsService.listProjectCalls()),
        firstValueFrom(this.projectTypesService.listProjectTypes()),
        this.loadCoordinationsCatalog(),
        firstValueFrom(this.activityTypesService.listActivityTypes()),
      ]);

      this.convocatoriaMap = new Map(
        (calls ?? []).map((item) => [item.id, item.nombre]),
      );
      this.projectTypesById = new Map(
        (types ?? []).map((item) => [item.id, item]),
      );
      this.tipoMap = new Map(
        (types ?? []).map((item) => [item.id, item.nombre]),
      );
      this.coordinacionMap = new Map(
        (coordinations ?? []).map((item) => [
          item.id,
          item.descripcion || item.nombre,
        ]),
      );
      this.activityTypeMap = new Map(
        (activityTypes ?? []).map((item) => [item.id, item.nombre]),
      );
    } catch (error) {
      console.error(error);
    }
  }

  private async loadCoordinationsCatalog(): Promise<CoordinationItem[]> {
    const periods = await firstValueFrom(
      this.preloadCallService.getUniversityPeriod(),
    );

    if (!periods?.length) {
      return [];
    }

    const lists = await Promise.all(
      periods.map((period) =>
        firstValueFrom(
          this.coordinationService.getCoordinations(period.id),
        ),
      ),
    );

    const byId = new Map<number, CoordinationItem>();

    lists.flat().forEach((item) => {
      byId.set(item.id, item);
    });

    return [...byId.values()];
  }

  private enrichProjects(rows: ProjectItem[]): ProjectItem[] {
    return rows.map((item) =>
      enrichProjectItem(
        item,
        this.convocatoriaMap,
        this.tipoMap,
        this.coordinacionMap,
      ),
    );
  }

  private enrichPersons(rows: ProjectPersonItem[]): ProjectPersonItem[] {
    return rows.map((item) => ({
      ...item,
      tipoActividad: {
        id: item.idTipoActividad,
        nombre:
          item.tipoActividad?.nombre ||
          this.activityTypeMap.get(item.idTipoActividad) ||
          '',
      },
    }));
  }

  private resetDeleteModalState(): void {
    this.showDeleteModal.set(false);
    this.idsToDelete.set([]);
    this.selectedProject.set(null);
    this.selectedPerson.set(null);
  }
}
