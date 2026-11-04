import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';

import { Button } from '../../../../../shared/ui/button/button';
import { Checkbox } from '../../../../../shared/components/form/input/checkbox';
import { CollapsibleSection } from '../../../../../shared/components/form/collapsible-section/collapsible-section';
import { DateRangePicker } from '../../../../../shared/components/form/date-range-picker/date-range-picker';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../shared/components/form/label/label';
import { Option as SelectOption, Select } from '../../../../../shared/components/form/select/select';
import { formatSentenceValue } from '../../../../../shared/utils/normalized-text.util';

import { PreloadCallService } from '../../data/preload-call.service';
import {
  ClasificacionDocenteItem,
  ConvocatoriaFormularioDTO,
  DedicacionDocenteItem,
  PeriodoExtensionDTO,
  TipoHorasItem,
  TipoVinculacionConvocatoriaItem,
  TipoVinculacionDTO,
  UniversityPeriodItem,
} from '../../model/preload-call.model';

@Component({
  selector: 'app-preload-call-form',
  imports: [
    ReactiveFormsModule,
    InputField,
    Label,
    Checkbox,
    Select,
    Button,
    Icon,
    CollapsibleSection,
    DateRangePicker,
  ],
  templateUrl: './preload-call-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreloadCallForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly preloadCallService = inject(PreloadCallService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly universityPeriods = signal<UniversityPeriodItem[]>([]);
  private readonly tiposVinculacionCatalog = signal<TipoVinculacionDTO[]>([]);

  readonly mode = input<'create' | 'edit' | 'read'>('create');
  readonly preloadCall = input<ConvocatoriaFormularioDTO | null>(null);
  readonly isSaving = input<boolean>(false);

  readonly submitPreloadCall = output<ConvocatoriaFormularioDTO>();
  readonly closeForm = output<void>();

  readonly isReadOnly = computed(() => this.mode() === 'read');
  readonly submitButtonLabel = computed(() => (this.mode() === 'edit' ? 'Actualizar' : 'Guardar'));

  readonly callInfoSectionExpanded = signal(true);
  readonly vinculacionSectionExpanded = signal(true);
  readonly periodoExtensionSectionExpanded = signal(true);
  readonly saveError = signal<string | null>(null);

  readonly vinculaciones = signal<TipoVinculacionConvocatoriaItem[]>([]);
  readonly selectedTipoVinculacionId = signal('');

  readonly periodosExtension = signal<PeriodoExtensionDTO[]>([]);
  readonly selectedPeriodoExtensionId = signal('');

  readonly clasificacionesDocente = signal<ClasificacionDocenteItem[]>([]);
  readonly dedicacionesDocente = signal<DedicacionDocenteItem[]>([]);
  readonly tiposHoras = signal<TipoHorasItem[]>([]);

  readonly showNewTipoVinculacionForm = signal(false);
  readonly isCreatingTipo = signal(false);
  readonly selectedNewClasificacionId = signal('');
  readonly selectedNewDedicacionId = signal('');
  readonly newTipoHoras = signal('SEMANAL');
  readonly newTipoContrato = signal('');
  readonly newFormaPago = signal('');
  readonly newMinimo = signal('');
  readonly newMaximo = signal('');
  readonly newEsPlanta = signal(false);

  setSelectedNewClasificacionId(val: string | number): void {
    this.selectedNewClasificacionId.set(String(val ?? ''));
  }

  setSelectedNewDedicacionId(val: string | number): void {
    this.selectedNewDedicacionId.set(String(val ?? ''));
  }

  setNewTipoHoras(val: string | number): void {
    this.newTipoHoras.set(String(val ?? ''));
  }

  setNewTipoContrato(val: string | number): void {
    this.newTipoContrato.set(String(val ?? ''));
  }

  setNewFormaPago(val: string | number): void {
    this.newFormaPago.set(String(val ?? ''));
  }

  setNewMinimo(val: string | number): void {
    this.newMinimo.set(String(val ?? ''));
  }

  setNewMaximo(val: string | number): void {
    this.newMaximo.set(String(val ?? ''));
  }

  setNewEsPlanta(val: boolean): void {
    this.newEsPlanta.set(val);
  }

  readonly form = this.fb.group({
    id: this.fb.control<number | null>(null),
    nombre: this.fb.nonNullable.control('', [Validators.required]),
    descripcion: this.fb.nonNullable.control(''),
    idPeriodoUniversidad: this.fb.nonNullable.control('', [Validators.required]),
    esIntersemestral: this.fb.nonNullable.control(false),
    fechaInicio: this.fb.nonNullable.control('', [Validators.required]),
    fechaFin: this.fb.nonNullable.control('', [Validators.required]),
    idRelacion: this.fb.control<number | null>(null),
  });

  readonly selectedMainPeriodId = toSignal(
    this.form.controls.idPeriodoUniversidad.valueChanges,
    { initialValue: this.form.controls.idPeriodoUniversidad.value }
  );

  readonly selectedMainPeriod = computed(() => {
    const idStr = this.selectedMainPeriodId();
    if (!idStr) return null;
    const id = Number(idStr);
    return this.universityPeriods().find((p) => p.id === id) ?? null;
  });

  readonly mainPeriodYear = computed(() => {
    const period = this.selectedMainPeriod();
    if (!period) return null;
    return period.anio ?? period.ano ?? null;
  });

  readonly universityPeriodOptions = computed((): SelectOption[] =>
    this.universityPeriods().map((period) => {
      const anio = period.anio ?? period.ano ?? '';
      const codigo = period.codigoPeriodo ? ` (${period.codigoPeriodo})` : '';
      return {
        value: String(period.id),
        label: `${anio} - ${period.periodo}${codigo}`,
      };
    }),
  );

  readonly availablePeriodoExtensionOptions = computed((): SelectOption[] => {
    const mainPeriod = this.selectedMainPeriod();
    if (!mainPeriod) return [];
    const year = this.mainPeriodYear();
    if (!year) return [];
    const semester = mainPeriod.periodo;

    const assignedIds = new Set(this.periodosExtension().map((p) => p.idPeriodoUniversidad));
    assignedIds.add(mainPeriod.id);

    return this.universityPeriods()
      .filter((p) => {
        const pYear = p.anio ?? p.ano;
        const pSemester = p.periodo;
        return pYear === year && pSemester === semester && !assignedIds.has(p.id);
      })
      .map((p) => {
        const anio = p.anio ?? p.ano ?? '';
        const codigo = p.codigoPeriodo ? ` (${p.codigoPeriodo})` : '';
        return {
          value: String(p.id),
          label: `${anio} - ${p.periodo}${codigo}`,
        };
      });
  });

  getTipoVinculacionNombre(idTipoVinculacion: number): string {
    const tivi = this.tiposVinculacionCatalog().find((t) => t.id === idTipoVinculacion);
    if (!tivi) return `Vinculación #${idTipoVinculacion}`;
    const cldo = this.clasificacionesDocente().find((c) => c.id === tivi.idClasificacionDocente)?.descripcion;
    const dedo = this.dedicacionesDocente().find((d) => d.id === tivi.idDedicacionDocente)?.descripcion;
    let base = `Vinculación #${tivi.id}`;
    if (cldo && dedo) {
      base = `${formatSentenceValue(cldo)} - ${formatSentenceValue(dedo)}`;
    } else if (cldo) {
      base = formatSentenceValue(cldo);
    } else if (dedo) {
      base = formatSentenceValue(dedo);
    } else if (tivi.tipoContrato) {
      base = formatSentenceValue(tivi.tipoContrato);
    }
    return tivi.esPlanta === 1 ? `${base} (Planta)` : base;
  }

  getEsPlanta(idTipoVinculacion: number): boolean {
    const tivi = this.tiposVinculacionCatalog().find((t) => t.id === idTipoVinculacion);
    return tivi?.esPlanta === 1;
  }

  readonly availableTipoVinculacionOptions = computed((): SelectOption[] => {
    const assignedIds = new Set(this.vinculaciones().map((v) => v.idTipoVinculacion));
    return this.tiposVinculacionCatalog()
      .filter((tivi) => !assignedIds.has(tivi.id))
      .map((tivi) => ({
        value: String(tivi.id),
        label: this.getTipoVinculacionNombre(tivi.id),
      }));
  });

  readonly clasificacionDocenteOptions = computed((): SelectOption[] =>
    this.clasificacionesDocente().map((c) => ({
      value: String(c.id),
      label: formatSentenceValue(c.descripcion),
    })),
  );

  readonly dedicacionDocenteOptions = computed((): SelectOption[] =>
    this.dedicacionesDocente().map((d) => ({
      value: String(d.id),
      label: formatSentenceValue(d.descripcion),
    })),
  );

  readonly tipoHorasOptions = computed((): SelectOption[] =>
    this.tiposHoras().map((th) => ({
      value: th.valor,
      label: th.descripcion,
    })),
  );

  constructor() {
    effect(() => {
      const detail = this.preloadCall();
      if (!detail) {
        return;
      }

      this.form.patchValue({
        id: detail.id ?? null,
        nombre: detail.nombre ?? '',
        descripcion: detail.descripcion ?? '',
        idPeriodoUniversidad: detail.idPeriodoUniversidad ? String(detail.idPeriodoUniversidad) : '',
        esIntersemestral: detail.esIntersemestral === '1',
        fechaInicio: detail.fechaInicio ? this.normalizeDateString(detail.fechaInicio) : '',
        fechaFin: detail.fechaFin ? this.normalizeDateString(detail.fechaFin) : '',
        idRelacion: detail.idRelacion ?? null,
      });

      this.vinculaciones.set(detail.vinculaciones ?? []);
      this.periodosExtension.set(detail.periodosExtension ?? []);
    });

    effect(() => {
      if (this.isReadOnly()) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    });
  }

  ngOnInit(): void {
    forkJoin({
      periods: this.preloadCallService.getUniversityPeriod(),
      vinculaciones: this.preloadCallService.getTiposVinculacion(),
      clasificaciones: this.preloadCallService.getClasificacionesDocente(),
      dedicaciones: this.preloadCallService.getDedicacionesDocente(),
      tiposHoras: this.preloadCallService.getTiposHoras(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ periods, vinculaciones, clasificaciones, dedicaciones, tiposHoras }) => {
          this.universityPeriods.set(periods ?? []);
          this.tiposVinculacionCatalog.set(vinculaciones ?? []);
          this.clasificacionesDocente.set(clasificaciones ?? []);
          this.dedicacionesDocente.set(dedicaciones ?? []);
          this.tiposHoras.set(tiposHoras ?? []);
        },
        error: (err) => {
          console.error('Error cargando catálogos de convocatoria:', err);
        },
      });
  }

  onSelectTipoVinculacion(value: string): void {
    if (!value) return;
    const selectedId = Number(value);
    if (!selectedId) return;

    const catalogItem = this.tiposVinculacionCatalog().find((t) => t.id === selectedId);
    if (!catalogItem) return;

    const current = this.vinculaciones();
    if (!current.some((v) => v.idTipoVinculacion === selectedId)) {
      this.vinculaciones.set([
        ...current,
        {
          id: null,
          idTipoVinculacion: selectedId,
          nombreTipoVinculacion: this.getTipoVinculacionNombre(selectedId),
          estado: 'ACTIVO',
        },
      ]);
    }
    this.selectedTipoVinculacionId.set('');
  }

  removeVinculacion(idTipoVinculacion: number): void {
    this.vinculaciones.update((items) =>
      items.filter((item) => item.idTipoVinculacion !== idTipoVinculacion),
    );
  }

  onSelectPeriodoExtension(value: string): void {
    if (!value) return;
    const selectedId = Number(value);
    if (!selectedId) return;

    const periodItem = this.universityPeriods().find((p) => p.id === selectedId);
    if (!periodItem) return;

    const anio = periodItem.anio ?? periodItem.ano ?? '';
    const codigo = periodItem.codigoPeriodo ? ` (${periodItem.codigoPeriodo})` : '';
    const current = this.periodosExtension();
    if (!current.some((p) => p.idPeriodoUniversidad === selectedId)) {
      this.periodosExtension.set([
        ...current,
        {
          id: null,
          idPeriodoUniversidad: selectedId,
          nombrePeriodo: `${anio} - ${periodItem.periodo}${codigo}`,
        },
      ]);
    }
    this.selectedPeriodoExtensionId.set('');
  }

  removePeriodoExtension(idPeriodoUniversidad: number): void {
    this.periodosExtension.update((items) =>
      items.filter((item) => item.idPeriodoUniversidad !== idPeriodoUniversidad),
    );
  }

  getPeriodoExtensionNombre(idPeriodoUniversidad: number): string {
    const current = this.periodosExtension().find((p) => p.idPeriodoUniversidad === idPeriodoUniversidad);
    if (current?.nombrePeriodo) return current.nombrePeriodo;
    const period = this.universityPeriods().find((p) => p.id === idPeriodoUniversidad);
    if (!period) return `Periodo #${idPeriodoUniversidad}`;
    const anio = period.anio ?? period.ano ?? '';
    const codigo = period.codigoPeriodo ? ` (${period.codigoPeriodo})` : '';
    return `${anio} - ${period.periodo}${codigo}`;
  }

  toggleNewTipoVinculacionForm(): void {
    this.showNewTipoVinculacionForm.update((v) => !v);
  }

  onCreateCustomTipoVinculacion(): void {
    const cldoId = Number(this.selectedNewClasificacionId());
    const dedoId = Number(this.selectedNewDedicacionId());
    if (!cldoId || !dedoId) {
      return;
    }

    const payload: TipoVinculacionDTO = {
      id: 0,
      idClasificacionDocente: cldoId,
      idDedicacionDocente: dedoId,
      minimo: this.newMinimo().trim() ? Number(this.newMinimo()) : 0,
      maximo: this.newMaximo().trim() ? Number(this.newMaximo()) : 40,
      tipoHoras: this.newTipoHoras(),
      formaPago: this.newFormaPago().trim() || null,
      tipoContrato: this.newTipoContrato().trim() || null,
      esPlanta: this.newEsPlanta() ? 1 : 0,
    };

    this.isCreatingTipo.set(true);
    this.preloadCallService.createTipoVinculacion(payload).subscribe({
      next: (created) => {
        this.isCreatingTipo.set(false);
        this.tiposVinculacionCatalog.update((list) => [...list, created]);

        const current = this.vinculaciones();
        if (!current.some((v) => v.idTipoVinculacion === created.id)) {
          this.vinculaciones.set([
            ...current,
            {
              id: null,
              idTipoVinculacion: created.id,
              nombreTipoVinculacion: this.getTipoVinculacionNombre(created.id),
              estado: 'ACTIVO',
            },
          ]);
        }

        this.selectedNewClasificacionId.set('');
        this.selectedNewDedicacionId.set('');
        this.newTipoHoras.set('SEMANAL');
        this.newTipoContrato.set('');
        this.newFormaPago.set('');
        this.newMinimo.set('');
        this.newMaximo.set('');
        this.newEsPlanta.set(false);
        this.showNewTipoVinculacionForm.set(false);
      },
      error: (err) => {
        this.isCreatingTipo.set(false);
        console.error('Error al registrar nuevo tipo de vinculación:', err);
      },
    });
  }

  getHorasRange(idTipoVinculacion: number): string {
    const item = this.tiposVinculacionCatalog().find((t) => t.id === idTipoVinculacion);
    if (!item) return '-';
    const min = item.minimo != null ? `${item.minimo}` : '0';
    const max = item.maximo != null ? `${item.maximo}` : 'N/A';
    const tipo = item.tipoHoras ? ` (${formatSentenceValue(item.tipoHoras)})` : '';
    return `${min} - ${max} hrs${tipo}`;
  }

  getFormaPago(idTipoVinculacion: number): string {
    const item = this.tiposVinculacionCatalog().find((t) => t.id === idTipoVinculacion);
    return item?.formaPago ? formatSentenceValue(item.formaPago) : '-';
  }

  getTipoContrato(idTipoVinculacion: number): string {
    const item = this.tiposVinculacionCatalog().find((t) => t.id === idTipoVinculacion);
    return item?.tipoContrato ? formatSentenceValue(item.tipoContrato) : '-';
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.saveError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.saveError.set('Por favor complete todos los campos obligatorios.');
      return;
    }

    const raw = this.form.getRawValue();
    const payload: ConvocatoriaFormularioDTO = {
      id: raw.id,
      idPeriodoUniversidad: Number(raw.idPeriodoUniversidad),
      idRelacion: raw.idRelacion,
      nombre: raw.nombre.trim(),
      descripcion: raw.descripcion ? raw.descripcion.trim() : null,
      fechaInicio: raw.fechaInicio,
      fechaFin: raw.fechaFin,
      estado: '1',
      esIntersemestral: raw.esIntersemestral ? '1' : '0',
      vinculaciones: this.vinculaciones(),
      periodosExtension: this.periodosExtension(),
    };

    this.submitPreloadCall.emit(payload);
  }

  private normalizeDateString(dateValue: string): string {
    if (!dateValue) return '';
    return dateValue.split('T')[0];
  }
}
