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

type UnitField = 'regional' | 'unit';

type CoordinationFormGroup = FormGroup<{
  idUnidadRegional: FormControl<string>;
  idUnidad: FormControl<string>;
  esAcademica: FormControl<boolean>;
}>;

@Component({
  selector: 'app-coordination-management-form',
  imports: [
    ReactiveFormsModule,
    Label,
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

  title = input('Nueva coordinación');
  editTitle = input('Editar coordinación');
  description = input('Registra la información principal de la coordinación.');
  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveCoordination = new EventEmitter<CoordinationManagementFormData>();

  readonly regionalUnitResults = signal<CatalogOptionItem[]>([]);
  readonly unitResults = signal<CatalogOptionItem[]>([]);
  readonly submitted = signal(false);

  readonly unitFieldBlurred = signal<Record<UnitField, boolean>>({
    regional: false,
    unit: false,
  });

  readonly form: CoordinationFormGroup = new FormGroup({
    idUnidadRegional: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idUnidad: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
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
      idUnidadRegional: Number(raw.idUnidadRegional),
      idUnidad: Number(raw.idUnidad),
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
    const control = field === 'regional'
      ? this.form.controls.idUnidadRegional
      : this.form.controls.idUnidad;

    return control.invalid && (this.submitted() || this.unitFieldBlurred()[field]);
  }

  private patchForm(): void {

    this.submitted.set(false);

    this.unitFieldBlurred.set({
      regional: false,
      unit: false,
    });
    
    const item = this.coordination();

    this.form.reset({
      idUnidadRegional:
        item?.idUnidadRegional != null ? String(item.idUnidadRegional) : '',
      idUnidad: item?.idUnidad != null ? String(item.idUnidad) : '',
      esAcademica: this.isChecked(item?.esAcademica),
    });

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