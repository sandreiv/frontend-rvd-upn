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
  untracked,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Subject,
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  forkJoin,
  map,
  of,
  switchMap,
  tap,
} from 'rxjs';
import { NgTemplateOutlet } from '@angular/common';
import { CoordinationService } from '../../../../data/coordination.service';
import { PermissionService } from '../../../../../../../core/service/permission-service';
import {
  CategoriaCatedratico,
  CoordinationContractModality,
  LoadRestrictionPreview,
  ProfessorSearchResult,
  ValuePointsPreload,
  WorkDate,
} from '../../../../model/coordination.model';
import { ContractValues,
  PROFESSOR_FIELDS,
  ProfessorFieldConfig,
  computeContractValues,
  countInclusiveDays,
  formatCurrencyCOP,
  formatWorkDateRange,
  resolveModalityKind
} from '../../../../model/professor-form.config';
import { AddProfessorRequest } from '../../../../model/add-professor.model';
import { SearchGeneralPersonParams } from '../../../../../preload-call/model/preload-call.model';
import { Modal } from '../../../../../../../shared/ui/modal/modal';
import { Icon } from '../../../../../../../shared/ui/icon/icon';
import { Button } from '../../../../../../../shared/ui/button/button';
import { Label } from '../../../../../../../shared/components/form/label/label';
import { TypeaheadOption, TypeaheadSelect } from '../../../../../../../shared/components/form/typeahead-select/typeahead-select';
import { InputField } from '../../../../../../../shared/components/form/input/input-field';
import { Option, Select } from '../../../../../../../shared/components/form/select/select';
import { Tooltip } from '../../../../../../../shared/ui/tooltip/tooltip';


@Component({
  selector: 'app-alteration-professor-add-modal',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    Modal,
    Icon,
    Button,
    Label,
    InputField,
    Select,
    TypeaheadSelect,
    Tooltip
],
  templateUrl: './alteration-professor-add-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfessorAddModal {
  private readonly coordinationService = inject(CoordinationService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly permissions = inject(PermissionService);

  isOpen = input(false);
  embedded = input(false);

  idCarga = input<number | null>(null);
  anioUniversidad = input<number | null>(null);
  periodoUniversidad = input<string | null>(null);
  contractModality = input<CoordinationContractModality | null>(null);
  
  close = output<void>();
  saved = output<void>();

  readonly isProfessorActive = signal(true);
  readonly searchResults = signal<ProfessorSearchResult[]>([]);
  readonly isSearching = signal(false);
  readonly isSaving = signal(false);
  readonly selectedProfessor = signal<ProfessorSearchResult | null>(null);
  readonly selectedWorkDate = signal<WorkDate | null>(null);
  readonly selectedCategoriaId = signal<number | null>(null);
  readonly manualNumeroPuntos = signal<number | null>(null);


  readonly modalityKind = computed(() => resolveModalityKind(this.contractModality()?.nombre));

  readonly fields = computed<ProfessorFieldConfig[]>(() => {
    const kind = this.modalityKind();
    const baseFields = kind ? PROFESSOR_FIELDS[kind] : [];

    let fields = baseFields;

    if (!this.isProfessorActive()) {
      fields = fields.map((field) => {
        if (field.key === 'categoriaCatedratico') {
          if (kind === 'catedra') {
            return {
              ...field,
              control: 'text' as const,
              readonly: true
            };
          }

          return {
            ...field,
            control: 'select' as const,
            readonly: false,
            placeholder: 'Seleccione la categoría',
          };
        }

        if (field.key === 'numeroPuntos') {
          return { ...field, readonly: false };
        }

        return field;
      });
    }

    return fields;
  });

  readonly effectiveCategoriaId = computed(() => {
    return this.isProfessorActive()
      ? this.selectedProfessor()?.categoriaCatedratico?.id ?? null
      : this.selectedCategoriaId();
  });

  private readonly workDatesResource = rxResource({
    params: () => {
      const idCarga = this.idCarga();
      const modalityId = this.contractModality()?.id;
      if (idCarga == null || modalityId == null) {
        return undefined;
      }
      return { idCarga, modalityId };
    },
    stream: ({ params }) =>
      this.coordinationService.getWorkDates(
        params.idCarga,
        params.modalityId,
      ),
    defaultValue: [] as WorkDate[],
  });

  private readonly loadRestrictionResource = rxResource<
    LoadRestrictionPreview | null,
    { modalityId: number } | undefined
  >({
    params: () => {
      const modalityId = this.contractModality()?.id;

      if (!this.isOpen() || modalityId == null) {
        return undefined;
      }

      return { modalityId };
    },
    stream: ({ params }) =>
      this.coordinationService.getLoadRestrictionByModality(params.modalityId),
    defaultValue: null,
  });

  readonly workDates = computed(() => this.workDatesResource.value());

  readonly selectedProfessorHorasExcepcion = computed(() => {
    const idPersona = this.selectedProfessor()?.id;

    if (idPersona == null) {
      return null;
    }

    const personException = this.loadRestrictionResource
      .value()?.personasExcepcion?.find((item) => item.idPersona === idPersona);

    const value = String(personException?.maximoHoras ?? '').trim();

    return value || null;
  });

  readonly fechaLaborOptions = computed<Option[]>(() =>
    this.workDates().map((workDate) => ({
      value: String(workDate.id),
      label: formatWorkDateRange(workDate.fechaInicio, workDate.fechaFin),
    })),
  );

  readonly categoriaMayorValorHora = computed<CategoriaCatedratico | null>(() => {
    const categorias = this.categoriasResource.value();
    const valoresHora = this.categoriaValoresHoraResource.value();

    let mayorCategoria: CategoriaCatedratico | null = null;
    let mayorValorHora = -Infinity;

    for (const categoria of categorias) {
      const valorHora = valoresHora[categoria.id];

      if (valorHora == null) {
        continue;
      }

      if (valorHora > mayorValorHora) {
        mayorValorHora = valorHora;
        mayorCategoria = categoria;
      }
    }

    return mayorCategoria;
  });

  private readonly categoriaValoresHoraResource = rxResource<
    Record<number, number>,
    {
      anio: number;
      idModalidadContratacion: number;
      categoriasCatedraticoIds: number[];
    } | undefined
  >({
    params: () => {
      const anio = this.anioUniversidad();
      const idModalidadContratacion = this.contractModality()?.id;
      const categoriasCatedraticos = this.categoriasResource.value();

      // Modalidad catedra y profesor NN
      if (
        this.isProfessorActive() ||
        this.modalityKind() !== 'catedra' ||
        anio == null ||
        idModalidadContratacion == null ||
        categoriasCatedraticos.length === 0
      ) {
        return undefined;
      }

      return {
        anio,
        idModalidadContratacion,
        categoriasCatedraticoIds: categoriasCatedraticos.map((categoria) => categoria.id),
      };
    },

    stream: ({ params }) => {
      // Consulta sin ID persona porque es NN catedratico
      const requests = params.categoriasCatedraticoIds.map((idCategoria) =>
        this.coordinationService
          .getValuePointsPreload(
            params.anio,
            idCategoria,
            null,
            params.idModalidadContratacion,
          )
          .pipe(
            catchError(() => of(null)),
          ),
      );

      return forkJoin(requests).pipe(
        map((results) => {
          const valoresHora: Record<number, number> = {};

          params.categoriasCatedraticoIds.forEach((categoriaId, index) => {
            const result = results[index];

            if (
              result?.valorHora != null &&
              Number.isFinite(result.valorHora)
            ) {
              valoresHora[categoriaId] = result.valorHora;
            }
          });

          return valoresHora;
        }),
      );
    },

    defaultValue: {},
  });

  private readonly valuePointsResource = rxResource<
    ValuePointsPreload,
    {
      anio: number;
      idCategoriaCatedratico: number;
      idPersonaGeneral: number | null;
      idModalidadContratacion: number;
    } | undefined
  >({
    params: () => {
      const anio = this.anioUniversidad();
      const idCategoriaCatedratico = this.effectiveCategoriaId();
      const idModalidadContratacion = this.contractModality()?.id;
      if (
        anio == null ||
        idCategoriaCatedratico == null ||
        idModalidadContratacion == null
      ) {
        return undefined;
      }
      const idPersonaGeneral =
        this.selectedProfessor()?.escalafon?.idPersonaGeneral ?? null;
      return {
        anio,
        idCategoriaCatedratico,
        idPersonaGeneral,
        idModalidadContratacion,
      };
    },
    stream: ({ params }) =>
      this.coordinationService.getValuePointsPreload(
        params!.anio,
        params!.idCategoriaCatedratico,
        params!.idPersonaGeneral ?? null,
        params!.idModalidadContratacion,
      ),
  });

  private readonly categoriasResource = rxResource({
    params: () => {
      const modalityId = this.contractModality()?.id;
      const needsCatalog = !this.isProfessorActive();
      
      if (!this.isOpen() || !needsCatalog || modalityId == null) {
        return undefined;
      }

      return { idModalidadContratacion: modalityId };
    },
    stream: ({ params }) =>
      this.coordinationService.getCategoriaCatedratico(
        params.idModalidadContratacion,
      ),
    defaultValue: [] as CategoriaCatedratico[],
  });

  readonly categoriaOptions = computed<Option[]>(() =>
    this.categoriasResource.value().map((categoria) => ({
      value: String(categoria.id),
      label: categoria.descripcion,
    })),
  );

  readonly asignacionSalarialNum = computed<number | null>(() => {
    const values = this.valuePointsResource.value() as
      | ValuePointsPreload
      | undefined;
    if (!values) {
      return null;
    }
    if (this.isProfessorActive()) {
      const asignacion = values.asignacionSalarial;
      return asignacion == null || Number.isNaN(asignacion)
        ? null
        : asignacion;
    }
    const valorPunto = values.valorPunto;
    const puntos = this.manualNumeroPuntos();
    if (valorPunto == null || Number.isNaN(valorPunto) || puntos == null) {
      return null;
    }
    return valorPunto * puntos;
  });

  readonly contractValues = computed<ContractValues | null>(() => {
    if (this.modalityKind() !== 'tiempoCompletoOcasional') {
      return null;
    }
    const asignacion = this.asignacionSalarialNum();
    const workDate = this.selectedWorkDate();
    if (asignacion == null || !workDate) {
      return null;
    }
    const cantidadDias = countInclusiveDays(
      workDate.fechaInicio,
      workDate.fechaFin,
    );
    if (cantidadDias <= 0) {
      return null;
    }
    return computeContractValues(asignacion, cantidadDias);
  });

  readonly professorForm = signal<FormGroup>(new FormGroup({}));

  private readonly searchTerm$ = new Subject<string>();

  constructor() {
    effect(() => {
      const controls = Object.fromEntries(
        this.fields().map((field) => [
          field.key,
          new FormControl({ value: '', disabled: !!field.readonly }),
        ]),
      );
      this.professorForm.set(new FormGroup(controls));
    });

    effect(() => {
      const form = this.professorForm();
      const fields = this.fields();

      fields.forEach((field) => {
        const control = form.get(field.key);

        if (!control) {
          return;
        }

        if (field.readonly) {
          control.disable({ emitEvent: false });
          return;
        }

        control.enable({ emitEvent: false });
      });
    });

    effect(() => {
      this.isOpen();
      this.contractModality();
      
      untracked(() => {
        this.isProfessorActive.set(true);
        this.clearSelectionState();
        this.professorForm().reset();
      });
    });

    effect(() => {
      this.isOpen();
      this.selectedProfessorHorasExcepcion();
      this.selectedWorkDate();

      untracked(() => {
        this.patchPreviewHorasSemanales();
      });
    });

    effect(() => {
      this.isProfessorActive();
      untracked(() => {
        this.clearSelectionState();
      });
    });

    effect(() => {
      const requiresMinimun = !this.isProfessorActive();
      const control = this.professorForm().get('numeroPuntos');
      if (!control) {
        return;
      }

      control.setValidators(requiresMinimun ? [Validators.min(375)] : []);
      control.updateValueAndValidity({ emitEvent: false });
    });

    effect(() => {
      const values = this.valuePointsResource.value() as
        | ValuePointsPreload
        | undefined;
      if (!values) {
        return;
      }

      const kind = this.modalityKind();
      if (kind === 'catedra') {
        this.professorForm().patchValue({
          valorHora: formatCurrencyCOP(values.valorHora),
        });
        return;
      }
      if (kind === 'tiempoCompletoOcasional') {
        this.professorForm().patchValue({
          valorPunto: formatCurrencyCOP(values.valorPunto),
        });
        if (this.isProfessorActive()) {
          this.professorForm().patchValue({
            numeroPuntos: values.puntosDocente,
          });
        }
      }
    });

    effect(() => {
      if (this.modalityKind() !== 'tiempoCompletoOcasional') {
        return;
      }

      const asignacionSalarial = this.asignacionSalarialNum();
      if (asignacionSalarial != null) {
        this.professorForm().patchValue({
          asignacionSalarial: formatCurrencyCOP(asignacionSalarial),
        });
      }

      const result = this.contractValues();
      if (!result) {
        return;
      }

      this.professorForm().patchValue({
        valorContrato: formatCurrencyCOP(result.valorContrato),
        valorPrestaciones: formatCurrencyCOP(result.valorPrestaciones),
        totalContrato: formatCurrencyCOP(result.totalContrato),
      });
    });

    effect(() => {
      const categoria = this.categoriaMayorValorHora();

      if (
        this.isProfessorActive() ||
        this.modalityKind() !== 'catedra' ||
        !categoria
      ) {
        return;
      }

      untracked(() => {
        this.selectedCategoriaId.set(categoria.id);

        this.professorForm().patchValue(
          { categoriaCatedratico: categoria.descripcion },
          { emitEvent: false },
        );
      });
    });

    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        tap(() => this.isSearching.set(true)),
        switchMap((term) => {
          const params = this.buildSearchParams(term);

          if (params == null) {
            return of([] as ProfessorSearchResult[]);
          }

          return this.coordinationService
            .searchFreeProfessor(params)
            .pipe(catchError(() => of([] as ProfessorSearchResult[])));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.searchResults.set(results);
        this.isSearching.set(false);
      });
  }

  readonly professorOptionAdapter = (item: unknown): TypeaheadOption => {
    const person = item as ProfessorSearchResult;
    return {
      value: String(person.id),
      label: `${person.documentoIdentidad} - ${person.nombreCompleto}`,
      data: person,
    };
  };

  onSearchProfessor(query: string): void {
    this.selectedProfessor.set(null);

    const value = query.trim();
    if (value.length < 2) {
      this.searchResults.set([]);
      this.isSearching.set(false);
      this.searchTerm$.next('');

      return;
    }

    this.searchTerm$.next(value);
  }

  onFechaLaborChange(workDateId: string): void {
    const workDate = this.workDates().find(
      (item) => String(item.id) === workDateId,
    );

    if (!workDate) {
      return;
    }

    this.selectedWorkDate.set(workDate);
    this.professorForm().patchValue({
      semanas: workDate.semanas ?? '',
      vacaciones: workDate.vacaciones ?? '',
      horasSemanales: this.resolveHorasSemanalesLabel(workDate),
    });
  }

  onCategoriaChange(categoriaId: string): void {
    const id = Number(categoriaId);
    this.selectedCategoriaId.set(Number.isNaN(id) ? null : id);
  }

  private clearSelectionState(): void {
    this.selectedProfessor.set(null);
    this.selectedCategoriaId.set(null);
    this.selectedWorkDate.set(null);
    this.manualNumeroPuntos.set(null);
    this.searchResults.set([]);
  }

  private resolveHorasSemanalesLabel(
    workDate: WorkDate | null,
  ): string {
    const previewExceptionHours = String(this.selectedProfessorHorasExcepcion() ?? '').trim();

    if (previewExceptionHours) {
      return previewExceptionHours;
    }

    return workDate?.rangoHoras ?? '';
  }

  private patchPreviewHorasSemanales(): void {
    const workDate = this.selectedWorkDate();

    if (!workDate) {
      return;
    }

    this.professorForm().patchValue({
      horasSemanales: this.resolveHorasSemanalesLabel(workDate),
    });
  }

  onNumeroPuntosChange(value: string | number): void {
    const puntos = Number(value);
    this.manualNumeroPuntos.set(
      value === '' || Number.isNaN(puntos) ? null : puntos,
    );
  }

  onProfessorSelected(option: TypeaheadOption): void {
    const professor = option.data as ProfessorSearchResult;

    this.selectedProfessor.set(professor);

    const descripcion = professor.categoriaCatedratico?.descripcion ?? '';
    this.professorForm().patchValue({
      categoriaCatedratico: descripcion,
    });

    this.patchPreviewHorasSemanales();
  }

  canSubmitProfessor(): boolean {
    return this.permissions.canAddProfessor();
  }


  onSubmit(): void {
    if (!this.canSubmitProfessor()) {
      return;
    }
    if (this.isSaving()) {
      return;
    }

    const form = this.professorForm();
    const payload = this.buildPayload();
    const modalityId = this.contractModality()?.id;
    if (modalityId == null) {
      return;
    }

    if (form.invalid || !payload) {
      form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.coordinationService.getSaveNovelties(modalityId)
      .pipe(
        map((novelties) => novelties.find(
          (novelty) => novelty.componente === 'add-professor')
        ),
        switchMap((novelty) => {
          if (!novelty) {
            throw new Error(
              'No se encontró la novedad configurada para agregar docente.',
            );
          }

          return this.coordinationService.addNoveltyProfessor({
            cargaDocente: payload,
            idNovedad: novelty.id
          });
        }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() =>
          this.isSaving.set(false)
        ),
      )
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          this.saved.emit();
          this.close.emit();
        }
      });
  }

  private buildPayload(): AddProfessorRequest | null {
    const idCarga = this.idCarga();
    const idModalidadContratacion = this.contractModality()?.id;
    const idCategoriaCatedratico = this.effectiveCategoriaId();
    const workDate = this.selectedWorkDate();
    
    if (
      idCarga == null ||
      idModalidadContratacion == null ||
      idCategoriaCatedratico == null ||
      !workDate
    ) {
      return null;
    }

    const base: AddProfessorRequest = {
      idCarga,
      idPersonaGeneral:
        this.selectedProfessor()?.escalafon?.idPersonaGeneral ?? null,
      idModalidadContratacion,
      idCategoriaCatedratico,
      fechasConvocatoria: {
        id: workDate.id,
        fechaInicio: workDate.fechaInicio,
        fechaFin: workDate.fechaFin,
      },
      semanas: workDate.semanas ?? '',
    };

    if (this.modalityKind() === 'catedra') {
      return {
        ...base,
        valorPunto: this.resolveValorPunto(),
        valorHora: this.resolveValorHora(),
      };
    }

    const contract = this.contractValues();
    return {
      ...base,
      puntos: this.puntosString(),
      valorPunto: this.resolveValorPunto(),
      asignacionSalarial: this.toAmount(this.asignacionSalarialNum()),
      valorContrato: this.toAmount(contract?.valorContrato),
      valorPrestaciones: this.toAmount(contract?.valorPrestaciones),
      totalContrato: this.toAmount(contract?.totalContrato),
    };
  }

  private resolveValorPunto(): number | null {
    const values = this.valuePointsResource.value() as
      | ValuePointsPreload
      | undefined;
    return this.toAmount(values?.valorPunto);
  }

  private puntosString(): string {
    if (this.isProfessorActive()) {
      const values = this.valuePointsResource.value() as
        | ValuePointsPreload
        | undefined;
      const puntos = values?.puntosDocente;
      return puntos == null ? '' : String(puntos);
    }
    const puntos = this.manualNumeroPuntos();
    return puntos == null ? '' : String(puntos);
  }

  private resolveValorHora(): number | null {
    const values = this.valuePointsResource.value() as
      | ValuePointsPreload
      | undefined;
    return this.toAmount(values?.valorHora);
  }

  private toAmount(value: number | null | undefined): number | null {
    if (value == null || Number.isNaN(value)) {
      return null;
    }
    return Math.round(value * 100) / 100;
  }

  private buildSearchParams(term: string): SearchGeneralPersonParams | null {
    const value = term.trim();
    const idModalidadContratacion = this.contractModality()?.id;

    if (!value || idModalidadContratacion == null) {
      return null;
    }

    if (/^\d+$/.test(value)) {
      return { documento: value, idModalidadContratacion };
    }

    return { nombre: value, idModalidadContratacion };
  }
}
