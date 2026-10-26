import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { BreadcrumbTitle } from '../../../../../core/service/breadcrumb-title';
import { SectionFrame } from '../../../../../shared/ui/section-frame/section-frame';
import { Icon } from '../../../../../shared/ui/icon/icon';
import type { AppIconName } from '../../../../../shared/ui/icon/icons';
import { NewModal } from '../../../../../shared/ui/new-modal/new-modal';
import { AssociationCoordinationForm } from '../../components/association-coordination/association-coordination-form/association-coordination-form';
import { AssociationCoordinationTable } from '../../components/association-coordination/association-coordination-table/association-coordination-table';
import { CoordinationAdministrationService } from '../../data/coordination-administration.service';
import { CostCenterAssignmentForm } from '../../components/cost-center-assignment/cost-center-assignment-form/cost-center-assignment-form';
import { CostCenterAssignmentTable } from '../../components/cost-center-assignment/cost-center-assignment-table/cost-center-assignment-table';
import { PersonCoordinationForm } from '../../components/person-coordination/person-coordination-form/person-coordination-form';
import { PersonCoordinationTable } from '../../components/person-coordination/person-coordination-table/person-coordination-table';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Button } from '../../../../../shared/ui/button/button';
import { CoordinationManagementForm } from '../../components/coordination-management/coordination-management-form/coordination-management-form';
import { CoordinationManagementTable } from '../../components/coordination-management/coordination-management-table/coordination-management-table';
import { Option, Select } from '../../../../../shared/components/form/select/select';
import {
  CatalogOptionItem,
  CoordinationAdministrationTabId,
  CoordinationAssociationFormData,
  CoordinationAssociationItem,
  SubjectCatalogOptionItem,
  CostCenterAssignmentFormData,
  CostCenterAssignmentItem,
  PersonCoordinationFormData,
  PersonCoordinationItem,
  PersonCoordinationKey,
  CoordinationManagementFormData,
  CoordinationManagementItem,
} from '../../model/coordination-administration.model';

type CoordinationSwitchItem = {
  id: CoordinationAdministrationTabId;
  label: string;
  icon: AppIconName;
};

@Component({
  selector: 'app-coordination-administration',
  imports: [ReactiveFormsModule, SectionFrame, AssociationCoordinationTable, AssociationCoordinationForm, NewModal, Icon, PersonCoordinationTable, PersonCoordinationForm, NewModal , Icon, Button, CoordinationManagementTable, CoordinationManagementForm],
  templateUrl: './coordination-administration.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinationAdministration implements OnInit {
  private readonly administrationService = inject(CoordinationAdministrationService);
  private readonly breadcrumbTitle = inject(BreadcrumbTitle);

  readonly switchItems: CoordinationSwitchItem[] = [
        {
            id: 'associationCoordinations',
            label: 'Asociar programa o materia',
            icon: 'adjustmentsHorizontal',
        },
        {
            id: 'people',
            label: 'Asociar coordinador',
            icon: 'user',
        },
        {
            id: 'careerProfessors',
            label: 'Docentes planta',
            icon: 'academicCap',
        },
  ];

   readonly selectedTab = signal<CoordinationAdministrationTabId>('associationCoordinations');

  readonly associations = signal<CoordinationAssociationItem[]>([]);
  readonly selectedAssociationIds = signal<string[]>([]);
  readonly selectedAssociation = signal<CoordinationAssociationItem | null>(null);

  readonly coordinations = signal<CatalogOptionItem[]>([]);
  readonly programs = signal<CatalogOptionItem[]>([]);
  readonly subjects = signal<SubjectCatalogOptionItem[]>([]);
  readonly costCenters = signal<CatalogOptionItem[]>([]);

  readonly showForm = signal(false);
  readonly isLoading = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  readonly showDeleteModal = signal(false);
  readonly idsToDelete = signal<number[]>([]);
  readonly associationToDelete = signal<CoordinationAssociationItem | null>(null);

  readonly selectedTabId = computed(() => this.selectedTab() as CoordinationAdministrationTabId);

  readonly costCenterAssignments = signal<CostCenterAssignmentItem[]>([]);
  readonly selectedCostCenterAssignmentIds = signal<string[]>([]);
  readonly selectedCostCenterAssignment = signal<CostCenterAssignmentItem | null>(null);

  readonly people = signal<CatalogOptionItem[]>([]);
  readonly plantProfessors = signal<CatalogOptionItem[]>([]);

  readonly peopleCoordinations = signal<PersonCoordinationItem[]>([]);
  readonly selectedPeopleCoordinationIds = signal<string[]>([]);
  readonly selectedPeopleCoordination = signal<PersonCoordinationItem | null>(null);

  readonly plantProfessorCoordinations = signal<PersonCoordinationItem[]>([]);
  readonly selectedPlantProfessorCoordinationIds = signal<string[]>([]);
  readonly selectedPlantProfessorCoordination = signal<PersonCoordinationItem | null>(null);

  readonly compositeKeysToDelete = signal<PersonCoordinationKey[]>([]);
  readonly deleteContext = signal<
  'associationCoordinations' | 'costCenters' | 'people' | 'careerProfessors'
  >('associationCoordinations');
  
  
  readonly deleteModalTitle = computed(() =>
    this.idsToDelete().length > 1 ? 'Eliminar asociaciones' : 'Eliminar asociación',
  );

  readonly deleteModalMessage = computed(() => {
    const count = this.idsToDelete().length;

    if (count > 1) {
      return `¿Seguro que deseas eliminar las ${count} asociaciones seleccionadas?`;
    }

    return `¿Seguro que deseas eliminar la asociación ${this.associationToDelete()?.coordinacion ?? ''}?`;
  });

    readonly coordinationFilterControl = new FormControl('', {
    nonNullable: true,
    });

    readonly appliedCoordinationFilterId = signal<number | null>(null);

    get coordinationFilterOptions(): Option[] {
    return this.coordinations().map((item) => ({
        value: String(item.id),
        label: item.label,
    }));
    }

    readonly filteredAssociations = computed(() => {
    const idCoordinacion = this.appliedCoordinationFilterId();

    if (idCoordinacion == null) {
        return [];
    }

    return this.associations().filter(
        (item) => Number(item.idCoordinacion) === idCoordinacion,
    );
    });

    readonly filteredCostCenterAssignments = computed(() => {
    const idCoordinacion = this.appliedCoordinationFilterId();

    if (idCoordinacion == null) {
        return [];
    }

    return this.costCenterAssignments().filter(
        (item) => Number(item.idCoordinacion) === idCoordinacion,
    );
    });

    readonly filteredPeopleCoordinations = computed(() => {
    const idCoordinacion = this.appliedCoordinationFilterId();

    if (idCoordinacion == null) {
        return [];
    }

    return this.peopleCoordinations().filter(
        (item) => Number(item.idCoordinacion) === idCoordinacion,
    );
    });

    readonly filteredPlantProfessorCoordinations = computed(() => {
    const idCoordinacion = this.appliedCoordinationFilterId();

    if (idCoordinacion == null) {
        return [];
    }

    return this.plantProfessorCoordinations().filter(
        (item) => Number(item.idCoordinacion) === idCoordinacion,
    );
    });  

    applyCoordinationFilter(): void {
    const value = this.coordinationFilterControl.value;

    if (!value) {
        this.appliedCoordinationFilterId.set(null);
        this.closeForm();
        return;
    }

    this.appliedCoordinationFilterId.set(Number(value));
    this.closeForm();

    this.selectedAssociationIds.set([]);
    this.selectedCostCenterAssignmentIds.set([]);
    this.selectedPeopleCoordinationIds.set([]);
    this.selectedPlantProfessorCoordinationIds.set([]);
    }  
    
    private hasCoordinationFilter(): boolean {
    return this.appliedCoordinationFilterId() != null;
    } 
    
    
    readonly canManageCurrentCoordination = computed(
    () => this.appliedCoordinationFilterId() != null,
    );

    readonly associationEmptyMessage = computed(() =>
    this.canManageCurrentCoordination()
        ? 'No hay asociaciones registradas.'
        : 'Seleccione una coordinación para continuar',
    );

    readonly costCenterEmptyMessage = computed(() =>
    this.canManageCurrentCoordination()
        ? 'No hay centros de costo asignados.'
        : 'Seleccione una coordinación para continuar',
    );

    readonly peopleEmptyMessage = computed(() =>
    this.canManageCurrentCoordination()
        ? 'No hay personas asociadas.'
        : 'Seleccione una coordinación para continuar',
    );

    readonly plantProfessorEmptyMessage = computed(() =>
    this.canManageCurrentCoordination()
        ? 'No hay docentes planta asociados.'
        : 'Seleccione una coordinación para continuar',
    );    

    readonly coordinationViewMode = signal<'parents' | 'children' | 'internal'>('parents');

    readonly managedCoordinations = signal<CoordinationManagementItem[]>([]);
    readonly childCoordinations = signal<CoordinationManagementItem[]>([]);

    readonly selectedManagedCoordinationIds = signal<string[]>([]);
    readonly selectedChildCoordinationIds = signal<string[]>([]);

    readonly selectedManagedCoordination = signal<CoordinationManagementItem | null>(null);
    readonly selectedParentCoordination = signal<CoordinationManagementItem | null>(null);
    readonly selectedInternalCoordination = signal<CoordinationManagementItem | null>(null);

    readonly showCoordinationForm = signal(false);
    readonly showCoordinationDeleteModal = signal(false);
    readonly coordinationIdsToDelete = signal<number[]>([]);

    readonly modalities = signal<CatalogOptionItem[]>([]);
    readonly methodologies = signal<CatalogOptionItem[]>([]);

    readonly isChildrenView = computed(() => this.coordinationViewMode() === 'children');
    readonly isInternalView = computed(() => this.coordinationViewMode() === 'internal');

    readonly isInternalParentCoordination = computed(() => {
    const coordination = this.selectedInternalCoordination();

    return coordination?.idCoordinacionPadre == null;
    });

    readonly isInternalParentAcademicCoordination = computed(() => {
        const coordination = this.selectedInternalCoordination();

        if (!coordination || !this.isInternalParentCoordination()) {
            return false;
        }

        const esAcademica = String(coordination.esAcademica ?? '')
            .trim()
            .toUpperCase();

        return ['1', 'S', 'SI', 'TRUE'].includes(esAcademica);
    });

    readonly displayedCoordinations = computed(() =>
    this.isChildrenView() ? this.childCoordinations() : this.managedCoordinations(),
    );

    readonly displayedCoordinationSelectedIds = computed(() =>
    this.isChildrenView()
        ? this.selectedChildCoordinationIds()
        : this.selectedManagedCoordinationIds(),
    );

    readonly coordinationTableEmptyMessage = computed(() =>
    this.isChildrenView()
        ? 'No hay coordinaciones hijas registradas.'
        : 'No hay coordinaciones padre registradas.',
    );

    readonly coordinationTableSearchPlaceholder = computed(() =>
    this.isChildrenView()
        ? 'Buscar coordinación hija...'
        : 'Buscar coordinación padre...',
    );

    readonly coordinationFormTitle = computed(() =>
    this.isChildrenView() ? 'Nueva coordinación hija' : 'Nueva coordinación padre',
    );

    readonly coordinationFormEditTitle = computed(() =>
    this.isChildrenView() ? 'Editar coordinación hija' : 'Editar coordinación padre',
    );

    readonly coordinationFormDescription = computed(() =>
    this.isChildrenView()
        ? `Registra una coordinación hija para ${this.selectedParentCoordination()?.nombre ?? ''}.`
        : 'Registra la información principal de la coordinación padre.',
    );

    readonly coordinationDeleteModalTitle = computed(() =>
    this.coordinationIdsToDelete().length > 1
        ? 'Eliminar coordinaciones'
        : 'Eliminar coordinación',
    );

    readonly coordinationDeleteModalMessage = computed(() => {
    const count = this.coordinationIdsToDelete().length;

    if (count > 1) {
        return `¿Seguro que deseas eliminar las ${count} coordinaciones seleccionadas?`;
    }

    return `¿Seguro que deseas eliminar la coordinación ${this.selectedManagedCoordination()?.nombre ?? ''}?`;
    });

    readonly internalCoordinationOptions = computed(() => {
    const current = this.selectedInternalCoordination();
    const options = [...this.coordinations()];

    if (current && !options.some((item) => Number(item.id) === current.id)) {
        options.unshift({
        id: current.id,
        label: current.nombre,
        codigo: current.codigo ?? null,
        });
    }

    return options;
    });


    async openChildrenView(coordination: CoordinationManagementItem): Promise<void> {
    this.selectedParentCoordination.set(coordination);
    this.selectedManagedCoordination.set(null);
    this.selectedChildCoordinationIds.set([]);
    this.showCoordinationForm.set(false);
    this.coordinationViewMode.set('children');

    await this.refreshChildCoordinations();
    }

    backToParentCoordinations(): void {
    this.coordinationViewMode.set('parents');
    this.selectedParentCoordination.set(null);
    this.selectedInternalCoordination.set(null);
    this.childCoordinations.set([]);
    this.selectedChildCoordinationIds.set([]);
    this.selectedManagedCoordination.set(null);
    this.showCoordinationForm.set(false);

    this.appliedCoordinationFilterId.set(null);
    this.closeForm();
    }

    openInternalConfiguration(coordination: CoordinationManagementItem): void {
    this.selectedInternalCoordination.set(coordination);
    this.selectedManagedCoordination.set(null);
    this.showCoordinationForm.set(false);

    this.coordinationViewMode.set('internal');

    this.appliedCoordinationFilterId.set(coordination.id);
    this.coordinationFilterControl.setValue(String(coordination.id), {
        emitEvent: false,
    });

    this.selectTab('associationCoordinations');
    this.closeForm();

    this.selectedAssociationIds.set([]);
    this.selectedPeopleCoordinationIds.set([]);
    this.selectedPlantProfessorCoordinationIds.set([]);
    }    

    openCreateCoordinationForm(): void {
    this.selectedManagedCoordination.set(null);
    this.showCoordinationForm.set(true);
    }

    openEditCoordinationForm(coordination: CoordinationManagementItem): void {
    this.selectedManagedCoordination.set(coordination);
    this.showCoordinationForm.set(true);
    }

    closeCoordinationForm(): void {
    this.showCoordinationForm.set(false);
    this.selectedManagedCoordination.set(null);
    }

    async onSaveCoordination(payload: CoordinationManagementFormData): Promise<void> {
    this.isSaving.set(true);

    try {
        const selected = this.selectedManagedCoordination();

        if (selected?.id) {
        await firstValueFrom(
            this.administrationService.updateCoordination(selected.id, payload),
        );
        } else if (this.isChildrenView() && this.selectedParentCoordination()?.id) {
        await firstValueFrom(
            this.administrationService.saveChildCoordination(
            this.selectedParentCoordination()!.id,
            payload,
            ),
        );
        } else {
        await firstValueFrom(
            this.administrationService.saveParentCoordination(payload),
        );
        }

        this.closeCoordinationForm();
        await this.refreshCurrentCoordinations();
    } catch (error) {
        console.error(error);
    } finally {
        this.isSaving.set(false);
    }
    }

    async refreshParentCoordinations(): Promise<void> {
    this.isLoading.set(true);

    try {
        const rows = await firstValueFrom(
        this.administrationService.listParentCoordinations(),
        );

        this.managedCoordinations.set(rows ?? []);
    } catch (error) {
        console.error(error);
    } finally {
        this.isLoading.set(false);
    }
    }

    async refreshChildCoordinations(): Promise<void> {
    const parent = this.selectedParentCoordination();

    if (!parent?.id) {
        return;
    }

    this.isLoading.set(true);

    try {
        const rows = await firstValueFrom(
        this.administrationService.listChildCoordinations(parent.id),
        );

        this.childCoordinations.set(rows ?? []);
    } catch (error) {
        console.error(error);
    } finally {
        this.isLoading.set(false);
    }
    }

    async refreshCurrentCoordinations(): Promise<void> {
    if (this.isChildrenView()) {
        await this.refreshChildCoordinations();
        return;
    }

    await this.refreshParentCoordinations();
    }

    onSelectedCoordinationIdsChange(ids: string[]): void {
    if (this.isChildrenView()) {
        this.selectedChildCoordinationIds.set(ids);
        return;
    }

    this.selectedManagedCoordinationIds.set(ids);
    }


    requestDeleteCoordination(coordination: CoordinationManagementItem): void {
    this.selectedManagedCoordination.set(coordination);
    this.coordinationIdsToDelete.set([coordination.id]);
    this.showCoordinationDeleteModal.set(true);
    }

    requestBulkDeleteCoordinations(ids: number[]): void {
    if (!ids.length) {
        return;
    }

    this.selectedManagedCoordination.set(null);
    this.coordinationIdsToDelete.set(ids);
    this.showCoordinationDeleteModal.set(true);
    }

    closeCoordinationDeleteModal(): void {
    this.showCoordinationDeleteModal.set(false);
    this.coordinationIdsToDelete.set([]);
    this.selectedManagedCoordination.set(null);
    }

    async confirmDeleteCoordination(): Promise<void> {
    const ids = this.coordinationIdsToDelete();

    if (!ids.length) {
        return;
    }

    this.isDeleting.set(true);

    try {
        if (ids.length === 1) {
        await firstValueFrom(
            this.administrationService.deleteCoordination(ids[0]),
        );
        } else {
        await firstValueFrom(
            this.administrationService.deleteBulkCoordinations({ ids }),
        );
        }

        if (this.isChildrenView()) {
        this.selectedChildCoordinationIds.set([]);
        } else {
        this.selectedManagedCoordinationIds.set([]);
        }

        this.closeCoordinationDeleteModal();
        await this.refreshCurrentCoordinations();
    } catch (error) {
        console.error(error);
    } finally {
        this.isDeleting.set(false);
    }
    }    



  async ngOnInit(): Promise<void> {
    this.breadcrumbTitle.setPageTitle('Coordinaciones');
    await this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.isLoading.set(true);

    try {
      const [
        catalogs,
        associations,
        peopleCoordinations,
        plantProfessorCoordinations,
        coordinationCatalogs,
        parentCoordinations,
        ] = await Promise.all([
        firstValueFrom(this.administrationService.getCatalogs()),
        firstValueFrom(this.administrationService.listAssociations()),
        firstValueFrom(this.administrationService.listPeopleCoordinations()),
        firstValueFrom(this.administrationService.listPlantProfessorCoordinations()),
        firstValueFrom(this.administrationService.getCoordinationCatalogs()),
        firstValueFrom(this.administrationService.listParentCoordinations()),
      ]);

      this.coordinations.set(catalogs.coordinaciones ?? []);
      this.programs.set(catalogs.programas ?? []);
      this.subjects.set(catalogs.materias ?? []);
      this.costCenters.set(catalogs.centrosCosto ?? []);
      this.associations.set(associations ?? []);
      //this.costCenterAssignments.set(costCenterAssignments ?? []);
      this.people.set(catalogs.personas ?? []);
      this.plantProfessors.set(catalogs.docentes ?? []);
      this.peopleCoordinations.set(peopleCoordinations ?? []);
      this.plantProfessorCoordinations.set(plantProfessorCoordinations ?? []);
      this.modalities.set(coordinationCatalogs.modalidades ?? []);
      this.methodologies.set(coordinationCatalogs.metodologias ?? []);
      this.managedCoordinations.set(parentCoordinations ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  selectTab(tabId: CoordinationAdministrationTabId): void {
    this.selectedTab.set(tabId);
    this.closeForm();
   }

  openCreateForm(): void {
    if (!this.hasCoordinationFilter()) {
        return;
    }

    this.selectedAssociation.set(null);
    this.showForm.set(true);
  }

  openEditForm(association: CoordinationAssociationItem): void {
    this.selectedAssociation.set(association);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
    this.selectedAssociation.set(null);
    this.selectedCostCenterAssignment.set(null);
    this.selectedPeopleCoordination.set(null);
    this.selectedPlantProfessorCoordination.set(null);
   }
   

  async onSaveAssociation(payload: CoordinationAssociationFormData): Promise<void> {
    this.isSaving.set(true);

    try {
      const selected = this.selectedAssociation();

      if (selected?.id) {
        await firstValueFrom(this.administrationService.updateAssociation(selected.id, payload));
      } else {
        await firstValueFrom(this.administrationService.saveAssociation(payload));
      }

      this.closeForm();
      await this.refreshAssociations();
    } catch (error) {
      console.error(error);
    } finally {
      this.isSaving.set(false);
    }
  }

  requestDeleteAssociation(association: CoordinationAssociationItem): void {
    this.deleteContext.set('associationCoordinations');
    this.associationToDelete.set(association);
    this.idsToDelete.set([association.id]);
    this.compositeKeysToDelete.set([]);
    this.showDeleteModal.set(true);
  }

  requestBulkDelete(ids: number[]): void {
    if (!ids.length) {
      return;
    }

    this.associationToDelete.set(null);
    this.idsToDelete.set(ids);
    this.showDeleteModal.set(true);
  }

  closeDeleteModal(): void {
    this.showDeleteModal.set(false);
    this.idsToDelete.set([]);
    this.associationToDelete.set(null);
  }

    async confirmDelete(): Promise<void> {
        this.isDeleting.set(true);

        try {
            if (this.deleteContext() === 'people') {
            const registros = this.compositeKeysToDelete();

            if (!registros.length) {
                return;
            }

            if (registros.length === 1) {
                await firstValueFrom(
                this.administrationService.deletePeopleCoordination(
                    registros[0].idPersonaGeneral,
                    registros[0].idCoordinacion,
                ),
                );
            } else {
                await firstValueFrom(
                this.administrationService.deleteBulkPeopleCoordinations({
                    registros,
                }),
                );
            }

            this.selectedPeopleCoordinationIds.set([]);
            this.compositeKeysToDelete.set([]);
            this.closeDeleteModal();
            await this.refreshPeopleCoordinations();
            return;
            }

            if (this.deleteContext() === 'careerProfessors') {
            const registros = this.compositeKeysToDelete();

            if (!registros.length) {
                return;
            }

            if (registros.length === 1) {
                await firstValueFrom(
                this.administrationService.deletePlantProfessorCoordination(
                    registros[0].idPersonaGeneral,
                    registros[0].idCoordinacion,
                ),
                );
            } else {
                await firstValueFrom(
                this.administrationService.deleteBulkPlantProfessorCoordinations({
                    registros,
                }),
                );
            }

            this.selectedPlantProfessorCoordinationIds.set([]);
            this.compositeKeysToDelete.set([]);
            this.closeDeleteModal();
            await this.refreshPlantProfessorCoordinations();
            return;
            }

            const ids = this.idsToDelete();

            if (!ids.length) {
            return;
            }

            if (this.deleteContext() === 'costCenters') {
            if (ids.length === 1) {
                await firstValueFrom(
                this.administrationService.deleteCostCenterAssignment(ids[0]),
                );
            } else {
                await firstValueFrom(
                this.administrationService.deleteBulkCostCenterAssignments({ ids }),
                );
            }

            this.selectedCostCenterAssignmentIds.set([]);
            this.closeDeleteModal();
            await this.refreshCostCenterAssignments();
            return;
            }

            if (ids.length === 1) {
            await firstValueFrom(
                this.administrationService.deleteAssociation(ids[0]),
            );
            } else {
            await firstValueFrom(
                this.administrationService.deleteBulk({ ids }),
            );
            }

            this.selectedAssociationIds.set([]);
            this.closeDeleteModal();
            await this.refreshAssociations();
        } catch (error) {
            console.error(error);
        } finally {
            this.isDeleting.set(false);
        }
    }

  async refreshAssociations(): Promise<void> {
    this.isLoading.set(true);

    try {
      const associations = await firstValueFrom(this.administrationService.listAssociations());
      this.associations.set(associations ?? []);
    } catch (error) {
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  openCreateCostCenterForm(): void {
    if (!this.hasCoordinationFilter()) {
        return;
    }

    this.selectedCostCenterAssignment.set(null);
    this.showForm.set(true);
    }

    openEditCostCenterForm(assignment: CostCenterAssignmentItem): void {
    this.selectedCostCenterAssignment.set(assignment);
    this.showForm.set(true);
    }

    async onSaveCostCenterAssignment(payload: CostCenterAssignmentFormData): Promise<void> {
    this.isSaving.set(true);

    try {
        const selected = this.selectedCostCenterAssignment();

        if (selected?.id) {
        await firstValueFrom(
            this.administrationService.updateCostCenterAssignment(selected.id, payload),
        );
        } else {
        await firstValueFrom(
            this.administrationService.saveCostCenterAssignment(payload),
        );
        }

        this.closeForm();
        await this.refreshCostCenterAssignments();
    } catch (error) {
        console.error(error);
    } finally {
        this.isSaving.set(false);
    }
    }

    async refreshCostCenterAssignments(): Promise<void> {
    this.isLoading.set(true);

    try {
        const assignments = await firstValueFrom(
        this.administrationService.listCostCenterAssignments(),
        );

        this.costCenterAssignments.set(assignments ?? []);
    } catch (error) {
        console.error(error);
    } finally {
        this.isLoading.set(false);
    }
    }

    requestDeleteCostCenterAssignment(assignment: CostCenterAssignmentItem): void {
        this.deleteContext.set('costCenters');
        this.associationToDelete.set(null);
        this.selectedCostCenterAssignment.set(assignment);
        this.idsToDelete.set([assignment.id]);
        this.compositeKeysToDelete.set([]);
        this.showDeleteModal.set(true);
    }

    requestBulkDeleteCostCenters(ids: number[]): void {
    if (!ids.length) {
        return;
    }

    this.associationToDelete.set(null);
    this.selectedCostCenterAssignment.set(null);
    this.idsToDelete.set(ids);
    this.showDeleteModal.set(true);
    }

    openCreatePeopleForm(): void {
    if (!this.hasCoordinationFilter()) {
     return;
    }
        
    this.selectedPeopleCoordination.set(null);
    this.showForm.set(true);
    }

    openEditPeopleForm(item: PersonCoordinationItem): void {
    this.selectedPeopleCoordination.set(item);
    this.showForm.set(true);
    }

    async onSavePeopleCoordination(payload: PersonCoordinationFormData): Promise<void> {
    this.isSaving.set(true);

    try {
        const selected = this.selectedPeopleCoordination();

        if (selected) {
        await firstValueFrom(
            this.administrationService.updatePeopleCoordination(
            selected.idPersonaGeneral,
            selected.idCoordinacion,
            payload,
            ),
        );
        } else {
        await firstValueFrom(this.administrationService.savePeopleCoordination(payload));
        }

        this.closeForm();
        await this.refreshPeopleCoordinations();
    } catch (error) {
        console.error(error);
    } finally {
        this.isSaving.set(false);
    }
    }

    async refreshPeopleCoordinations(): Promise<void> {
    this.isLoading.set(true);

    try {
        const rows = await firstValueFrom(this.administrationService.listPeopleCoordinations());
        this.peopleCoordinations.set(rows ?? []);
    } catch (error) {
        console.error(error);
    } finally {
        this.isLoading.set(false);
    }
    }

    requestDeletePeopleCoordination(item: PersonCoordinationItem): void {
    this.deleteContext.set('people');
    this.compositeKeysToDelete.set([
        {
        idPersonaGeneral: item.idPersonaGeneral,
        idCoordinacion: item.idCoordinacion,
        },
    ]);
    this.showDeleteModal.set(true);
    }

    requestBulkDeletePeople(keys: PersonCoordinationKey[]): void {
    if (!keys.length) {
        return;
    }

    this.deleteContext.set('people');
    this.compositeKeysToDelete.set(keys);
    this.showDeleteModal.set(true);
    }

    openCreatePlantProfessorForm(): void {

    if (!this.hasCoordinationFilter()) {
        return;
    }    

    this.selectedPlantProfessorCoordination.set(null);
    this.showForm.set(true);
    }

    openEditPlantProfessorForm(item: PersonCoordinationItem): void {
    this.selectedPlantProfessorCoordination.set(item);
    this.showForm.set(true);
    }

    async onSavePlantProfessorCoordination(payload: PersonCoordinationFormData): Promise<void> {
    this.isSaving.set(true);

    try {
        const selected = this.selectedPlantProfessorCoordination();

        if (selected) {
        await firstValueFrom(
            this.administrationService.updatePlantProfessorCoordination(
            selected.idPersonaGeneral,
            selected.idCoordinacion,
            payload,
            ),
        );
        } else {
        await firstValueFrom(
            this.administrationService.savePlantProfessorCoordination(payload),
        );
        }

        this.closeForm();
        await this.refreshPlantProfessorCoordinations();
    } catch (error) {
        console.error(error);
    } finally {
        this.isSaving.set(false);
    }
    }

    async refreshPlantProfessorCoordinations(): Promise<void> {
    this.isLoading.set(true);

    try {
        const rows = await firstValueFrom(
        this.administrationService.listPlantProfessorCoordinations(),
        );
        this.plantProfessorCoordinations.set(rows ?? []);
    } catch (error) {
        console.error(error);
    } finally {
        this.isLoading.set(false);
    }
    }

    requestDeletePlantProfessorCoordination(item: PersonCoordinationItem): void {
    this.deleteContext.set('careerProfessors');
    this.compositeKeysToDelete.set([
        {
        idPersonaGeneral: item.idPersonaGeneral,
        idCoordinacion: item.idCoordinacion,
        },
    ]);
    this.showDeleteModal.set(true);
    }

    requestBulkDeletePlantProfessors(keys: PersonCoordinationKey[]): void {
    if (!keys.length) {
        return;
    }

    this.deleteContext.set('careerProfessors');
    this.compositeKeysToDelete.set(keys);
    this.showDeleteModal.set(true);
    }    


  
}