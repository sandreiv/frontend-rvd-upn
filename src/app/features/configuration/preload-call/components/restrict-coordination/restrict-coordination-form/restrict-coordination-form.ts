import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { PreloadCallService } from '../../../data/preload-call.service';
import { Button } from '../../../../../../shared/ui/button/button';
import { Checkbox } from '../../../../../../shared/components/form/input/checkbox';
import { Label } from '../../../../../../shared/components/form/label/label';
import { DateRangePicker } from '../../../../../../shared/components/form/date-range-picker/date-range-picker';
import {
  TypeaheadOption,
  TypeaheadSelect,
} from '../../../../../../shared/components/form/typeahead-select/typeahead-select';
import {
  RestrictCoordinationFormData,
  RestrictCoordinationItem,
} from '../../../model/preload-call.model';

export interface CoordinationOption {
  id: number;
  nombre: string;
  descripcion?: string | null;
  codigo?: string | null;
}

@Component({
  selector: 'app-restrict-coordination-form',
  imports: [
    ReactiveFormsModule,
    Label,
    TypeaheadSelect,
    Checkbox,
    Button,
    DateRangePicker,
  ],
  templateUrl: './restrict-coordination-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestrictCoordinationForm {
  private readonly preloadCallService = inject(PreloadCallService);
  private readonly searchTerm$ = new Subject<string>();

  readonly restriction = input<RestrictCoordinationItem | null>(null);
  readonly isSaving = input(false);
  readonly idConvocatoria = input<number | null>(null);

  readonly cancel = output<void>();
  readonly saveRestriction = output<RestrictCoordinationFormData>();
  readonly filteredCoordinations = signal<CoordinationOption[]>([]);

  readonly form = new FormGroup({
    idCoordinacion: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    fechaInicio: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    fechaFin: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    estado: new FormControl(true, {
      nonNullable: true,
    }),
  });

  constructor() {
    this.searchTerm$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((term) =>
          this.preloadCallService
            .searchCoordination(term, this.idConvocatoria())
            .pipe(catchError(() => of([] as CoordinationOption[]))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((rows) => this.filteredCoordinations.set(rows.slice(0, 20)));

    effect(() => {
      this.patchForm(this.restriction());
    });
  }

  readonly coordinationOptionAdapter = (item: unknown): TypeaheadOption => {
    const option = item as CoordinationOption;
    return {
      value: String(option.id),
      label: option.nombre,
      data: option,
    };
  };

  onSearchCoordination(term: string): void {
    const normalized = term.trim();

    if (normalized.length < 2) {
      this.filteredCoordinations.set([]);
      return;
    }

    this.searchTerm$.next(normalized);
  }

  onSubmit(): void {
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const raw = this.form.getRawValue();

    this.saveRestriction.emit({
      idConvocatoria: null,
      idCoordinacion: Number(raw.idCoordinacion),
      idFechasConvocatoria: null,
      fechaInicio: raw.fechaInicio,
      fechaFin: raw.fechaFin,
      estado: raw.estado ? '1' : '0',
    });
  }

  private patchForm(item: RestrictCoordinationItem | null): void {
    if (!item) {
      this.form.reset({
        idCoordinacion: '',
        fechaInicio: '',
        fechaFin: '',
        estado: true,
      });
      this.filteredCoordinations.set([]);
      return;
    }

    const coordination: CoordinationOption = {
      id: item.coordinacion.id,
      nombre: item.coordinacion.nombre,
      descripcion: item.coordinacion.descripcion,
      codigo: item.coordinacion.codigo,
    };

    this.filteredCoordinations.set([coordination]);
    this.form.reset({
      idCoordinacion: String(item.coordinacion.id),
      fechaInicio: this.toDateOnly(item.fechaInicio),
      fechaFin: this.toDateOnly(item.fechaFin),
      estado: this.isActive(item.estado),
    });
  }

  private toDateOnly(value: string | null | undefined): string {
    if (!value) {
      return '';
    }

    return value.includes('T') ? value.slice(0, 10) : value;
  }

  private isActive(value: string | null | undefined): boolean {
    if (value == null || value === '') {
      return true;
    }

    const normalized = String(value).trim().toUpperCase();
    return (
      normalized === '1' ||
      normalized === 'ACTIVO'
    );
  }
}
