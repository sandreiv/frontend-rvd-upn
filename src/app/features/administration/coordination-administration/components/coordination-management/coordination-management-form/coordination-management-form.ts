import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnChanges,
  Output,
  SimpleChanges,
  input,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Button } from '../../../../../../shared/ui/button/button';
import { Checkbox } from '../../../../../../shared/components/form/input/checkbox';
import { InputField } from '../../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../../shared/components/form/label/label';
import { Option, Select } from '../../../../../../shared/components/form/select/select';
import {
  TypeaheadOption,
  TypeaheadSelect,
} from '../../../../../../shared/components/form/typeahead-select/typeahead-select';
import { CoordinationAdministrationService } from '../../../data/coordination-administration.service';
import {
  CatalogOptionItem,
  CoordinationManagementFormData,
  CoordinationManagementItem,
} from '../../../model/coordination-administration.model';

type UnitField = 'parent' | 'regional' | 'unit';

type CoordinationFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  idUnidadPadre: FormControl<string>;
  idUnidadRegional: FormControl<string>;
  idUnidad: FormControl<string>;
  idModalidad: FormControl<string>;
  idMetodologia: FormControl<string>;
  idCentroCosto: FormControl<string>;
  codigo: FormControl<string>;
  esAcademica: FormControl<boolean>;
}>;

@Component({
  selector: 'app-coordination-management-form',
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
    Select,
    TypeaheadSelect,
    Checkbox,
    Button,
  ],
  templateUrl: './coordination-management-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoordinationManagementForm implements OnChanges {
  private readonly administrationService = inject(CoordinationAdministrationService);

  coordination = input<CoordinationManagementItem | null>(null);

  modalidades = input<CatalogOptionItem[]>([]);
  metodologias = input<CatalogOptionItem[]>([]);
  costCenters = input<CatalogOptionItem[]>([]);

  title = input('Nueva coordinación');
  editTitle = input('Editar coordinación');
  description = input('Registra la información principal de la coordinación.');
  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveCoordination = new EventEmitter<CoordinationManagementFormData>();

  readonly parentUnitResults = signal<CatalogOptionItem[]>([]);
  readonly regionalUnitResults = signal<CatalogOptionItem[]>([]);
  readonly unitResults = signal<CatalogOptionItem[]>([]);
  readonly submitted = signal(false);

  readonly unitFieldBlurred = signal<Record<UnitField, boolean>>({
    parent: false,
    regional: false,
    unit: false,
  });

  readonly form: CoordinationFormGroup = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idUnidadPadre: new FormControl('', {
      nonNullable: true,
    }),
    idUnidadRegional: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idUnidad: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idModalidad: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idMetodologia: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idCentroCosto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    codigo: new FormControl('', {
      nonNullable: true,
    }),
    esAcademica: new FormControl(false, {
      nonNullable: true,
    }),
  });

  readonly unitOptionAdapter = (item: unknown): TypeaheadOption => {
    const unit = item as CatalogOptionItem;

    return {
      value: String(unit.id),
      label: unit.label,
      secondaryLabel: unit.codigo ?? undefined,
      data: unit,
    };
  };

  get modalityOptions(): Option[] {
    return this.toOptions(this.modalidades());
  }

  get methodologyOptions(): Option[] {
    return this.toOptions(this.metodologias());
  }

  get costCenterOptions(): Option[] {
    return this.toOptions(this.costCenters());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['coordination']) {
      this.patchForm();
    }
  }

  async onSearchUnit(field: UnitField, term: string): Promise<void> {
    if (!term || term.trim().length < 2) {
      this.setUnitResults(field, []);
      return;
    }

    try {
      const rows = await firstValueFrom(
        this.administrationService.searchUnits(term.trim()),
      );

      this.setUnitResults(field, rows ?? []);
    } catch (error) {
      console.error(error);
      this.setUnitResults(field, []);
    }
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
        return;
    }

    const raw = this.form.getRawValue();

    this.saveCoordination.emit({
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim(),
      idUnidadPadre: raw.idUnidadPadre ? Number(raw.idUnidadPadre) : null,
      idUnidadRegional: Number(raw.idUnidadRegional),
      idUnidad: Number(raw.idUnidad),
      idModalidad: Number(raw.idModalidad),
      idMetodologia: Number(raw.idMetodologia),
      idCentroCosto: Number(raw.idCentroCosto),
      codigo: raw.codigo.trim() || null,
      esAcademica: raw.esAcademica ? '1' : '0',
    });
  }

    markUnitFieldBlurred(field: UnitField): void {
    this.unitFieldBlurred.update((current) => ({
        ...current,
        [field]: true,
    }));
    }

    shouldShowUnitRequiredError(field: UnitField): boolean {
    if (field === 'parent') {
        return false;
    }

    const control =
        field === 'regional'
        ? this.form.controls.idUnidadRegional
        : this.form.controls.idUnidad;

    return control.invalid && (this.submitted() || this.unitFieldBlurred()[field]);
    }

  private patchForm(): void {

    this.submitted.set(false);

    this.unitFieldBlurred.set({
    parent: false,
    regional: false,
    unit: false,
    });
    
    const item = this.coordination();

    this.form.reset({
      nombre: item?.nombre ?? '',
      descripcion: item?.descripcion ?? '',
      idUnidadPadre: item?.idUnidadPadre != null ? String(item.idUnidadPadre) : '',
      idUnidadRegional:
        item?.idUnidadRegional != null ? String(item.idUnidadRegional) : '',
      idUnidad: item?.idUnidad != null ? String(item.idUnidad) : '',
      idModalidad: item?.idModalidad != null ? String(item.idModalidad) : '',
      idMetodologia: item?.idMetodologia != null ? String(item.idMetodologia) : '',
      idCentroCosto: item?.idCentroCosto != null ? String(item.idCentroCosto) : '',
      codigo: item?.codigo ?? '',
      esAcademica: this.isChecked(item?.esAcademica),
    });

    this.parentUnitResults.set(
      item?.idUnidadPadre != null && item.unidadPadre
        ? [{ id: item.idUnidadPadre, label: item.unidadPadre, codigo: null }]
        : [],
    );

    this.regionalUnitResults.set(
      item?.idUnidadRegional != null && item.unidadRegional
        ? [{ id: item.idUnidadRegional, label: item.unidadRegional, codigo: null }]
        : [],
    );

    this.unitResults.set(
      item?.idUnidad != null && item.unidad
        ? [{ id: item.idUnidad, label: item.unidad, codigo: null }]
        : [],
    );
  }

  private setUnitResults(field: UnitField, rows: CatalogOptionItem[]): void {
    if (field === 'parent') {
      this.parentUnitResults.set(rows);
      return;
    }

    if (field === 'regional') {
      this.regionalUnitResults.set(rows);
      return;
    }

    this.unitResults.set(rows);
  }

  private toOptions(items: CatalogOptionItem[]): Option[] {
    return items.map((item) => ({
      value: String(item.id),
      label: item.label,
    }));
  }

  private isChecked(value: string | null | undefined): boolean {
    const normalized = String(value ?? '').trim().toUpperCase();

    return normalized === '1' || normalized === 'S' || normalized === 'SI' || normalized === 'TRUE';
  }
}