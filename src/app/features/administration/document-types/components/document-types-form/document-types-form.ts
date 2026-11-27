import { ChangeDetectionStrategy, Component, EventEmitter, input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from "@angular/forms";
import { DocumentTypesFormData, DocumentTypesItem } from "../../model/document-types.model";
import { Label } from "../../../../../shared/components/form/label/label";
import { Checkbox } from "../../../../../shared/components/form/input/checkbox";
import { Button } from "../../../../../shared/ui/button/button";
import { InputField } from "../../../../../shared/components/form/input/input-field";

type DocumentTypesFormGroup = FormGroup<{
  nombre: FormControl<string>;
  descripcion: FormControl<string>;
  esObligatorio: FormControl<boolean>;
}>

@Component({
  selector: 'app-document-types-form',
  imports: [ReactiveFormsModule, Label, InputField, Checkbox, Button],
  templateUrl: './document-types-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DocumentTypesForm implements OnChanges {

  item = input<DocumentTypesItem|null>(null);
  isSaving = input(false);

  @Output()
  cancel = new EventEmitter<void>();
  @Output()
  saveItem = new EventEmitter<DocumentTypesFormData>();

  readonly form: DocumentTypesFormGroup = new FormGroup({
    nombre: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    descripcion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required]
    }),
    esObligatorio: new FormControl(false, {
      nonNullable: true
    })
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['item']) {
      this.patchForm();
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid || this.isSaving()) {
      return;
    }

    const raw = this.form.getRawValue();
    this.saveItem.emit({
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion.trim(),
      esObligatorio: raw.esObligatorio ? '1' : '0'
    });
  }

  
  private patchForm(): void {
    const item = this.item();

    this.form.reset({
      nombre: item?.nombre ?? '',
      descripcion: item?.descripcion ?? '',
      esObligatorio: this.isChecked(item?.esObligatorio)
    });
  }

  private isChecked(value: string|null|undefined): boolean {
    const normalized = String(value ?? '').trim().toUpperCase();

    return normalized === '1' ||
      normalized === 'S' ||
      normalized === 'SI' ||
      normalized === 'TRUE';
  }
}