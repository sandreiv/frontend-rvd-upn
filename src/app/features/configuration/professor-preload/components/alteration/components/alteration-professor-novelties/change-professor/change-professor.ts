import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import {
  takeUntilDestroyed,
} from '@angular/core/rxjs-interop';

import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  tap,
} from 'rxjs';

import {
  Label,
} from '../../../../../../../../shared/components/form/label/label';

import {
  TypeaheadOption,
  TypeaheadSelect,
} from '../../../../../../../../shared/components/form/typeahead-select/typeahead-select';

import {
  CoordinationService,
} from '../../../../../data/coordination.service';

import {
  ModalityProfessor,
  ProfessorSearchResult,
} from '../../../../../model/coordination.model';

import {
  SearchGeneralPersonParams,
} from '../../../../../../preload-call/model/preload-call.model';

import {
  NoveltyComponentState,
} from '../novelty-component-state';

@Component({
  selector: 'app-change-professor',
  imports: [
    Label,
    TypeaheadSelect,
  ],
  templateUrl:
    './change-professor.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class ChangeProfessor {

  private readonly coordinationService =
    inject(CoordinationService);

  private readonly destroyRef =
    inject(DestroyRef);

  private readonly noveltyState =
    inject(NoveltyComponentState);

  readonly professor =
    input<ModalityProfessor | null>(null);

  readonly searchResults =
    signal<ProfessorSearchResult[]>([]);

  readonly isSearching =
    signal(false);

  readonly selectedProfessor =
    signal<ProfessorSearchResult | null>(
      null,
    );

  readonly hasCurrentProfessor = computed(
    () =>
      this.professor()?.idPersonaGeneral != null,
  );

  private readonly searchTerm$ =
    new Subject<string>();

  constructor() {

    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),

        tap(() =>
          this.isSearching.set(true),
        ),

        switchMap((term) => {

          const params =
            this.buildSearchParams(term);

          if (params == null) {
            return of(
              [] as ProfessorSearchResult[],
            );
          }

          return this.coordinationService
            .searchFreeProfessor(params)
            .pipe(
              catchError(() =>
                of(
                  [] as ProfessorSearchResult[],
                ),
              ),
            );
        }),

        takeUntilDestroyed(
          this.destroyRef,
        ),
      )
      .subscribe((results) => {

        const currentProfessorId =
          this.professor()?.idPersonaGeneral;

        this.searchResults.set(
          results.filter(
            (item) =>
              item.id !== currentProfessorId,
          ),
        );

        this.isSearching.set(false);
      });
  }

  readonly professorOptionAdapter =
    (item: unknown): TypeaheadOption => {

      const person =
        item as ProfessorSearchResult;

      return {
        value: String(person.id),

        label:
          `${person.documentoIdentidad} - ${person.nombreCompleto}`,

        data: person,
      };
    };

  onSearchProfessor(query: string): void {

    this.selectedProfessor.set(null);
    this.noveltyState.clear();

    const value = query.trim();

    if (value.length < 2) {

      this.searchResults.set([]);
      this.isSearching.set(false);

      this.searchTerm$.next('');

      return;
    }

    this.searchTerm$.next(value);
  }

  onProfessorSelected(
    option: TypeaheadOption,
  ): void {

    const professor =
      option.data as ProfessorSearchResult;

    const currentProfessorId =
      this.professor()?.idPersonaGeneral;

    if (
      currentProfessorId != null &&
      professor.id === currentProfessorId
    ) {
      this.selectedProfessor.set(null);
      this.noveltyState.clear();
      return;
    }

    const idEscalafon =
      professor.escalafon?.id;

    if (idEscalafon == null) {
      this.selectedProfessor.set(null);
      this.noveltyState.clear();
      return;
    }

    this.selectedProfessor.set(
      professor,
    );

    this.noveltyState.setChangeProfessor(
      professor.id,
      idEscalafon,
    );
  }

  private buildSearchParams(
    term: string,
  ): SearchGeneralPersonParams | null {

    const value =
      term.trim();

    const idModalidadContratacion =
      this.professor()
        ?.idModalidadContratacion;

    if (
      !value ||
      idModalidadContratacion == null
    ) {
      return null;
    }

    if (/^\d+$/.test(value)) {

      return {
        documento: value,
        idModalidadContratacion,
      };
    }

    return {
      nombre: value,
      idModalidadContratacion,
    };
  }
}