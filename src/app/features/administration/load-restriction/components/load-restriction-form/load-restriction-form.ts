/**
 * Aplicación: rvd
 * Archivo: load-restriction-form.ts
 * Ruta: src/app/features/administration/load-restriction/components/load-restriction-form
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Fecha de creación: 22/07/2026
 * Modificaciones:
 * 22/07/2026 - Joel Daniel Arias Duarte - Creación inicial para formulario de restricción de carga por modalidad.
 */
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnChanges,
  Output,
  SimpleChanges,
  input,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
} from '@angular/forms';
import { Button } from '../../../../../shared/ui/button/button';
import { Checkbox } from '../../../../../shared/components/form/input/checkbox';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import { Option, Select } from '../../../../../shared/components/form/select/select';
import {
  TypeaheadOption,
  TypeaheadSelect,
} from '../../../../../shared/components/form/typeahead-select/typeahead-select';
import {
  LoadRestrictionCatalogItem,
  LoadRestrictionCatalogs,
  LoadRestrictionDetail,
  LoadRestrictionFormData,
  LoadRestrictionModalityItem,
  LoadRestrictionPersonException,
  LoadRestrictionProgramException,
} from '../../model/load-restriction.model';

type SelectedProgramExceptionItem = LoadRestrictionCatalogItem & {
  maximoHoras: string | null;
};

type SelectedPersonExceptionItem = LoadRestrictionCatalogItem & {
  maximoHoras: string | null;
};

type LoadRestrictionFormGroup = FormGroup<{
  horasEnabled: FormControl<boolean>;
  minimo: FormControl<number | null>;
  maximo: FormControl<number | null>;
  investigacion: FormControl<string>;
  formaPagoEnabled: FormControl<boolean>;
  formaPago: FormControl<string>;
  tipoContratoEnabled: FormControl<boolean>;
  tipoContrato: FormControl<string>;
  tipoHorasEnabled: FormControl<boolean>;
  tipoHoras: FormControl<string>;
  excepcionEnabled: FormControl<boolean>;
  idProgramaBusqueda: FormControl<string>;
  idPersonaBusqueda: FormControl<string>;
  categoriaEnabled: FormControl<boolean>;
  idCategoriaCatedratico: FormControl<string>;
  tipoActividadEnabled: FormControl<boolean>;
  idTipoActividad: FormControl<string>;
}>;

const restrictionValidator: ValidatorFn = (
  control: AbstractControl,
): ValidationErrors | null => {
  const minimo = control.get('minimo')?.value;
  const maximo = control.get('maximo')?.value;

  const investigacion = String(control.get('investigacion')?.value ?? '');
  const formaPago = String(control.get('formaPago')?.value ?? '');
  const tipoContrato = String(control.get('tipoContrato')?.value ?? '');
  const tipoHoras = String(control.get('tipoHoras')?.value ?? '');

  const errors: ValidationErrors = {};

  if (minimo == null || minimo === '') {
    errors['minimoRequired'] = true;
  }

  if (maximo == null || maximo === '') {
    errors['maximoRequired'] = true;
  }

  if (
    minimo != null &&
    maximo != null &&
    minimo !== '' &&
    maximo !== '' &&
    Number(maximo) < Number(minimo)
  ) {
    errors['hoursRange'] = true;
  }

  if (!investigacion) {
    errors['investigacionRequired'] = true;
  }

  if (!formaPago) {
    errors['formaPagoRequired'] = true;
  }

  if (!tipoContrato) {
    errors['tipoContratoRequired'] = true;
  }

  if (!tipoHoras) {
    errors['tipoHorasRequired'] = true;
  }

  return Object.keys(errors).length ? errors : null;
};

@Component({
  selector: 'app-load-restriction-form',
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
    Select,
    Checkbox,
    TypeaheadSelect,
    Button,
  ],
  templateUrl: './load-restriction-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadRestrictionForm implements OnChanges {
  modality = input<LoadRestrictionModalityItem | null>(null);
  restriction = input<LoadRestrictionDetail | null>(null);
  catalogs = input<LoadRestrictionCatalogs | null>(null);
  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveRestriction = new EventEmitter<LoadRestrictionFormData>();

  readonly submitted = signal(false);
  readonly investigacionOptions: Option[] = [
    { value: '1', label: 'Sí' },
    { value: '0', label: 'No' },
  ];
  readonly filteredPrograms = signal<LoadRestrictionCatalogItem[]>([]);
  readonly filteredPeople = signal<LoadRestrictionCatalogItem[]>([]);
  readonly selectedPrograms = signal<SelectedProgramExceptionItem[]>([]);
  readonly selectedPeople = signal<SelectedPersonExceptionItem[]>([]);
  readonly selectedProgramException =
    signal<SelectedProgramExceptionItem | null>(null);
  readonly selectedPersonException =
    signal<SelectedPersonExceptionItem | null>(null);
  readonly programExceptionHours = new FormControl('', {
    nonNullable: true,
  });
  readonly personExceptionHours = new FormControl('', { nonNullable: true });
  readonly showProgramExceptionHoursRequired = signal(false);
  readonly showPersonExceptionHoursRequired = signal(false);
  readonly showExcepcionRequired = signal(false);
  readonly selectedCategories = signal<LoadRestrictionCatalogItem[]>([]);
  readonly selectedActivityTypes = signal<LoadRestrictionCatalogItem[]>([]);
  readonly showCategoriaRequiredSignal = signal(false);
  readonly showTipoActividadRequiredSignal = signal(false);
  readonly showProgramSearch = signal(true);
  readonly showPersonSearch = signal(true);

  readonly formaPagoOptions: Option[] = [
    { value: 'SALARIO', label: 'Salario' },
    { value: 'CATEDRA', label: 'Cátedra' },
  ];

  readonly tipoContratoOptions: Option[] = [
    { value: 'CONTRATO', label: 'Contrato' },
    { value: 'NORMA', label: 'Norma' },
  ];

  readonly tipoHorasOptions: Option[] = [
    { value: 'SEMANAL', label: 'Semanal' },
    { value: 'SEMESTRAL', label: 'Semestral' },
  ];

  readonly form: LoadRestrictionFormGroup = new FormGroup(
    {
      horasEnabled: new FormControl(true, { nonNullable: true }),
      minimo: new FormControl<number | null>(null),
      maximo: new FormControl<number | null>(null),
      investigacion: new FormControl('', { nonNullable: true }),

      formaPagoEnabled: new FormControl(true, { nonNullable: true }),
      formaPago: new FormControl('', { nonNullable: true }),

      tipoContratoEnabled: new FormControl(true, { nonNullable: true }),
      tipoContrato: new FormControl('', { nonNullable: true }),

      tipoHorasEnabled: new FormControl(true, { nonNullable: true }),
      tipoHoras: new FormControl('', { nonNullable: true }),

      excepcionEnabled: new FormControl(true, { nonNullable: true }),
      idProgramaBusqueda: new FormControl(
        { value: '', disabled: true },
        { nonNullable: true },
      ),
      idPersonaBusqueda: new FormControl(
        { value: '', disabled: true },
        { nonNullable: true },
      ),
      categoriaEnabled: new FormControl(false, { nonNullable: true }),
      idCategoriaCatedratico: new FormControl('', { nonNullable: true }),
      tipoActividadEnabled: new FormControl(false, { nonNullable: true }),
      idTipoActividad: new FormControl('', { nonNullable: true }),
    },
    { validators: [restrictionValidator] },
  );

  readonly catalogOptionAdapter = (item: unknown): TypeaheadOption => {
    const option = item as LoadRestrictionCatalogItem;

    return {
      value: String(option.id),
      label: option.label,
      secondaryLabel: undefined,
      data: option,
    };
  };

  get categoriaOptions(): Option[] {
    const selectedIds = new Set(
      this.selectedCategories().map((item) => item.id),
    );

    return (this.catalogs()?.categorias ?? [])
      .filter((item) => !selectedIds.has(item.id))
      .map((item) => ({
        value: String(item.id),
        label: item.label,
      }));
  }

  get tipoActividadOptions(): Option[] {
    const selectedIds = new Set(
      this.selectedActivityTypes().map((item) => item.id),
    );

    return (this.catalogs()?.tiposActividad ?? [])
      .filter((item) => !selectedIds.has(item.id))
      .map((item) => ({
        value: String(item.id),
        label: item.codigo ? `${item.codigo} - ${item.label}` : item.label,
      }));
  }

  get showMinimoRequired(): boolean {
    return this.submitted() && this.form.hasError('minimoRequired');
  }

  get showMaximoRequired(): boolean {
    return this.submitted() && this.form.hasError('maximoRequired');
  }

  get showHoursRangeInvalid(): boolean {
    return this.submitted() && this.form.hasError('hoursRange');
  }

  get showInvestigacionRequired(): boolean {
    return this.submitted() && this.form.hasError('investigacionRequired');
  }

  get showFormaPagoRequired(): boolean {
    return this.submitted() && this.form.hasError('formaPagoRequired');
  }

  get showTipoContratoRequired(): boolean {
    return (
      this.submitted() &&
      this.form.hasError('tipoContratoRequired')
    );
  }

  get showTipoHorasRequired(): boolean {
    return this.submitted() && this.form.hasError('tipoHorasRequired');
  }

  get showCategoriaRequired(): boolean {
    return this.showCategoriaRequiredSignal();
  }

  get showTipoActividadRequired(): boolean {
    return this.showTipoActividadRequiredSignal();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['restriction'] ||
      changes['modality'] ||
      changes['catalogs']
    ) {
      this.patchForm();
    }
  }

  onToggleHoras(checked: boolean): void {
    this.form.controls.horasEnabled.setValue(checked);

    if (checked) {
        this.form.controls.minimo.enable({ emitEvent: false });
        this.form.controls.maximo.enable({ emitEvent: false });
    } else {
        this.form.controls.minimo.setValue(null);
        this.form.controls.maximo.setValue(null);
        this.form.controls.minimo.disable({ emitEvent: false });
        this.form.controls.maximo.disable({ emitEvent: false });
    }

    this.form.updateValueAndValidity();
    }

  onToggleFormaPago(checked: boolean): void {
    this.form.controls.formaPagoEnabled.setValue(checked);
    if (!checked) {
      this.form.controls.formaPago.setValue('');
    }
    this.form.updateValueAndValidity();
  }

  onToggleTipoContrato(checked: boolean): void {
    this.form.controls.tipoContratoEnabled.setValue(checked);

    if (!checked) {
      this.form.controls.tipoContrato.setValue('');
    }

    this.form.updateValueAndValidity();
  }

  onToggleTipoHoras(checked: boolean): void {
    this.form.controls.tipoHorasEnabled.setValue(checked);
    if (!checked) {
      this.form.controls.tipoHoras.setValue('');
    }
    this.form.updateValueAndValidity();
  }

  onToggleExcepcion(checked: boolean): void {
    this.form.controls.excepcionEnabled.setValue(checked);

    if (checked) {
      this.syncExcepcionControls(true);
    } else {
      this.clearExcepcion();
      this.syncExcepcionControls(false);
    }

    this.showExcepcionRequired.set(false);
    this.form.updateValueAndValidity();
  }

  private syncExcepcionControls(enabled: boolean): void {
    if (enabled) {
      this.form.controls.idProgramaBusqueda.enable({ emitEvent: false });
      this.form.controls.idPersonaBusqueda.enable({ emitEvent: false });
      return;
    }

    this.form.controls.idProgramaBusqueda.disable({ emitEvent: false });
    this.form.controls.idPersonaBusqueda.disable({ emitEvent: false });
  }

  onToggleCategoria(checked: boolean): void {
    this.form.controls.categoriaEnabled.setValue(checked);

    if (!checked) {
      this.form.controls.idCategoriaCatedratico.setValue('');
      this.selectedCategories.set([]);
    }

    this.showCategoriaRequiredSignal.set(false);
    this.form.updateValueAndValidity();
  }

  onToggleTipoActividad(checked: boolean): void {
    this.form.controls.tipoActividadEnabled.setValue(checked);

    if (!checked) {
      this.form.controls.idTipoActividad.setValue('');
      this.selectedActivityTypes.set([]);
    }

    this.showTipoActividadRequiredSignal.set(false);
    this.form.updateValueAndValidity();
  }

  onSearchProgram(term: string): void {
    this.filteredPrograms.set(
      this.filterCatalog(this.catalogs()?.programas ?? [], term),
    );
  }

  onSearchPerson(term: string): void {
    this.filteredPeople.set(
      this.filterCatalog(this.catalogs()?.personas ?? [], term),
    );
  }

  onProgramSelected(item: unknown): void {
    const program = item as LoadRestrictionCatalogItem;

    if (!program?.id) {
      return;
    }

    const existing = this.selectedPrograms().find(
      (selected) => selected.id === program.id,
    );

    if (existing) {
      this.clearProgramSearch();
      this.openProgramExceptionHours(existing);
      return;
    }

    const selectedProgram: SelectedProgramExceptionItem = {
      ...program,
      maximoHoras: null,
    };

    this.selectedPrograms.update((current) => [...current, selectedProgram]);
    this.filteredPrograms.set([]);
    this.showExcepcionRequired.set(false);
    this.clearProgramSearch();
    this.openProgramExceptionHours(selectedProgram);
  }

  private clearProgramSearch(): void {
    this.form.controls.idProgramaBusqueda.setValue('', {
        emitEvent: false,
    });

    this.showProgramSearch.set(false);

    setTimeout(() => {
        this.showProgramSearch.set(true);
    });
  }

  private clearPersonSearch(): void {
    this.form.controls.idPersonaBusqueda.setValue('', {
        emitEvent: false,
    });

    this.showPersonSearch.set(false);

    setTimeout(() => {
        this.showPersonSearch.set(true);
    });
  }

  removeProgram(id: number): void {
    this.selectedPrograms.update((current) =>
      current.filter((item) => item.id !== id),
    );

    if (this.selectedProgramException()?.id === id) {
      this.closeProgramExceptionHours();
    }
  }

  openProgramExceptionHours(program: SelectedProgramExceptionItem): void {
    this.closePersonExceptionHours();
    this.selectedProgramException.set(program);
    this.programExceptionHours.setValue(program.maximoHoras ?? '');
    this.showProgramExceptionHoursRequired.set(false);
  }

  closeProgramExceptionHours(): void {
    this.selectedProgramException.set(null);
    this.programExceptionHours.setValue('');
    this.showProgramExceptionHoursRequired.set(false);
  }

  saveProgramExceptionHours(): void {
    const program = this.selectedProgramException();

    if (!program) {
      return;
    }

    const value = String(this.programExceptionHours.value ?? '').trim();

    if (!value || Number.isNaN(Number(value)) || Number(value) <= 0) {
      this.showProgramExceptionHoursRequired.set(true);
      return;
    }

    this.selectedPrograms.update((current) =>
      current.map((item) =>
        item.id === program.id
          ? {
              ...item,
              maximoHoras: value,
            }
          : item,
      ),
    );

    this.closeProgramExceptionHours();
  }

  onPersonSelected(item: unknown): void {
    const person = item as LoadRestrictionCatalogItem;

    if (!person?.id) {
      return;
    }

    if (this.selectedPeople().some((selected) => selected.id === person.id)) {
      this.clearPersonSearch();
      return;
    }

    this.selectedPeople.update((current) => [
      ...current,
      {
        ...person,
        maximoHoras: null,
      },
    ]);
    this.filteredPeople.set([]);
    this.showExcepcionRequired.set(false);

    this.clearPersonSearch();
  }

  removePerson(id: number): void {
    this.selectedPeople.update((current) =>
      current.filter((item) => item.id !== id),
    );

    if (this.selectedPersonException()?.id === id) {
      this.closePersonExceptionHours();
    }
  }

  openPersonExceptionHours(person: SelectedPersonExceptionItem): void {
    this.closeProgramExceptionHours();
    this.selectedPersonException.set(person);
    this.personExceptionHours.setValue(person.maximoHoras ?? '');
    this.showPersonExceptionHoursRequired.set(false);
  }

  closePersonExceptionHours(): void {
    this.selectedPersonException.set(null);
    this.personExceptionHours.setValue('');
    this.showPersonExceptionHoursRequired.set(false);
  }

  savePersonExceptionHours(): void {
    const person = this.selectedPersonException();

    if (!person) {
      return;
    }

    const value = String(this.personExceptionHours.value ?? '').trim();

    if (!value || Number.isNaN(Number(value)) || Number(value) <= 0) {
      this.showPersonExceptionHoursRequired.set(true);
      return;
    }

    this.selectedPeople.update((current) =>
      current.map((item) =>
        item.id === person.id
          ? {
              ...item,
              maximoHoras: value,
            }
          : item,
      ),
    );

    this.closePersonExceptionHours();
  }

    onCategoriaSelected(value: string): void {
    const id = Number(value);

    if (!id) {
      return;
    }

    const category = (this.catalogs()?.categorias ?? []).find(
      (item) => item.id === id,
    );

    if (!category) {
      this.form.controls.idCategoriaCatedratico.setValue('');
      return;
    }

    if (this.selectedCategories().some((item) => item.id === category.id)) {
      this.form.controls.idCategoriaCatedratico.setValue('');
      return;
    }

    this.selectedCategories.update((current) => [...current, category]);
    this.form.controls.idCategoriaCatedratico.setValue('');
    this.showCategoriaRequiredSignal.set(false);
  }

  removeCategoria(id: number): void {
    this.selectedCategories.update((current) =>
      current.filter((item) => item.id !== id),
    );
  }

  onTipoActividadSelected(value: string): void {
    const id = Number(value);

    if (!id) {
      return;
    }

    const activityType = (this.catalogs()?.tiposActividad ?? []).find(
      (item) => item.id === id,
    );

    if (!activityType) {
      this.form.controls.idTipoActividad.setValue('');
      return;
    }

    if (this.selectedActivityTypes().some((item) => item.id === activityType.id)) {
      this.form.controls.idTipoActividad.setValue('');
      return;
    }

    this.selectedActivityTypes.update((current) => [...current, activityType]);
    this.form.controls.idTipoActividad.setValue('');
    this.showTipoActividadRequiredSignal.set(false);
  }

  removeTipoActividad(id: number): void {
    this.selectedActivityTypes.update((current) =>
      current.filter((item) => item.id !== id),
    );
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    const modality = this.modality();

    if (!modality?.id || this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();

    const hasCategorias = this.selectedCategories().length > 0;
    const hasTiposActividad = this.selectedActivityTypes().length > 0;

    this.showCategoriaRequiredSignal.set(false);
    this.showTipoActividadRequiredSignal.set(false);

    if (raw.categoriaEnabled && !hasCategorias) {
      this.showCategoriaRequiredSignal.set(true);
      return;
    }

    if (raw.tipoActividadEnabled && !hasTiposActividad) {
      this.showTipoActividadRequiredSignal.set(true);
      return;
    }

    this.saveRestriction.emit({
      idModalidadContratacion: modality.id,
      minimo: raw.minimo != null ? String(raw.minimo) : null,
      maximo: raw.maximo != null ? String(raw.maximo) : null,
      investigacion: raw.investigacion,
      formaPago: raw.formaPago,
      tipoContrato: raw.tipoContrato,
      tipoHoras: raw.tipoHoras,

      idsProgramasExcepcion: this.selectedPrograms().map((item) => item.id),
      programasExcepcion: this.selectedPrograms().map((item) => ({
        idPrograma: item.id,
        maximoHoras: item.maximoHoras,
      })),

      idsPersonasExcepcion: this.selectedPeople().map((item) => item.id),
      personasExcepcion: this.selectedPeople().map((item) => ({
        idPersona: item.id,
        maximoHoras: item.maximoHoras,
      })),

      idsCategoriasCatedratico: raw.categoriaEnabled
        ? this.selectedCategories().map((item) => item.id)
        : [],

      idsTiposActividad: raw.tipoActividadEnabled
        ? this.selectedActivityTypes().map((item) => item.id)
        : [],
    });
  }

  private patchForm(): void {
  const item = this.restriction();

  this.submitted.set(false);

  const horasEnabled = true;
  const excepcionEnabled = true;

    this.form.reset({
      horasEnabled,
      minimo: item?.minimo != null ? Number(item.minimo) : null,
      maximo: item?.maximo != null ? Number(item.maximo) : null,
      investigacion: item?.investigacion != null
        ? this.isMarked(item.investigacion) ? '1' : '0'
        : '',
      formaPagoEnabled: true,
      formaPago: item?.formaPago ?? '',
      tipoContratoEnabled: true,
      tipoContrato: item?.tipoContrato ?? '',
      tipoHorasEnabled: true,
      tipoHoras: item?.tipoHoras ?? '',
      excepcionEnabled,
      idProgramaBusqueda: '',
      idPersonaBusqueda: '',
      categoriaEnabled: (item?.idsCategoriasCatedratico?.length ?? 0) > 0,
      idCategoriaCatedratico: '',
      tipoActividadEnabled: (item?.idsTiposActividad?.length ?? 0) > 0,
      idTipoActividad: '',
    });

    this.form.controls.minimo.enable({ emitEvent: false });
    this.form.controls.maximo.enable({ emitEvent: false });
    this.syncExcepcionControls(true);

    this.setSelectedPrograms(
      item?.idsProgramasExcepcion ?? [],
      item?.programasExcepcion ?? [],
    );
    this.setSelectedPeople(
      item?.idsPersonasExcepcion ?? [],
      item?.personasExcepcion ?? [],
    );
    this.setSelectedCategories(item?.idsCategoriasCatedratico ?? []);
    this.setSelectedActivityTypes(item?.idsTiposActividad ?? []);
    this.showCategoriaRequiredSignal.set(false);
    this.showTipoActividadRequiredSignal.set(false);
    this.form.updateValueAndValidity();
  }

  private clearExcepcion(): void {
    this.form.controls.idProgramaBusqueda.setValue('');
    this.form.controls.idPersonaBusqueda.setValue('');
    this.selectedPrograms.set([]);
    this.selectedPeople.set([]);
    this.filteredPrograms.set([]);
    this.filteredPeople.set([]);
    this.closeProgramExceptionHours();
    this.closePersonExceptionHours();
    this.showExcepcionRequired.set(false);
  }

  private setSelectedPrograms(
    ids: number[],
    programasExcepcion: LoadRestrictionProgramException[] = [],
  ): void {
    const programs = this.catalogs()?.programas ?? [];

    const hoursByProgramId = new Map(
      programasExcepcion.map((item) => [
        item.idPrograma,
        item.maximoHoras,
      ]),
    );

    const idsFromProgramasExcepcion = programasExcepcion.map(
      (item) => item.idPrograma,
    );

    const selectedIds = Array.from(
      new Set([...ids, ...idsFromProgramasExcepcion]),
    );

    this.selectedPrograms.set(
      programs
        .filter((item) => selectedIds.includes(item.id))
        .map((item) => ({
          ...item,
          maximoHoras: hoursByProgramId.get(item.id) ?? null,
        })),
    );
  }

  private setSelectedPeople(
    ids: number[],
    personasExcepcion: LoadRestrictionPersonException[] = [],
  ): void {
    const people = this.catalogs()?.personas ?? [];

    const hoursByPersonId = new Map(
      personasExcepcion.map((item) => [
        item.idPersona,
        item.maximoHoras,
      ]),
    );

    const idsFromPersonasExcepcion = personasExcepcion.map(
      (item) => item.idPersona,
    );

    const selectedIds = Array.from(
      new Set([...ids, ...idsFromPersonasExcepcion]),
    );

    this.selectedPeople.set(
      people
        .filter((item) => selectedIds.includes(item.id))
        .map((item) => ({
          ...item,
          maximoHoras: hoursByPersonId.get(item.id) ?? null,
        })),
    );
  }

  private setSelectedCategories(ids: number[]): void {
    const categories = this.catalogs()?.categorias ?? [];

    this.selectedCategories.set(
      categories.filter((item) => ids.includes(item.id)),
    );
  }

  private setSelectedActivityTypes(ids: number[]): void {
    const activityTypes = this.catalogs()?.tiposActividad ?? [];

    this.selectedActivityTypes.set(
      activityTypes.filter((item) => ids.includes(item.id)),
    );
  }

  private filterCatalog(
    rows: LoadRestrictionCatalogItem[],
    term: string,
  ): LoadRestrictionCatalogItem[] {
    const normalizedTerm = this.normalize(term);

    if (normalizedTerm.length < 2) {
      return [];
    }

    return rows
      .filter((item) => {
        const label = this.normalize(item.label);
        const codigo = this.normalize(item.codigo ?? '');
        const id = this.normalize(String(item.id));

        return (
          label.includes(normalizedTerm) ||
          codigo.includes(normalizedTerm) ||
          id.includes(normalizedTerm)
        );
      })
      .slice(0, 20);
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private isMarked(value: string | null | undefined): boolean {
    const normalized = String(value ?? '').trim().toUpperCase();

    return (
      normalized === '1' ||
      normalized === 'S' ||
      normalized === 'SI' ||
      normalized === 'TRUE' ||
      normalized === 'ACTIVO'
    );
  }
}