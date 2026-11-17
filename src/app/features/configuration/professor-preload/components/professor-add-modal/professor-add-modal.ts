import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  EMPTY,
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { ToastService } from '../../../../../core/service/toastService';
import { Label } from '../../../../../shared/components/form/label/label';
import {
  TypeaheadOption,
  TypeaheadSelect,
} from '../../../../../shared/components/form/typeahead-select/typeahead-select';
import { DateRangePicker } from '../../../../../shared/components/form/date-range-picker/date-range-picker';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { SearchGeneralPersonParams } from '../../../preload-call/model/preload-call.model';
import { CoordinationService } from '../../data/coordination.service';
import { ProfessorSearchResult } from '../../model/coordination.model';
import { LinkageTypeItem } from '../../model/linkage-type.model';
import { ProfessorLoadItem } from '../../model/professor-load.model';
import {
  ContractValue,
  AddProfessorFormSnapshot,
  assignmentFieldsForPayment,
  buildAddProfessorPayload,
  buildContractValueQuery,
  countWeeks,
  formatContractHours,
  formatCurrencyCOP,
  isLockedAssignmentField,
  isPlantLinkage as plantLinkage,
  professorFormFieldKeys,
} from '../../model/professor-form.config';

@Component({
  selector: 'app-professor-add-modal',
  imports: [
    Modal,
    Label,
    TypeaheadSelect,
    DateRangePicker,
    Button,
    Icon,
    InputField,
    ReactiveFormsModule,
  ],
  templateUrl: './professor-add-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorAddModal {
  private readonly coordinationService = inject(CoordinationService);
  private readonly toastService = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchTerm$ = new Subject<string>();
  private readonly contractInputs$ = new Subject<void>();

  readonly isOpen = input(false);
  readonly anio = input<number | null>(null);
  readonly idCoordinacion = input<number | null>(null);
  readonly linkageType = input<LinkageTypeItem | null>(null);
  readonly readOnly = input(false);
  readonly detail = input<ProfessorLoadItem | null>(null);
  readonly close = output<void>();

  readonly isProfessorActive = signal(true);
  readonly searchResults = signal<ProfessorSearchResult[]>([]);
  readonly isSearching = signal(false);
  readonly selectedProfessor = signal<ProfessorSearchResult | null>(null);
  readonly isSaving = signal(false);
  readonly isPlantLinkage = computed(() =>
    plantLinkage(this.linkageType()?.esPlanta),
  );
  readonly fields = computed(() =>
    assignmentFieldsForPayment(
      this.linkageType()?.formaPago,
      this.linkageType()?.esPlanta,
    ),
  );

  readonly professorOptionAdapter = (item: unknown): TypeaheadOption => {
    const person = item as ProfessorSearchResult;
    return {
      value: String(person.id),
      label: `${person.documentoIdentidad} - ${person.nombreCompleto}`,
      data: person,
    };
  };

  readonly professorForm: FormGroup = new FormGroup({
    ...Object.fromEntries(
      professorFormFieldKeys().map((key) => [
        key,
        new FormControl({
          value: '',
          disabled: isLockedAssignmentField(key),
        }),
      ]),
    ),
    fechaInicio: new FormControl(''),
    fechaFin: new FormControl(''),
  });

  constructor() {
    effect(() => {
      if (!this.isOpen() || this.readOnly()) {
        return;
      }

      this.linkageType();
      this.selectedProfessor();
      this.isOpen();
      this.contractInputs$.next();
    });

    effect(() => {
      if (!this.isOpen()) {
        return;
      }

      if (this.readOnly()) {
        this.applyDetail(this.detail());
        return;
      }

      this.setFormReadOnly(false);
      this.isProfessorActive.set(true);
      this.professorForm.reset();
      this.clearSearch();
    });

    effect((onCleanup) => {
      if (!this.isOpen() || this.readOnly()) {
        return;
      }

      const linkageType = this.linkageType();
      const idTipoVinculacion = linkageType?.id;
      if (idTipoVinculacion == null || plantLinkage(linkageType?.esPlanta)) {
        return;
      }

      const subscription = this.coordinationService
        .getContractHours(idTipoVinculacion)
        .pipe(catchError(() => of(null)))
        .subscribe((hours) => {
          this.professorForm.patchValue({
            horasSemanales: formatContractHours(hours?.minimo, hours?.maximo),
          });
        });

      onCleanup(() => subscription.unsubscribe());
    });

    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap((term) => {
          this.isSearching.set(this.canSearchProfessor(term));
        }),
        switchMap((term) => this.searchProfessors(term)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      });

    this.professorForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.readOnly()) {
          return;
        }

        this.syncCalculatedWeeks();
        this.contractInputs$.next();
      });

    this.contractInputs$
      .pipe(
        debounceTime(300),
        switchMap(() => this.loadContractValue()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((value) => this.applyContractValue(value));
  }

  onSearchProfessor(query: string): void {
    if (this.selectedProfessor()) {
      this.selectedProfessor.set(null);
      this.applyLockedProfessorFields(null);
    }

    this.searchTerm$.next(query.trim());
  }

  onSave(): void {
    if (this.readOnly() || this.isSaving()) {
      return;
    }

    const professor = this.selectedProfessor();
    if (professor == null) {
      this.toastService.show('Seleccione un docente.', 'error', 'Docente');
      return;
    }

    const idCategoriaCatedratico =
      professor.categoriaCatedratico?.id ??
      professor.escalafon?.idCategoriaCatedratico ??
      null;
    const idTipoVinculacionConvocatoria =
      this.linkageType()?.idTipoVinculacionConvocatoria ?? null;
    const idCoordinacion = this.idCoordinacion();

    if (idCategoriaCatedratico == null) {
      this.toastService.show(
        'El docente no tiene categoría.',
        'error',
        'Categoría',
      );
      return;
    }

    if (idTipoVinculacionConvocatoria == null || idCoordinacion == null) {
      this.toastService.show(
        'No se pudo identificar la vinculación o la coordinación.',
        'error',
        'Carga docente',
      );
      return;
    }

    if (!this.isPlantLinkage()) {
      this.syncCalculatedWeeks();
    }

    const raw = this.professorForm.getRawValue() as Record<string, unknown>;
    const payload = buildAddProfessorPayload(
      this.readProfessorSnapshot(
        raw,
        professor.id,
        idTipoVinculacionConvocatoria,
        idCategoriaCatedratico,
        idCoordinacion,
      ),
    );

    this.isSaving.set(true);
    this.coordinationService
      .addProfessor(payload)
      .pipe(
        finalize(() => this.isSaving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => this.close.emit(),
        error: () => undefined,
      });
  }

  onProfessorSelected(option: TypeaheadOption): void {
    const professor = (option.data as ProfessorSearchResult | undefined) ?? null;
    this.selectedProfessor.set(professor);
    this.applyLockedProfessorFields(professor);
  }

  private searchProfessors(term: string) {
    const params = this.buildSearchParams(term);
    const anio = this.anio();
    if (!params || anio == null) {
      return of([] as ProfessorSearchResult[]);
    }

    const search = this.isPlantLinkage()
      ? this.coordinationService.searchCareerProfessor(params, anio)
      : this.coordinationService.searchProfesor(params, anio);

    return search.pipe(catchError(() => of([] as ProfessorSearchResult[])));
  }

  private canSearchProfessor(term: string): boolean {
    return this.buildSearchParams(term) != null && this.anio() != null;
  }

  private buildSearchParams(term: string): SearchGeneralPersonParams | null {
    const value = term.trim();
    if (value.length < 2) {
      return null;
    }

    if (/^\d+$/.test(value)) {
      return { documento: value };
    }

    return { nombre: value };
  }

  private applyLockedProfessorFields(
    professor: ProfessorSearchResult | null,
  ): void {
    this.professorForm.patchValue({
      categoriaCatedratico:
        professor?.categoriaCatedratico?.descripcion?.trim() ?? '',
      numeroPuntos: professor?.escalafon?.puntos?.trim() ?? '',
      valorPunto: formatCurrencyCOP(professor?.valorPunto ?? null),
      asignacionSalarial: formatCurrencyCOP(
        professor?.asignacionSalarial ?? null,
      ),
    });
  }

  private clearSearch(): void {
    this.searchResults.set([]);
    this.selectedProfessor.set(null);
    this.isSearching.set(false);
    this.applyLockedProfessorFields(null);
    this.applyContractValue(null);
  }

  private applyDetail(detail: ProfessorLoadItem | null): void {
    this.selectedProfessor.set(null);
    this.professorForm.reset({}, { emitEvent: false });
    this.setFormReadOnly(true);

    if (detail == null) {
      return;
    }

    this.professorForm.patchValue(
      {
        numeroPuntos: detail.puntos ?? '',
        valorPunto: formatCurrencyCOP(detail.valorPunto),
        asignacionSalarial: formatCurrencyCOP(detail.asignacionSalarial),
        fechaInicio: this.dateOnly(detail.cargaFechaInicio),
        fechaFin: this.dateOnly(detail.cargaFechaFin),
        semanas: detail.semanas ?? '',
        horasSemanales: detail.horas ?? '',
        valorHora: formatCurrencyCOP(detail.valorHora),
        valorContrato: formatCurrencyCOP(detail.valorContrato),
        valorPrestaciones: formatCurrencyCOP(detail.valorPrestaciones),
        totalContrato: formatCurrencyCOP(detail.totalContrato),
      },
      { emitEvent: false },
    );
  }

  private setFormReadOnly(locked: boolean): void {
    const keys = [...professorFormFieldKeys(), 'fechaInicio', 'fechaFin'];

    for (let index = 0; index < keys.length; index += 1) {
      const control = this.professorForm.get(keys[index]);
      if (!control) {
        continue;
      }

      const disabled = locked || isLockedAssignmentField(keys[index]);
      if (disabled) {
        control.disable({ emitEvent: false });
        continue;
      }

      control.enable({ emitEvent: false });
    }
  }

  private dateOnly(value: string | null): string {
    return value?.trim().slice(0, 10) ?? '';
  }

  private loadContractValue() {
    if (this.readOnly()) {
      return EMPTY;
    }

    const query = this.resolveContractQuery();
    if (!query) {
      this.applyContractValue(null);
      return EMPTY;
    }

    return this.coordinationService.calculateContractValue(query).pipe(
      catchError(() => of(null)),
    );
  }

  private syncCalculatedWeeks(): void {
    const raw = this.professorForm.getRawValue() as Record<string, unknown>;
    const weeks = countWeeks(
      this.readControl(raw, 'fechaInicio'),
      this.readControl(raw, 'fechaFin'),
    );

    this.professorForm.patchValue(
      { semanas: weeks == null ? '' : String(weeks) },
      { emitEvent: false },
    );
  }

  private resolveContractQuery() {
    if (this.isPlantLinkage()) {
      return null;
    }

    this.syncCalculatedWeeks();

    if (!this.isOpen() || this.selectedProfessor() == null) {
      return null;
    }

    const raw = this.professorForm.getRawValue() as Record<string, unknown>;
    const linkageType = this.linkageType();

    return buildContractValueQuery({
      formaPago: linkageType?.formaPago ?? null,
      idTipoVinculacion: linkageType?.id ?? null,
      fechaInicio: this.readControl(raw, 'fechaInicio'),
      fechaFin: this.readControl(raw, 'fechaFin'),
      numeroPuntos: this.readControl(raw, 'numeroPuntos'),
      valorPunto: this.readControl(raw, 'valorPunto'),
      asignacionSalarial: this.readControl(raw, 'asignacionSalarial'),
      semanas: this.readControl(raw, 'semanas'),
      horasSemanales: this.readControl(raw, 'horasSemanales'),
      valorHora: this.readControl(raw, 'valorHora'),
    });
  }

  private readProfessorSnapshot(
    raw: Record<string, unknown>,
    idPersonaGeneral: number,
    idTipoVinculacionConvocatoria: number,
    idCategoriaCatedratico: number,
    idCoordinacion: number,
  ): AddProfessorFormSnapshot {
    return {
      plant: this.isPlantLinkage(),
      formaPago: this.linkageType()?.formaPago ?? null,
      idPersonaGeneral,
      idTipoVinculacionConvocatoria,
      idCategoriaCatedratico,
      idCoordinacion,
      fechaInicio: this.readControl(raw, 'fechaInicio'),
      fechaFin: this.readControl(raw, 'fechaFin'),
      valorContrato: this.readControl(raw, 'valorContrato'),
      valorPrestaciones: this.readControl(raw, 'valorPrestaciones'),
      asignacionSalarial: this.readControl(raw, 'asignacionSalarial'),
      totalContrato: this.readControl(raw, 'totalContrato'),
      horas: this.readControl(raw, 'horasSemanales'),
      valorHora: this.readControl(raw, 'valorHora'),
      puntos: this.readControl(raw, 'numeroPuntos'),
      valorPunto: this.readControl(raw, 'valorPunto'),
      semanas: this.readControl(raw, 'semanas'),
    };
  }

  private readControl(raw: Record<string, unknown>, key: string): string {
    const value = raw[key];
    return value == null ? '' : String(value);
  }

  private applyContractValue(value: ContractValue | null): void {
    this.professorForm.patchValue(
      {
        valorContrato: formatCurrencyCOP(value?.valorContrato ?? null),
        valorPrestaciones: formatCurrencyCOP(value?.totalPrestaciones ?? null),
        totalContrato: formatCurrencyCOP(value?.totalContrato ?? null),
      },
      { emitEvent: false },
    );
  }

  onProfessorActiveChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.isProfessorActive.set(input.checked);
  }
}
