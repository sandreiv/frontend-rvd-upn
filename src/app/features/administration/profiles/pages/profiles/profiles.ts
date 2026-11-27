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

import { ProfilesForm } from '../../components/profiles-form/profiles-form';

import { ProfileStatesForm } from '../../components/profile-states-form/profile-states-form';

import { ProfilePersonsForm } from '../../components/profile-persons-form/profile-persons-form';

import { StatesService } from '../../../states/data/states.service';

import { StateItem } from '../../../states/model/states.model';

import { ProfilesTable } from '../../components/profiles-table/profiles-table';

import { ProfilesService } from '../../data/profiles.service';

import {
  ProfileFormData,
  ProfileItem,
  ProfileStatesFormData,
  ProfilePersonItem,
  ProfilePersonsFormData,
} from '../../model/profiles.model';

@Component({
  selector: 'app-profiles',
  standalone: true,
  imports: [
    SectionFrame,
    ProfilesTable,
    ProfilesForm,
    ProfileStatesForm,
    ProfilePersonsForm,
    NewModal,
  ],
  templateUrl: './profiles.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Profiles implements OnInit, OnDestroy {

  private readonly profilesService =
    inject(ProfilesService);

  private readonly statesService =
    inject(StatesService);  

  private readonly breadcrumbTitle =
    inject(BreadcrumbTitle);

  /**
   * Información de la tabla.
   */
  readonly profiles = signal<ProfileItem[]>([]);

  readonly selectedProfileIds = signal<string[]>([]);

  readonly selectedProfile =
    signal<ProfileItem | null>(null);

  /**
   * Control de las vistas.
   */
  readonly showForm = signal(false);

  /**
     * Perfil seleccionado para asociar estados.
     */
    readonly statesProfile =
    signal<ProfileItem | null>(null);

    /**
     * Catálogo general de estados.
     */
    readonly availableStates =
    signal<StateItem[]>([]);

    /**
     * Estados relacionados previamente.
     */
    readonly initialProfileStates =
    signal<StateItem[]>([]);

    /**
     * Control de operaciones.
     */
    readonly isLoadingProfileStates =
    signal(false);

    readonly isSavingProfileStates =
    signal(false);

    readonly profileStatesLoaded =
    signal(false);

    readonly profileStatesError =
    signal('');

    /**
     * Control de consultas pendientes.
     */
    private profileStatesRequestId = 0;

  /**
     * Perfil seleccionado para relacionar personas.
     */
    readonly personsProfile =
    signal<ProfileItem | null>(null);

    /**
     * Personas previamente relacionadas.
     */
    readonly initialProfilePersons =
    signal<ProfilePersonItem[]>([]);

    /**
     * Control de operaciones.
     */
    readonly isLoadingProfilePersons =
    signal(false);

    readonly isSavingProfilePersons =
    signal(false);

    readonly profilePersonsLoaded =
    signal(false);

    readonly profilePersonsError =
    signal('');

    /**
     * Control de solicitudes pendientes.
     */
    private profilePersonsRequestId = 0;  

  readonly showDeleteModal = signal(false);

  /**
   * Control de operaciones.
   */
  readonly isLoading = signal(false);

  readonly isSaving = signal(false);

  readonly isDeleting = signal(false);

  /**
   * Identificadores pendientes de eliminar.
   */
  readonly idsToDelete = signal<number[]>([]);

  /**
   * Mensajes de error.
   */
  readonly errorMessage = signal('');

  /**
   * Título dinámico del modal.
   */
  readonly deleteModalTitle = computed(() =>

    this.idsToDelete().length > 1
      ? 'Eliminar perfiles'
      : 'Eliminar perfil',

  );

  /**
   * Mensaje dinámico del modal.
   */
  readonly deleteModalMessage = computed(() => {

    const count = this.idsToDelete().length;

    if (count > 1) {

      return `¿Seguro que deseas eliminar los ${count} perfiles seleccionados?`;
    }

    const name = this.selectedProfile()?.nombre;

    return name

      ? `¿Seguro que deseas eliminar el perfil "${name}"?`

      : '¿Seguro que deseas eliminar el perfil seleccionado?';

  });

  /**
   * Texto del botón de confirmación.
   */
  readonly deleteModalButtonText = computed(() =>

    this.isDeleting()
      ? 'Eliminando...'
      : 'Sí, eliminar',

  );

  /**
   * Inicialización de la página.
   */
  async ngOnInit(): Promise<void> {

    this.breadcrumbTitle.setPageTitle('Perfiles');

    await this.refreshProfiles();
  }

  ngOnDestroy(): void {

    this.breadcrumbTitle.clearPageTitle();
  }

  /**
   * Abrir formulario de creación.
   */
  openCreateForm(): void {

    this.errorMessage.set('');

    this.selectedProfile.set(null);

    this.showForm.set(true);
  }

  /**
   * Abrir formulario de edición.
   */
  openEditForm(profile: ProfileItem): void {

    this.errorMessage.set('');

    this.selectedProfile.set(profile);

    this.showForm.set(true);
  }

  /**
   * Cerrar formulario.
   */
  closeForm(): void {

    if (this.isSaving()) {
      return;
    }

    this.resetForm();
  }

  private resetForm(): void {

    this.showForm.set(false);

    this.selectedProfile.set(null);

    this.errorMessage.set('');
  }

  /**
   * Crear o actualizar perfil.
   */
  async onSaveProfile(
    payload: ProfileFormData,
  ): Promise<void> {

    if (this.isSaving()) {
      return;
    }

    this.isSaving.set(true);

    this.errorMessage.set('');

    try {

      const selected = this.selectedProfile();

      if (selected?.id) {

        await firstValueFrom(
          this.profilesService.updateProfile(
            selected.id,
            payload,
          ),
        );

      } else {

        await firstValueFrom(
          this.profilesService.saveProfile(payload),
        );
      }

      this.resetForm();

      await this.refreshProfiles();

    } catch (error) {

      console.error(error);

      this.errorMessage.set(
        'No fue posible guardar el perfil. Verifica la información e intenta nuevamente.',
      );

    } finally {

      this.isSaving.set(false);
    }
  }

  /**
   * Solicitar eliminación individual.
   */
  requestDeleteProfile(profile: ProfileItem): void {

    this.errorMessage.set('');

    this.selectedProfile.set(profile);

    this.idsToDelete.set([profile.id]);

    this.showDeleteModal.set(true);
  }

  /**
   * Solicitar eliminación múltiple.
   */
  requestBulkDelete(ids: number[]): void {

    if (!ids.length) {
      return;
    }

    this.errorMessage.set('');

    this.selectedProfile.set(

      ids.length === 1

        ? this.profiles().find(
            (profile) => profile.id === ids[0],
          ) ?? null

        : null,

    );

    this.idsToDelete.set(ids);

    this.showDeleteModal.set(true);
  }

  /**
   * Cancelar la eliminación.
   */
  closeDeleteModal(): void {

    if (this.isDeleting()) {
      return;
    }

    this.resetDeleteModalState();
  }

  /**
   * Confirmar la eliminación.
   */
  async confirmDelete(): Promise<void> {

    const ids = this.idsToDelete();

    if (!ids.length || this.isDeleting()) {

      return;
    }

    this.isDeleting.set(true);

    this.errorMessage.set('');

    try {

      if (ids.length === 1) {

        await firstValueFrom(
          this.profilesService.deleteProfile(ids[0]),
        );

      } else {

        await firstValueFrom(
          this.profilesService.deleteProfiles(ids),
        );
      }

      this.selectedProfileIds.set([]);

      this.resetDeleteModalState();

      await this.refreshProfiles();

    } catch (error) {

      console.error(error);

      this.resetDeleteModalState();

      this.errorMessage.set(
        'No fue posible eliminar los perfiles seleccionados. Verifica que no tengan registros asociados.',
      );

    } finally {

      this.isDeleting.set(false);
    }
  }

  /**
   * Actualizar selección de perfiles.
   */
  onSelectedIdsChange(ids: string[]): void {

    this.selectedProfileIds.set(ids);
  }

  /**
   * Consultar perfiles desde el backend.
   */
  async refreshProfiles(): Promise<void> {

    if (this.isLoading()) {
      return;
    }

    this.isLoading.set(true);

    this.errorMessage.set('');

    try {

      const rows = await firstValueFrom(
        this.profilesService.listProfiles(),
      );

      this.profiles.set(rows ?? []);

      this.selectedProfileIds.set([]);

    } catch (error) {

      console.error(error);

      this.errorMessage.set(
        'No fue posible consultar los perfiles registrados.',
      );

    } finally {

      this.isLoading.set(false);
    }
  }

  /**
   * Limpiar la información del modal.
   */
  private resetDeleteModalState(): void {

    this.showDeleteModal.set(false);

    this.idsToDelete.set([]);

    this.selectedProfile.set(null);
  }

  /**
     * Abrir formulario de asociación de estados.
     */
    async openProfileStatesForm(
    profile: ProfileItem,
    ): Promise<void> {

    const requestId = ++this.profileStatesRequestId;

    this.errorMessage.set('');

    this.profileStatesError.set('');

    this.availableStates.set([]);

    this.initialProfileStates.set([]);

    this.profileStatesLoaded.set(false);

    this.isLoadingProfileStates.set(true);

    this.statesProfile.set(profile);

    try {

        // Consultar simultáneamente el catálogo
        // y los estados relacionados con el perfil.

        const [states, associatedStates] =
        await Promise.all([

            firstValueFrom(
            this.statesService.listStates(),
            ),

            firstValueFrom(
            this.profilesService.listProfileStates(
                profile.id,
            ),
            ),

        ]);

        // Ignorar respuestas de formularios cancelados.

        if (requestId !== this.profileStatesRequestId) {

        return;
        }

        this.availableStates.set(states ?? []);

        this.initialProfileStates.set(
        associatedStates ?? [],
        );

        this.profileStatesLoaded.set(true);

    } catch (error) {

        if (requestId !== this.profileStatesRequestId) {

        return;
        }

        console.error(error);

        this.profileStatesError.set(

        'No fue posible consultar los estados asociados al perfil. Cancela e intenta nuevamente.',

        );

    } finally {

        if (requestId === this.profileStatesRequestId) {

        this.isLoadingProfileStates.set(false);
        }
    }
    }

  /**
     * Cancelar la asociación de estados.
     */
    closeProfileStatesForm(): void {

    if (this.isSavingProfileStates()) {

        return;
    }

    this.resetProfileStatesForm();
    }
    
  /**
     * Limpiar la información del formulario.
     */
    private resetProfileStatesForm(): void {

    // Invalidar consultas anteriores.

    this.profileStatesRequestId++;

    this.statesProfile.set(null);

    this.availableStates.set([]);

    this.initialProfileStates.set([]);

    this.profileStatesError.set('');

    this.profileStatesLoaded.set(false);

    this.isLoadingProfileStates.set(false);
    }  

  /**
     * Guardar los estados asociados al perfil.
     */
    async onSaveProfileStates(
    payload: ProfileStatesFormData,
    ): Promise<void> {

    const profile = this.statesProfile();

    if (
        !profile ||
        this.isSavingProfileStates() ||
        this.isLoadingProfileStates() ||
        !this.profileStatesLoaded()
    ) {

        return;
    }

    this.isSavingProfileStates.set(true);

    this.profileStatesError.set('');

    try {

        await firstValueFrom(

        this.profilesService.saveProfileStates(

            profile.id,

            payload,

        ),

        );

        this.resetProfileStatesForm();

    } catch (error) {

        console.error(error);

        this.profileStatesError.set(

        'No fue posible guardar los estados asociados al perfil.',

        );

    } finally {

        this.isSavingProfileStates.set(false);
    }
    } 
    
    /**
     * Abrir formulario de asociación de personas.
     */
    async openProfilePersonsForm(
    profile: ProfileItem,
    ): Promise<void> {

    const requestId =
        ++this.profilePersonsRequestId;

    this.errorMessage.set('');

    this.profilePersonsError.set('');

    this.initialProfilePersons.set([]);

    this.profilePersonsLoaded.set(false);

    this.isLoadingProfilePersons.set(true);

    this.personsProfile.set(profile);

    try {

        const persons = await firstValueFrom(

        this.profilesService.listProfilePersons(

            profile.id,

        ),

        );

        // Ignorar respuestas de formularios
        // que ya fueron cancelados.

        if (
        requestId !== this.profilePersonsRequestId
        ) {

        return;
        }

        this.initialProfilePersons.set(

        persons ?? [],

        );

        this.profilePersonsLoaded.set(true);

    } catch (error) {

        if (
        requestId !== this.profilePersonsRequestId
        ) {

        return;
        }

        console.error(error);

        this.profilePersonsError.set(

        'No fue posible consultar las personas asociadas al perfil. Cancela e intenta nuevamente.',

        );

    } finally {

        if (
        requestId === this.profilePersonsRequestId
        ) {

        this.isLoadingProfilePersons.set(false);
        }
    }
    }

    /**
     * Cancelar la asociación de personas.
     */
    closeProfilePersonsForm(): void {

    if (this.isSavingProfilePersons()) {

        return;
    }

    this.resetProfilePersonsForm();
    }

    /**
     * Limpiar el formulario de personas.
     */
    private resetProfilePersonsForm(): void {

    // Invalidar solicitudes anteriores.

    this.profilePersonsRequestId++;

    this.personsProfile.set(null);

    this.initialProfilePersons.set([]);

    this.profilePersonsError.set('');

    this.profilePersonsLoaded.set(false);

    this.isLoadingProfilePersons.set(false);
    }

    /**
     * Guardar las personas asociadas al perfil.
     */
    async onSaveProfilePersons(
    payload: ProfilePersonsFormData,
    ): Promise<void> {

    const profile = this.personsProfile();

    if (
        !profile ||
        this.isSavingProfilePersons() ||
        this.isLoadingProfilePersons() ||
        !this.profilePersonsLoaded()
    ) {

        return;
    }

    this.isSavingProfilePersons.set(true);

    this.profilePersonsError.set('');

    try {

        await firstValueFrom(

        this.profilesService.saveProfilePersons(

            profile.id,

            payload,

        ),

        );

        this.resetProfilePersonsForm();

    } catch (error) {

        console.error(error);

        this.profilePersonsError.set(

        'No fue posible guardar las personas asociadas al perfil.',

        );

    } finally {

        this.isSavingProfilePersons.set(false);
    }
    }

}