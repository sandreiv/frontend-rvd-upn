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
  CostCenterAssignmentFormData,
  CostCenterAssignmentItem,
} from '../../../model/coordination-administration.model';

type CostCenterForm = FormGroup<{
  idCoordinacion: FormControl<string>;
  idCentroCosto: FormControl<string>;
  estado: FormControl<boolean>;
}>;

@Component({
  selector: 'app-cost-center-assignment-form',
  imports: [ReactiveFormsModule, Label, Select, Checkbox, Button],
  templateUrl: './cost-center-assignment-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CostCenterAssignmentForm implements OnChanges {
  assignment = input<CostCenterAssignmentItem | null>(null);
  selectedCoordinationId = input<number | null>(null);
  coordinations = input<CatalogOptionItem[]>([]);
  costCenters = input<CatalogOptionItem[]>([]);
  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveAssignment = new EventEmitter<CostCenterAssignmentFormData>();

  readonly form: CostCenterForm = new FormGroup({
    idCoordinacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idCentroCosto: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    estado: new FormControl(true, { nonNullable: true }),
  });

  get coordinationOptions(): Option[] {
    return this.toOptions(this.coordinations());
  }

  get costCenterOptions(): Option[] {
    return this.toOptions(this.costCenters());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['assignment'] || changes['selectedCoordinationId']) {
      this.patchForm();
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();

    this.saveAssignment.emit({
      id: this.assignment()?.id ?? null,
      idCoordinacion: Number(raw.idCoordinacion),
      idCentroCosto: Number(raw.idCentroCosto),
      estado: raw.estado ? '1' : '0',
    });
  }

  private patchForm(): void {
    const item = this.assignment();
    const idCoordinacion = item?.idCoordinacion ?? this.selectedCoordinationId();

    this.form.reset({
      idCoordinacion: idCoordinacion != null ? String(idCoordinacion) : '',
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

  private isActive(value: CostCenterAssignmentItem['estado'] | undefined): boolean {
    if (value == null || value === '') {
      return true;
    }

    const normalized = String(value).trim().toUpperCase();

    return normalized === '1' || normalized === 'ACTIVO' || normalized === 'A';
  }
}