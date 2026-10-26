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
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Button } from '../../../../../../shared/ui/button/button';
import { Checkbox } from '../../../../../../shared/components/form/input/checkbox';
import { Label } from '../../../../../../shared/components/form/label/label';
import {
  TypeaheadOption,
  TypeaheadSelect,
} from '../../../../../../shared/components/form/typeahead-select/typeahead-select';
import {
  CatalogOptionItem,
  PersonCoordinationFormData,
  PersonCoordinationItem,
} from '../../../model/coordination-administration.model';

type PersonCoordinationFormGroup = FormGroup<{
  idPersonaGeneral: FormControl<string>;
  idCoordinacion: FormControl<string>;
  estado: FormControl<boolean>;
}>;

@Component({
  selector: 'app-person-coordination-form',
  imports: [ReactiveFormsModule, Label, TypeaheadSelect, Checkbox, Button],
  templateUrl: './person-coordination-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PersonCoordinationForm implements OnChanges {
  assignment = input<PersonCoordinationItem | null>(null);
  selectedCoordinationId = input<number | null>(null);
  people = input<CatalogOptionItem[]>([]);
  coordinations = input<CatalogOptionItem[]>([]);

  title = input('Nueva persona');
  editTitle = input('Editar persona');
  description = input('Selecciona la persona y el estado.');
  personLabel = input('Persona');
  personPlaceholder = input('Buscar persona...');
  statusTitle = input('Estado de la persona');
  statusDescription = input('Define si esta relación quedará activa para su uso en el sistema.');

  isSaving = input(false);

  @Output() cancel = new EventEmitter<void>();
  @Output() saveAssignment = new EventEmitter<PersonCoordinationFormData>();

  readonly filteredPeople = signal<CatalogOptionItem[]>([]);
  readonly submitted = signal(false);
  readonly personFieldBlurred = signal(false);

  readonly form: PersonCoordinationFormGroup = new FormGroup({
    idPersonaGeneral: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idCoordinacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    estado: new FormControl(true, { nonNullable: true }),
  });

  readonly personOptionAdapter = (item: unknown): TypeaheadOption => {
    const person = item as CatalogOptionItem;

    return {
      value: String(person.id),
      label: person.label,
      secondaryLabel: undefined,
      data: person,
    };
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['assignment'] ||
      changes['selectedCoordinationId'] ||
      changes['people']
    ) {
      this.patchForm();
    }
  }

  onSearchPerson(term: string): void {
    const normalizedTerm = this.normalize(term);

    if (normalizedTerm.length < 2) {
      this.filteredPeople.set([]);
      return;
    }

    const rows = this.people()
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

    this.filteredPeople.set(rows);
  }

  markPersonFieldBlurred(): void {
    this.personFieldBlurred.set(true);
  }

  shouldShowPersonRequiredError(): boolean {
    return (
      this.form.controls.idPersonaGeneral.invalid &&
      (this.submitted() || this.personFieldBlurred())
    );
  }

  personRequiredMessage(): string {
    return `${this.personLabel()} es obligatorio.`;
  }

  onSubmit(): void {
    this.submitted.set(true);
    this.form.markAllAsTouched();

    const raw = this.form.getRawValue();

    if (!raw.idCoordinacion) {
      return;
    }

    if (this.form.invalid) {
      return;
    }

    this.saveAssignment.emit({
      idPersonaGeneral: Number(raw.idPersonaGeneral),
      idCoordinacion: Number(raw.idCoordinacion),
      estado: raw.estado ? '1' : '0',
    });
  }

  private patchForm(): void {
    this.submitted.set(false);
    this.personFieldBlurred.set(false);

    const item = this.assignment();
    const idCoordinacion = item?.idCoordinacion ?? this.selectedCoordinationId();

    this.form.reset({
      idPersonaGeneral: item?.idPersonaGeneral != null ? String(item.idPersonaGeneral) : '',
      idCoordinacion: idCoordinacion != null ? String(idCoordinacion) : '',
      estado: this.isActive(item?.estado),
    });

    this.form.controls.idCoordinacion.disable({ emitEvent: false });

    const selectedPerson =
      item?.idPersonaGeneral != null
        ? this.findOrBuildSelectedPerson(item)
        : null;

    this.filteredPeople.set(selectedPerson ? [selectedPerson] : []);
    
  }

  private findOrBuildSelectedPerson(item: PersonCoordinationItem): CatalogOptionItem {
    const found = this.people().find((person) => person.id === item.idPersonaGeneral);

    if (found) {
      return found;
    }

    const documento = item.documentoIdentidad ? `${item.documentoIdentidad} - ` : '';

    return {
      id: item.idPersonaGeneral,
      label: `${documento}${item.persona}`,
      codigo: item.documentoIdentidad ?? null,
    };
  }

  private normalize(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  private isActive(value: PersonCoordinationItem['estado'] | undefined): boolean {
    if (value == null || value === '') {
      return true;
    }

    const normalized = String(value).trim().toUpperCase();

    return normalized === '1' || normalized === 'ACTIVO' || normalized === 'A';
  }
}