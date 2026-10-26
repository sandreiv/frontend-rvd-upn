import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnChanges,
  Output,
  SimpleChanges,
  input,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Button } from '../../../../../shared/ui/button/button';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import {
  Option,
  Select,
} from '../../../../../shared/components/form/select/select';
import {
  NOVELTY_ACTION_OPTIONS,
  NOVELTY_COMPONENT_OPTIONS,
  NoveltyAction,
  NoveltyFormData,
  NoveltyItem,
} from '../../model/novelties.model';
import { Checkbox } from '../../../../../shared/components/form/input/checkbox';
import { NoveltyComponentKey } from '../../../../configuration/professor-preload/model/novelties.model';

type NoveltyFormGroup = FormGroup<{
  tipo: FormControl<string>;
  descripcion: FormControl<string>;
  accion: FormControl<string>;
  componente: FormControl<NoveltyComponentKey | null>;
  forPlanta: FormControl<boolean>;
}>;

@Component({
  selector: 'app-novelties-form',
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
    Select,
    Button,
    Checkbox
  ],
  templateUrl: './novelties-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NoveltiesForm implements OnChanges {
  novelty = input<NoveltyItem | null>(null);
  isSaving = input(false);

  @Output()
  cancel = new EventEmitter<void>();

  @Output()
  saveNovelty =
    new EventEmitter<NoveltyFormData>();

  readonly actionOptions: Option[] = NOVELTY_ACTION_OPTIONS;

  readonly componentOptions: Option[] = NOVELTY_COMPONENT_OPTIONS;

  readonly form: NoveltyFormGroup =
    new FormGroup({
      tipo: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(150),
        ],
      }),

      descripcion: new FormControl('', {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.maxLength(250),
        ],
      }),

      accion: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),

      componente: new FormControl<NoveltyComponentKey|null>(null),

      forPlanta: new FormControl(false, {
        nonNullable: true,
      }),
    });

  ngOnChanges(
    changes: SimpleChanges,
  ): void {
    if (changes['novelty']) {
      this.patchForm();
    }
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (
      this.form.invalid ||
      this.isSaving()
    ) {
      return;
    }

    const raw =
      this.form.getRawValue();

    this.saveNovelty.emit({
      tipo: raw.tipo.trim(),
      descripcion:
        raw.descripcion.trim(),
      accion:
        raw.accion as NoveltyAction,
      componente: raw.componente,
      forPlanta: raw.forPlanta ? '1' : '0',
    });
  }

  private patchForm(): void {
    const item = this.novelty();

    this.form.reset({
      tipo: item?.tipo ?? '',
      descripcion:
        item?.descripcion ?? '',
      accion:
        item?.accion != null
          ? String(item.accion)
              .toUpperCase()
          : '',
      componente: item?.componente ?? null,
      forPlanta: this.isPlantaEnabled(item?.forPlanta)
    });
  }

  private isPlantaEnabled(value: NoveltyItem['forPlanta'] | undefined): boolean {
    if (value == null || value === '') {
      return false;
    }

    const normalized = String(value).trim().toUpperCase();

    return (
      normalized === '1' ||
      normalized === 'S' ||
      normalized === 'SI' ||
      normalized === 'SÍ' ||
      normalized === 'TRUE'
    );
  }
}