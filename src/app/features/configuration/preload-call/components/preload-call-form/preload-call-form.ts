import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import { CollapsibleSection } from '../../../../../shared/components/form/collapsible-section/collapsible-section';
import { DateRangePicker } from '../../../../../shared/components/form/date-range-picker/date-range-picker';
import { InputField } from '../../../../../shared/components/form/input/input-field';
import { Checkbox } from '../../../../../shared/components/form/input/checkbox';
import { Label } from '../../../../../shared/components/form/label/label';
import {
  Select,
  type Option as SelectOption,
} from '../../../../../shared/components/form/select/select';
import { formatSentenceValue } from '../../../../../shared/utils/normalized-text.util';
import { Button } from '../../../../../shared/ui/button/button';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { PreloadCallService } from '../../data/preload-call.service';
import { buildPreloadCallSavePayload } from '../../model/build-preload-call-save-payload.function';
import { PreloadCallSaveRequest } from '../../model/preload-call-save.model';
import {
  EducationalLevelItem,
  FechaFormMeta,
  isHiringContratacion,
  ModalityFormItem,
  ModalityItem,
  PersonaAutorizaConvocatoriaItem,
  PreloadCallDetailResponse,
  toContratacionValue,
  UniversityPeriodItem,
} from '../../model/preload-call.model';
import { ModalityFormModal } from '../modality-form-modal/modality-form-modal';
import { ModalityTable } from '../modality-table/modality-table';
import { PreloadCallPersonSearchModal } from '../preload-call-person-search-modal/preload-call-person-search-modal';

@Component({
  selector: 'app-preload-call-form',
  imports: [
    ReactiveFormsModule,
    Label,
    InputField,
    Checkbox,
    DateRangePicker,
    CollapsibleSection,
    Button,
    Icon,
    ModalityTable,
    ModalityFormModal,
    PreloadCallPersonSearchModal,
    Select,
  ],
  templateUrl: './preload-call-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreloadCallForm implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly preloadCallService = inject(PreloadCallService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly universityPeriods = signal<UniversityPeriodItem[]>([]);
  private readonly educationalLevels = signal<EducationalLevelItem[]>([]);
  private readonly modalityCatalog = signal<ModalityItem[]>([]);
  private readonly catalogsLoaded = signal(false);
  private lastSyncedDetailId: number | null = null;

  readonly mode = input<'create' | 'edit' | 'read'>('create');
  readonly preloadCall = input<PreloadCallDetailResponse | null>(null);
  readonly isSaving = input<boolean>(false);
  readonly closeForm = output<void>();
  readonly submitPreloadCall = output<PreloadCallSaveRequest>();

  readonly isReadOnly = computed(() => this.mode() === 'read');

  readonly submitButtonLabel = computed(() => {
    if (this.isSaving()) {
      return this.mode() === 'edit' ? 'Actualizando...' : 'Guardando...';
    }
    return this.mode() === 'edit' ? 'Actualizar' : 'Guardar';
  });

  readonly searchModalOpen = signal(false);
  readonly modalityModalOpen = signal(false);
  readonly editingModality = signal<ModalityFormItem | null>(null);
  readonly searchResults = signal<PersonaAutorizaConvocatoriaItem[]>([]);
  readonly fechasMeta = signal<FechaFormMeta[]>([]);
  readonly modalities = signal<ModalityFormItem[]>([]);
  readonly isSearching = signal(false);
  readonly saveError = signal<string | null>(null);
  readonly searchError = signal<string | null>(null);
  readonly authorizerSectionExpanded = signal(false);
  readonly callInfoSectionExpanded = signal(false);
  readonly modalitySectionExpanded = signal(false);
  readonly isHiringCall = signal(false);

  readonly universityPeriodOptions = computed<SelectOption[]>(() =>
    this.universityPeriods().map((item) => ({
      value: String(item.id),
      label: `${item.anio} - ${item.periodo}`,
    })),
  );

  readonly educationalLevelOptions = computed<SelectOption[]>(() =>
    this.educationalLevels().map((item) => ({
      value: String(item.id),
      label: formatSentenceValue(item.descripcion),
    })),
  );

  readonly modalitySelectOptions = computed<SelectOption[]>(() =>
    this.modalityCatalog().map((item) => ({
      value: String(item.id),
      label: formatSentenceValue(item.nombre),
    })),
  );

  readonly form = this.fb.group({
    idPersonaNaturalGeneral: [null as number | null],
    documentoIdentidad: [''],
    nombreCompleto: [''],
    telefonoCelular: [''],
    nombre: ['', Validators.required],
    descripcion: ['', Validators.required],
    fechaInicio: ['', Validators.required],
    fechaFin: ['', Validators.required],
    fechaInicioCtei: [''],
    fechaFinCtei: [''],
    fechaInicioIsu: [''],
    fechaFinIsu: [''],
    periodoUniversidad: ['', Validators.required],
    nivelEducativo: ['', Validators.required],
    esContratacion: [false],
  });

  constructor() {
    this.form.controls.esContratacion.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((checked) => this.onHiringCallChange(checked === true));

    effect(() => {
      const isCreateMode = this.mode() === 'create';
      this.authorizerSectionExpanded.set(!isCreateMode);
      this.callInfoSectionExpanded.set(!isCreateMode);
      this.modalitySectionExpanded.set(!isCreateMode);
    });

    effect(() => {
      const detail = this.preloadCall();
      const isCreateMode = this.mode() === 'create';

      if (!detail) {
        this.lastSyncedDetailId = null;
        if (isCreateMode) {
          this.resetFormState();
        }
        return;
      }

      if (!this.catalogsLoaded()) {
        return;
      }

      const detailId = detail.convocatoria.id ?? null;
      if (this.lastSyncedDetailId === detailId) {
        return;
      }

      this.lastSyncedDetailId = detailId;
      this.syncFormFromDetail(detail);
    });
  }

  private resetFormState(): void {
    this.form.reset({ esContratacion: false });
    this.fechasMeta.set([]);
    this.modalities.set([]);
    this.saveError.set(null);
    this.searchError.set(null);
    this.onHiringCallChange(false);
  }

  onHiringCallToggle(checked: boolean): void {
    this.form.controls.esContratacion.setValue(checked);
  }

  private onHiringCallChange(isHiring: boolean): void {
    this.isHiringCall.set(isHiring);
  }

  private syncFormFromDetail(detail: PreloadCallDetailResponse): void {
    const cnv = detail.fechas.find((fecha) => fecha.codigo === 'CNV');
    const CTEI = detail.fechas.find((fecha) => fecha.codigo === 'CTEI');
    const isu = detail.fechas.find((fecha) => fecha.codigo === 'ISU');

    this.fechasMeta.set(this.mapDetailFechasMeta(detail));

    this.form.patchValue({
      nombre: detail.convocatoria.nombre,
      descripcion: detail.convocatoria.descripcion,
      idPersonaNaturalGeneral: detail.convocatoria.autoriza.id,
      documentoIdentidad: detail.convocatoria.autoriza.documentoIdentidad,
      nombreCompleto: detail.convocatoria.autoriza.nombreCompleto,
      telefonoCelular: detail.convocatoria.autoriza.telefonoCelular ?? '',
      periodoUniversidad: String(detail.convocatoria.periodo.id),
      nivelEducativo: String(detail.convocatoria.nivelEducativo.id),
      fechaInicio: this.toDateOnly(cnv?.fechaInicio),
      fechaFin: this.toDateOnly(cnv?.fechaFin),
      fechaInicioCtei: this.toDateOnly(CTEI?.fechaInicio),
      fechaFinCtei: this.toDateOnly(CTEI?.fechaFin),
      fechaInicioIsu: this.toDateOnly(isu?.fechaInicio),
      fechaFinIsu: this.toDateOnly(isu?.fechaFin),
      esContratacion: isHiringContratacion(
        detail.convocatoria.contratacion,
      ),
    });

    this.modalities.set(this.mapDetailModalityRows(detail));
  }

  private mapDetailFechasMeta(
    detail: PreloadCallDetailResponse,
  ): FechaFormMeta[] {
    return detail.fechas.map(({ codigo, id }) => ({ codigo, id }));
  }

  private mapDetailModalityRows(
    detail: PreloadCallDetailResponse,
  ): ModalityFormItem[] {
    return detail.convocatoriaTipoContratacion.flatMap(
      (cotc): ModalityFormItem[] => {
        const tipoModalidad = String(cotc.idModalidadContratacion);
        const label =
          this.modalitySelectOptions().find(
            (opt) => opt.value === tipoModalidad,
          )?.label ?? tipoModalidad;

        if (!cotc.fechas.length) {
          return [
            {
              id: crypto.randomUUID(),
              cotcId: cotc.id,
              tipoModalidad,
              tipoModalidadLabel: label,
              diasVacaciones: null,
              fechaInicio: null,
              fechaFin: null,
              semanas: null,
            },
          ];
        }

        return cotc.fechas.map(
          (fecha): ModalityFormItem => ({
            id: crypto.randomUUID(),
            cotcId: cotc.id,
            fechaId: fecha.id,
            tipoModalidad,
            tipoModalidadLabel: label,
            diasVacaciones: fecha.vacaciones,
            fechaInicio: this.toDateOnly(fecha.fechaInicio),
            fechaFin: this.toDateOnly(fecha.fechaFin),
            semanas:
              fecha.semanas == null ? null : Number(fecha.semanas),
          }),
        );
      },
    );
  }

  private toDateOnly(value: string | null | undefined): string {
    if (!value) {
      return '';
    }
    const datePart = value.split('T')[0];
    return /^\d{4}-\d{2}-\d{2}$/.test(datePart) ? datePart : '';
  }

  ngOnInit(): void {
    this.loadCatalogs();
  }

  private loadCatalogs(): void {
    forkJoin({
      periods: this.preloadCallService.getUniversityPeriod(),
      levels: this.preloadCallService.getEducationalLevels(),
      modalities: this.preloadCallService.getModalities(),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ periods, levels, modalities }) => {
        this.universityPeriods.set(periods);
        this.educationalLevels.set(levels);
        this.modalityCatalog.set(modalities);
        this.catalogsLoaded.set(true);
      });
  }

  openModalityModal(): void {
    this.editingModality.set(null);
    this.modalityModalOpen.set(true);
  }

  openEditModality(item: ModalityFormItem): void {
    if (!item?.id) {
      return;
    }

    this.editingModality.set(item);
    this.modalityModalOpen.set(true);
  }

  closeModalityModal(): void {
    this.modalityModalOpen.set(false);
    this.editingModality.set(null);
  }

  onModalitySaved(item: ModalityFormItem): void {
    const editing = this.editingModality();

    if (editing) {
      this.modalities.update((items) =>
        items.map((row) => (row.id === editing.id ? item : row)),
      );
    } else {
      this.modalities.update((items) => [...items, item]);
    }

    this.closeModalityModal();
  }

  onDeleteModality(item: ModalityFormItem): void {
    this.modalities.update((items) =>
      items.filter((row) => row.id !== item.id),
    );
  }

  onSearchPerson(): void {
    const documento = this.form.controls.documentoIdentidad.value?.trim();
    const nombre = this.form.controls.nombreCompleto.value?.trim();

    if (!documento && !nombre) {
      this.searchError.set(
        'Ingrese documento o nombre para realizar la búsqueda.',
      );
      return;
    }

    this.searchError.set(null);
    this.isSearching.set(true);
    this.searchModalOpen.set(true);
    this.searchResults.set([]);

    this.preloadCallService
      .searchGeneralPerson({ documento, nombre })
      .pipe(finalize(() => this.isSearching.set(false)))
      .subscribe({
        next: (results) => this.searchResults.set(results),
        error: () => {
          this.searchResults.set([]);
          this.searchError.set(
            'No fue posible consultar las personas. Intente de nuevo.',
          );
        },
      });
  }

  onPersonSelected(person: PersonaAutorizaConvocatoriaItem): void {
    this.form.patchValue({
      idPersonaNaturalGeneral: person.id,
      documentoIdentidad: person.documentoIdentidad,
      nombreCompleto: person.nombreCompleto,
      telefonoCelular: person.telefonoCelular ?? '',
    });
    this.closeSearchModal();
  }

  closeSearchModal(): void {
    this.searchModalOpen.set(false);
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    if (this.isReadOnly() || this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.modalities().length === 0) {
      this.saveError.set('Agregue al menos una modalidad.');
      return;
    }

    const idPersona = this.form.controls.idPersonaNaturalGeneral.value;
    if (idPersona == null) {
      this.saveError.set(
        'Seleccione la persona que autoriza desde la búsqueda.',
      );
      return;
    }

    const value = this.form.getRawValue();
    const periodo = this.universityPeriods().find(
      (item) => String(item.id) === value.periodoUniversidad,
    );
    const nivelEducativo = this.educationalLevels().find(
      (item) => String(item.id) === value.nivelEducativo,
    );

    if (!periodo || !nivelEducativo) {
      this.saveError.set('Seleccione periodo y nivel educativo.');
      return;
    }

    const payload = buildPreloadCallSavePayload({
      convocatoriaId: this.preloadCall()?.convocatoria?.id,
      nombre: value.nombre ?? '',
      descripcion: value.descripcion ?? '',
      idPersonaNaturalGeneral: idPersona,
      documentoIdentidad: value.documentoIdentidad ?? '',
      nombreCompleto: value.nombreCompleto ?? '',
      periodo,
      nivelEducativo,
      fechaInicio: value.fechaInicio ?? '',
      fechaFin: value.fechaFin ?? '',
      fechaInicioCtei: value.fechaInicioCtei ?? '',
      fechaFinCtei: value.fechaFinCtei ?? '',
      fechaInicioIsu: value.fechaInicioIsu ?? '',
      fechaFinIsu: value.fechaFinIsu ?? '',
      fechasMeta: this.fechasMeta(),
      modalityRows: this.modalities(),
      contratacion: toContratacionValue(value.esContratacion === true),
    });

    this.saveError.set(null);
    this.submitPreloadCall.emit(payload);
  }
}
