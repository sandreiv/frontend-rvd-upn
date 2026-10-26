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
  SubjectCatalogOptionItem,
} from '../../../model/coordination-administration.model';

type AssociationForm = FormGroup<{
  idCoordinacion: FormControl<string>;
  usarPrograma: FormControl<boolean>;
  idPrograma: FormControl<string>;
  usarMateria: FormControl<boolean>;
  codigoMateria: FormControl<string>;
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
  subjects = input<SubjectCatalogOptionItem[]>([]);
  costCenters = input<CatalogOptionItem[]>([]);
  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveAssociation = new EventEmitter<CoordinationAssociationFormData>();

  readonly form: AssociationForm = new FormGroup({
    idCoordinacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    usarPrograma: new FormControl(false, { nonNullable: true }),
    idPrograma: new FormControl('', { nonNullable: true }),
    usarMateria: new FormControl(false, { nonNullable: true }),
    codigoMateria: new FormControl('', { nonNullable: true }),

    // Centro de costo ahora es opcional.
    idCentroCosto: new FormControl('', { nonNullable: true }),

    estado: new FormControl(true, { nonNullable: true }),
  });

  get programOptions(): Option[] {
    return this.toOptions(this.programs());
  }

  get subjectOptions(): Option[] {
    return this.subjects().map((item) => ({
      value: item.codigoMateria,
      label: item.label,
    }));
  }

  get costCenterOptions(): Option[] {
    return this.toOptions(this.costCenters());
  }

  get isCostCenterEnabled(): boolean {
    return this.form.controls.usarPrograma.value;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['association'] || changes['selectedCoordinationId']) {
      this.patchForm();
    }
  }

  onProgramCheckChange(checked: boolean): void {
    this.form.controls.usarPrograma.setValue(checked);

    if (checked) {
      this.form.controls.usarMateria.setValue(false);
      this.form.controls.codigoMateria.setValue('');

      this.form.controls.idCentroCosto.enable({ emitEvent: false });
      return;
    }

    this.form.controls.idPrograma.setValue('');
    this.form.controls.idCentroCosto.setValue('');
    this.form.controls.idCentroCosto.disable({ emitEvent: false });
  }

  onSubjectCheckChange(checked: boolean): void {
    this.form.controls.usarMateria.setValue(checked);

    if (checked) {
      this.form.controls.usarPrograma.setValue(false);
      this.form.controls.idPrograma.setValue('');

      this.form.controls.idCentroCosto.setValue('');
      this.form.controls.idCentroCosto.disable({ emitEvent: false });
      return;
    }

    this.form.controls.codigoMateria.setValue('');

    if (!this.form.controls.usarPrograma.value) {
      this.form.controls.idCentroCosto.setValue('');
      this.form.controls.idCentroCosto.disable({ emitEvent: false });
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    const raw = this.form.getRawValue();

    if (!raw.idCoordinacion) {
      return;
    }

    if (this.form.invalid) {
      return;
    }

    this.saveAssociation.emit({
      id: this.association()?.id ?? null,
      idCoordinacion: Number(raw.idCoordinacion),
      idPrograma: raw.usarPrograma && raw.idPrograma ? Number(raw.idPrograma) : null,
      codigoMateria: raw.usarMateria && raw.codigoMateria ? raw.codigoMateria : null,
      idCentroCosto:
        raw.usarPrograma && raw.idCentroCosto ? Number(raw.idCentroCosto) : null,
      estado: raw.estado ? '1' : '0',
    });
  }

  private patchForm(): void {
    const item = this.association();
    const idCoordinacion = item?.idCoordinacion ?? this.selectedCoordinationId();

    const hasProgram = item?.idPrograma != null;
    const hasSubject = !!item?.codigoMateria;

    this.form.reset({
      idCoordinacion: idCoordinacion != null ? String(idCoordinacion) : '',
      usarPrograma: hasProgram,
      idPrograma: item?.idPrograma != null ? String(item.idPrograma) : '',
      usarMateria: hasSubject,
      codigoMateria: item?.codigoMateria ?? '',
      idCentroCosto:
        hasProgram && item?.idCentroCosto != null ? String(item.idCentroCosto) : '',
      estado: this.isActive(item?.estado),
    });

    this.form.controls.idCoordinacion.disable({ emitEvent: false });

    if (hasProgram) {
      this.form.controls.idCentroCosto.enable({ emitEvent: false });
    } else {
      this.form.controls.idCentroCosto.disable({ emitEvent: false });
    }
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