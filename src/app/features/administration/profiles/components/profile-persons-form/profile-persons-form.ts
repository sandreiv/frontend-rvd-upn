import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnChanges,
  OnInit,
  OnDestroy,
  Output,
  SimpleChanges,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import {
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';

import {
  Subject,
  Subscription,
  catchError,
  map,
  of,
  switchMap,
  tap,
  timer,
} from 'rxjs';

import { Button } from '../../../../../shared/ui/button/button';

import { Label } from '../../../../../shared/components/form/label/label';

import {
  TypeaheadSelect,
  TypeaheadOption,
} from '../../../../../shared/components/form/typeahead-select/typeahead-select';

import { ProfilesService } from '../../data/profiles.service';

import {
  ProfileItem,
  ProfilePersonItem,
  ProfilePersonsFormData,
} from '../../model/profiles.model';

@Component({
  selector: 'app-profile-persons-form',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    Button,
    Label,
    TypeaheadSelect,
  ],
  templateUrl: './profile-persons-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePersonsForm
  implements OnInit, OnChanges, OnDestroy {

  private readonly profilesService =
    inject(ProfilesService);

  /**
   * Perfil seleccionado.
   */
  profile = input.required<ProfileItem>();

  /**
   * Personas asociadas previamente.
   */
  initialPersons = input<ProfilePersonItem[]>([]);

  isSaving = input(false);

  isLoading = input(false);

  canSave = input(false);

  errorMessage = input('');

  @Output() cancel = new EventEmitter<void>();

  @Output() savePersons =
    new EventEmitter<ProfilePersonsFormData>();

  /**
   * Control del buscador.
   */
  readonly personControl = new FormControl('', {
    nonNullable: true,
  });

  /**
   * Personas seleccionadas temporalmente.
   */
  readonly selectedPersons =
    signal<ProfilePersonItem[]>([]);

  /**
   * Resultados de búsqueda.
   */
  readonly searchResults =
    signal<ProfilePersonItem[]>([]);

  readonly isSearching = signal(false);

  readonly searchError = signal('');

  private readonly searchTerms =
    new Subject<string>();

  private searchSubscription?: Subscription;

  /**
   * Excluir personas previamente seleccionadas.
   */
  readonly filteredPeople = computed(() => {

    const selectedIds = new Set(
      this.selectedPersons().map(
        (person) => person.idPersonaGeneral,
      ),
    );

    return this.searchResults().filter(
      (person) =>
        !selectedIds.has(person.idPersonaGeneral),
    );
  });

  /**
   * Adaptador del componente TypeaheadSelect.
   *
   * Sigue el mismo patrón de Personas exceptuadas
   * del módulo Restricción de carga de UDEC.
   */
  readonly personOptionAdapter = (
    item: unknown,
  ): TypeaheadOption => {

    const person = item as ProfilePersonItem;

    return {
      value: String(person.idPersonaGeneral),
      label:
        `${person.documentoIdentidad} - ${person.nombreCompleto}`,
      secondaryLabel: undefined,
      data: person,
    };
  };

  /**
   * Inicializar búsqueda de personas.
   */
  ngOnInit(): void {

    this.searchSubscription =
      this.searchTerms.pipe(

        map((term) => term.trim()),

        tap((term) => {

          this.searchResults.set([]);

          this.searchError.set('');

          this.isSearching.set(
            term.length >= 2 &&
            term.length <= 150,
          );

        }),

        switchMap((term) => {

          if (
            term.length < 2 ||
            term.length > 150
          ) {

            return of({
              persons: [] as ProfilePersonItem[],
              error: '',
            });
          }

          return timer(400).pipe(

            switchMap(() =>
              this.profilesService.searchPersons(term),
            ),

            map((persons) => ({
              persons: persons ?? [],
              error: '',
            })),

            catchError((error) => {

              console.error(error);

              return of({
                persons: [] as ProfilePersonItem[],
                error: 'No fue posible consultar las personas.',
              });
            }),

          );
        }),

      ).subscribe((result) => {

        this.searchResults.set(result.persons);

        this.searchError.set(result.error);

        this.isSearching.set(false);

      });
  }

  /**
   * Precargar personas relacionadas.
   */
  ngOnChanges(changes: SimpleChanges): void {

    if (
      changes['initialPersons'] ||
      changes['profile']
    ) {

      const uniquePersons =
        new Map<number, ProfilePersonItem>();

      for (const person of this.initialPersons()) {

        uniquePersons.set(
          person.idPersonaGeneral,
          person,
        );
      }

      this.selectedPersons.set(
        Array.from(uniquePersons.values()),
      );

      this.clearPersonSearch();
    }
  }

  /**
   * Consultar personas.
   */
  onSearchPerson(term: string): void {

    if (
      this.isSaving() ||
      this.isLoading() ||
      !this.canSave()
    ) {

      return;
    }

    this.searchTerms.next(term);
  }

  /**
   * Seleccionar una persona.
   */
  onPersonSelected(item: unknown): void {

    if (
      this.isSaving() ||
      this.isLoading() ||
      !this.canSave()
    ) {

      return;
    }

    const person = item as ProfilePersonItem;

    if (!person?.idPersonaGeneral) {

      return;
    }

    const alreadySelected =
      this.selectedPersons().some(
        (selected) =>
          selected.idPersonaGeneral ===
          person.idPersonaGeneral,
      );

    if (!alreadySelected) {

      this.selectedPersons.update(
        (current) => [...current, person],
      );
    }

    this.clearPersonSearch();
  }

  /**
   * Limpiar el buscador después de seleccionar.
   */
  private clearPersonSearch(): void {

    this.personControl.setValue('', {
      emitEvent: false,
    });

    this.searchResults.set([]);

    this.searchError.set('');

    this.isSearching.set(false);

    this.searchTerms.next('');
  }

  /**
   * Retirar una persona.
   */
  removePerson(idPersonaGeneral: number): void {

    if (
      this.isSaving() ||
      this.isLoading() ||
      !this.canSave()
    ) {

      return;
    }

    this.selectedPersons.update(
      (current) =>
        current.filter(
          (person) =>
            person.idPersonaGeneral !==
            idPersonaGeneral,
        ),
    );
  }

  /**
   * Guardar las personas seleccionadas.
   */
  onSubmit(): void {

    if (
      this.isSaving() ||
      this.isLoading() ||
      !this.canSave()
    ) {

      return;
    }

    const payload: ProfilePersonsFormData = {

      personasIds: this.selectedPersons().map(
        (person) => person.idPersonaGeneral,
      ),

    };

    this.savePersons.emit(payload);
  }

  /**
   * Liberar suscripciones.
   */
  ngOnDestroy(): void {

    this.searchSubscription?.unsubscribe();

    this.searchTerms.complete();
  }

}