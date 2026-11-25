import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnChanges,
  Output,
  SimpleChanges,
  input,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../../../../../shared/ui/button/button';
import { Checkbox } from '../../../../../../shared/components/form/input/checkbox';
import { Label } from '../../../../../../shared/components/form/label/label';
import { Option, Select } from '../../../../../../shared/components/form/select/select';
import {
  CatalogOptionItem,
  CoordinationAssociationFormData,
  CoordinationAssociationItem,
} from '../../../model/coordination-administration.model';

type AssociationForm = FormGroup<{
  idCoordinacion: FormControl<string>;
  idPrograma: FormControl<string>;
  idCentroCosto: FormControl<string>;
  estado: FormControl<boolean>;
}>;

@Component({
  selector: 'app-association-coordination-form',
  imports: [ReactiveFormsModule, Label, Select, Checkbox, Button],
  templateUrl: './association-coordination-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociationCoordinationForm implements OnChanges {
  association = input<CoordinationAssociationItem | null>(null);
  selectedCoordinationId = input<number | null>(null);
  coordinations = input<CatalogOptionItem[]>([]);
  programs = input<CatalogOptionItem[]>([]);
  costCenters = input<CatalogOptionItem[]>([]);
  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveAssociation = new EventEmitter<CoordinationAssociationFormData>();

  readonly form: AssociationForm = new FormGroup({
    idCoordinacion: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    idPrograma: new FormControl('', { nonNullable: true }),
    idCentroCosto: new FormControl('', { nonNullable: true }),
    estado: new FormControl(true, { nonNullable: true }),
  });

  get programOptions(): Option[] {
    return this.toOptions(this.programs());
  }

  get costCenterOptions(): Option[] {
    return this.toOptions(this.costCenters());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['association'] || changes['selectedCoordinationId']) {
      this.patchForm();
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    const raw = this.form.getRawValue();

    if (!raw.idCoordinacion || this.form.invalid) {
      return;
    }

    this.saveAssociation.emit({
      id: this.association()?.id ?? null,
      idCoordinacion: Number(raw.idCoordinacion),
      idPrograma: raw.idPrograma ? Number(raw.idPrograma) : null,
      idCentroCosto: raw.idCentroCosto ? Number(raw.idCentroCosto) : null,
      estado: raw.estado ? '1' : '0',
    });
  }

  private patchForm(): void {
    const item = this.association();
    const idCoordinacion = item?.idCoordinacion ?? this.selectedCoordinationId();

    this.form.reset({
      idCoordinacion: idCoordinacion != null ? String(idCoordinacion) : '',
      idPrograma: item?.idPrograma != null ? String(item.idPrograma) : '',
      idCentroCosto: item?.idCentroCosto != null ? String(item.idCentroCosto) : '',
      estado: this.isActive(item?.estado),
    });

    this.form.controls.idCoordinacion.disable({ emitEvent: false });
  }

  private toOptions(items: CatalogOptionItem[], includeCode = false): Option[] {
    return items.map((item) => ({
      value: String(item.id),
      label: includeCode && item.codigo ? `${item.codigo} - ${item.label}` : item.label,
    }));
  }

  private isActive(value: CoordinationAssociationItem['estado'] | undefined): boolean {
    if (value == null || value === '') {
      return true;
    }

    const normalized = String(value).trim().toUpperCase();

    return normalized === '1' || normalized === 'ACTIVO' || normalized === 'A';
  }
}