import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  OnChanges,
  Output,
  SimpleChanges,
  computed,
  input,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import {
  Option,
  Select,
} from '../../../../../shared/components/form/select/select';
import { Button } from '../../../../../shared/ui/button/button';
import {
  CatalogoOpcion,
  ESTADO_OPTIONS,
  VinculacionActividadFormData,
  VinculacionActividadItem,
} from '../../model/vinculacion-actividades.model';

type VinculacionActividadFormGroup =
  FormGroup<{
    idTipoVinculacion: FormControl<string | null>;
    idTipoActividad: FormControl<string | null>;
    estado: FormControl<string | null>;
    minimoHoras: FormControl<string | null>;
    maximoHoras: FormControl<string | null>;
  }>;

const HORAS_PATTERN = /^\d{1,3}([.,]\d{1,2})?$/;

@Component({
  selector: 'app-vinculacion-actividades-form',
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
    Select,
    Button,
  ],
  templateUrl:
    './vinculacion-actividades-form.html',
  changeDetection:
    ChangeDetectionStrategy.OnPush,
})
export class VinculacionActividadesForm
  implements OnChanges {

  item =
    input<VinculacionActividadItem | null>(
      null,
    );

  isSaving = input(false);

  tiposVinculacion =
    input<CatalogoOpcion[]>([]);

  tiposActividad =
    input<CatalogoOpcion[]>([]);

  @Output()
  cancel =
    new EventEmitter<void>();

  @Output()
  saveItem =
    new EventEmitter<VinculacionActividadFormData>();

  readonly estadoOptions =
    ESTADO_OPTIONS;

  readonly tipoVinculacionOptions =
    computed<Option[]>(() =>
      this.tiposVinculacion().map(
        (opcion) => ({
          value: String(opcion.id),
          label: opcion.nombre,
        }),
      ),
    );

  readonly tipoActividadOptions =
    computed<Option[]>(() =>
      this.tiposActividad().map(
        (opcion) => ({
          value: String(opcion.id),
          label: opcion.nombre,
          group:
            opcion.grupo?.trim() ||
            undefined,
        }),
      ),
    );

  readonly form:
    VinculacionActividadFormGroup =
      new FormGroup({
        idTipoVinculacion:
          new FormControl<string | null>(
            null,
            {
              validators: [
                Validators.required,
              ],
            },
          ),

        idTipoActividad:
          new FormControl<string | null>(
            null,
            {
              validators: [
                Validators.required,
              ],
            },
          ),

        estado:
          new FormControl<string | null>(
            '1',
            {
              validators: [
                Validators.required,
              ],
            },
          ),

        minimoHoras:
          new FormControl<string | null>(
            null,
            {
              validators: [
                Validators.pattern(
                  HORAS_PATTERN,
                ),
                Validators.maxLength(30),
              ],
            },
          ),

        maximoHoras:
          new FormControl<string | null>(
            null,
            {
              validators: [
                Validators.pattern(
                  HORAS_PATTERN,
                ),
                Validators.maxLength(30),
              ],
            },
          ),
      });

  ngOnChanges(
    changes: SimpleChanges,
  ): void {

    if (changes['item']) {
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

    this.saveItem.emit({
      idTipoVinculacion:
        raw.idTipoVinculacion
          ? Number(raw.idTipoVinculacion)
          : null,

      idTipoActividad:
        raw.idTipoActividad
          ? Number(raw.idTipoActividad)
          : null,

      estado:
        raw.estado === '0'
          ? '0'
          : '1',

      minimoHoras:
        raw.minimoHoras?.trim() || null,

      maximoHoras:
        raw.maximoHoras?.trim() || null,
    });
  }

  private patchForm(): void {
    const item = this.item();

    this.form.reset({
      idTipoVinculacion:
        item?.idTipoVinculacion != null
          ? String(item.idTipoVinculacion)
          : null,

      idTipoActividad:
        item?.idTipoActividad != null
          ? String(item.idTipoActividad)
          : null,

      estado:
        item?.estado === '0'
          ? '0'
          : '1',

      minimoHoras:
        item?.minimoHoras ?? null,

      maximoHoras:
        item?.maximoHoras ?? null,
    });
  }
}
