/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Adaptación del módulo para la administración general de proyectos y participantes
 * 10/11/2026 - Leonel Antonio Perez Rios - Migración a TreeTable unificando proyectos y subproyectos en árbol jerárquico
 * 10/11/2026 - Leonel Antonio Perez Rios - Refactorización completa de código limpio, sin elementos en desuso y separación modular
 */
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
import { ActivityTypesService } from '../../../activity-types/data/activity-types.service';
import {
  enrichProjectItem,
  ProjectFormData,
  ProjectItem,
  ProjectPersonFormData,
  ProjectPersonItem,
} from '../../model/projects.model';

type ProjectsView = 'projects' | 'persons';
type DeleteTarget = 'project' | 'person';

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
  private readonly activityTypesService = inject(ActivityTypesService);
  private readonly breadcrumbTitle = inject(BreadcrumbTitle);

  readonly activeView = signal<ProjectsView>('projects');
  readonly parentProject = signal<ProjectItem | null>(null);

  readonly projects = signal<ProjectItem[]>([]);
  readonly persons = signal<ProjectPersonItem[]>([]);

  readonly selectedProjectIds = signal<string[]>([]);
  readonly selectedPersonIds = signal<string[]>([]);

  readonly selectedProject = signal<ProjectItem | null>(null);
  readonly selectedPerson = signal<ProjectPersonItem | null>(null);

  readonly showForm = signal(false);
  readonly showDeleteModal = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly idsToDelete = signal<number[]>([]);
  readonly deleteTarget = signal<DeleteTarget>('project');

  private activityTypeMap = new Map<number, string>();

  readonly isPersonsView = computed(() => this.activeView() === 'persons');
  readonly isSubprojectMode = computed(() => this.parentProject() != null);

  readonly formTitle = computed(() =>
    this.isSubprojectMode() ? 'Nuevo subproyecto' : 'Nuevo proyecto',
  );

  readonly formEditTitle = computed(() =>
    this.isSubprojectMode() ? 'Editar subproyecto' : 'Editar proyecto',
  );

  readonly formDescription = computed(() =>
    this.isSubprojectMode()
      ? 'Registra un subproyecto asociado al proyecto principal.'
      : 'Registra la información básica del proyecto.',
  );

  readonly deleteModalTitle = computed(() => {
    if (this.deleteTarget() === 'person') {
      return this.idsToDelete().length > 1
        ? 'Eliminar participantes'
        : 'Eliminar participante';
    }
    const isSubproject = this.selectedProject()?.idProyectoPadre != null;
    const label = isSubproject ? 'subproyecto' : 'proyecto';
    return this.idsToDelete().length > 1
      ? `Eliminar ${label}s`
      : `Eliminar ${label}`;
  });

  readonly deleteModalMessage = computed(() => {
    const count = this.idsToDelete().length;
    if (this.deleteTarget() === 'person') {
      if (count > 1) {
        return `¿Seguro que deseas eliminar los ${count} participantes seleccionados?`;
      }
      return `¿Seguro que deseas eliminar a "${this.selectedPerson()?.nombreCompleto ?? ''}"?`;
    }

    const isSubproject = this.selectedProject()?.idProyectoPadre != null;
    const label = isSubproject ? 'subproyecto' : 'proyecto';
    if (count > 1) {
      return `¿Seguro que deseas eliminar los ${count} registros seleccionados?`;
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
    this.persons.set([]);
    this.selectedPersonIds.set([]);
    this.selectedProject.set(null);
    this.selectedPerson.set(null);
    this.showForm.set(false);
  }

  openCreateProject(): void {
    this.parentProject.set(null);
    this.selectedProject.set(null);
    this.selectedPerson.set(null);
    this.showForm.set(true);
  }

  openCreateSubproject(parent: ProjectItem): void {
    this.parentProject.set(parent);
    this.selectedProject.set(null);
    this.selectedPerson.set(null);
    this.showForm.set(true);
  }

  openCreatePerson(): void {
    this.selectedPerson.set(null);
    this.showForm.set(true);
  }

  openEditProject(project: ProjectItem): void {
    this.selectedProject.set(project);
    if (project.idProyectoPadre) {
      const parent = this.projects().find((p) => p.id === project.idProyectoPadre) ?? null;
      this.parentProject.set(parent);
    } else {
      this.parentProject.set(null);
    }
    this.showForm.set(true);
  }

  openEditPerson(person: ProjectPersonItem): void {
    this.selectedPerson.set(person);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.selectedPerson.set(null);
    if (!this.isPersonsView()) {
      this.selectedProject.set(null);
      this.parentProject.set(null);
    }
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
    this.selectedProjectIds.set(ids);
  }

  onSelectedPersonIdsChange(ids: string[]): void {
    this.selectedPersonIds.set(ids);
  }

  async refreshCurrentList(): Promise<void> {
    if (this.isPersonsView()) {
      await this.refreshPersons();
      return;
    }
    await this.refreshProjects();
  }

  async refreshProjects(): Promise<void> {
    try {
      const rows = await firstValueFrom(this.projectsService.listAllProjects());
      this.projects.set(this.enrichProjects(rows ?? []));
    } catch (error) {
      console.error(error);
    }
  }

  async refreshPersons(): Promise<void> {
    const parent = this.parentProject();
    if (!parent?.id) {
      return;
    }

    try {
      const rows = await firstValueFrom(
        this.projectsService.listProjectPersons(parent.id),
      );
      this.persons.set(this.enrichPersons(rows ?? []));
    } catch (error) {
      console.error(error);
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
    this.selectedProjectIds.set([]);
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
      const activityTypes = await firstValueFrom(
        this.activityTypesService.listActivityTypes(),
      );

      this.activityTypeMap = new Map(
        (activityTypes ?? []).map((item) => [item.id, item.nombre]),
      );
    } catch (error) {
      console.error(error);
    }
  }

  private enrichProjects(rows: ProjectItem[]): ProjectItem[] {
    return rows.map((item) =>
      enrichProjectItem(
        item,
        this.activityTypeMap,
      ),
    );
  }

  private enrichPersons(rows: ProjectPersonItem[]): ProjectPersonItem[] {
    return rows.map((item) => ({
      ...item,
      tipoActividad: {
        id: item.idTipoActividad ?? 0,
        nombre:
          item.tipoActividad?.nombre ||
          (item.idTipoActividad ? this.activityTypeMap.get(item.idTipoActividad) : '') ||
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
