import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forNext } from '../../../../../core/utils/for-next.function';
import { CollapsibleSection } from '../../../../../shared/components/form/collapsible-section/collapsible-section';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { AppIconName } from '../../../../../shared/ui/icon/icons';
import { Modal } from '../../../../../shared/ui/modal/modal';
import { mapActivitySummaryTables } from '../../../professor-preload/model/professor-summary.model';
import { HiringCallService } from '../../data/hiring-call.service';
import { ActivityWeights, ObservacionPtd, PdtInfoWithWeights, ProfessorInformationItem, SavePtdPayload, SavePtdRequest, SummaryPtdActivity } from '../../model/hiring-call.model';
import { Button } from '../../../../../shared/ui/button/button';
import { FormArray, FormControl, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Option, Select } from '../../../../../shared/components/form/select/select';
import { finalize } from 'rxjs';
import { InputField } from '../../../../../shared/components/form/input/input-field';

type PtdSectionId = 'detalle-actividades' | 'observaciones' | 'ptd-actividades';
type PtdStep = 'resumen' | 'ptd';

interface PtdSectionConfig {
  id: PtdSectionId;
  title: string;
  icon: AppIconName;
  iconBgClass: string;
  iconColorClass: string;
}

interface HeaderChip {
  id: string;
  label: string;
  icon?: AppIconName;
}

const SUMMARY_SECTIONS: PtdSectionConfig[] = [
  {
    id: 'detalle-actividades',
    title: 'Detalle actividades',
    icon: 'academicCap',
    iconBgClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconColorClass: 'text-brand-600 dark:text-brand-400',
  },
  {
    id: 'observaciones',
    title: 'Observación',
    icon: 'chatBubbleBottomCenterText',
    iconBgClass: 'bg-error-50 dark:bg-error-500/10',
    iconColorClass: 'text-error-500 dark:text-error-400',
  },
];

const PTD_SECTIONS: PtdSectionConfig[] = [
  {
    id: 'ptd-actividades',
    title: 'Detalle actividades',
    icon: 'academicCap',
    iconBgClass: 'bg-brand-50 dark:bg-brand-500/10',
    iconColorClass: 'text-brand-600 dark:text-brand-400',
  },
];

function createInitialExpandedSections(): Record<PtdSectionId, boolean> {
  return {
    'detalle-actividades': false,
    observaciones: false,
    'ptd-actividades': false,
  };
}

@Component({
  selector: 'app-ptd-modal',
  imports: [Modal, Icon, CollapsibleSection, Button, Select, ReactiveFormsModule, InputField],
  templateUrl: './ptd-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PtdModal {
  private readonly hiringCallService = inject(HiringCallService);
  private readonly destroyRef = inject(DestroyRef);

  readonly isOpen = input(false);
  readonly idCargaDocente = input<number | null>(null);
  readonly idPeriodoUniversitario = input<number | null>(null);
  readonly close = output<void>();

  readonly isSaving = signal(false);
  readonly observation = signal('');
  readonly expandedSections = signal(createInitialExpandedSections());
  readonly currentStep = signal<PtdStep>('resumen')
  readonly formChanges = signal(0);

  readonly englishLevels: Option[] = [
    { value: 'A1', label: 'A1 (Principiante)' },
    { value: 'A2', label: 'A2 (Principiante)' },
    { value: 'B1', label: 'B1 (Intermedio)' },
    { value: 'B2', label: 'B2 (Intermedio)' },
    { value: 'C1', label: 'C1 (Avanzado)' },
    { value: 'C2', label: 'C2 (Avanzado)' },
  ];
  

  // Construir vista de ptd con actividades
  readonly informationResource = rxResource({
    params: () => this.resolveInformationParams(),
    stream: ({ params }) =>
      this.hiringCallService.getProfessorInformation(params.idCargaDocente),
  });

  readonly ptdActivitiesResource = rxResource({
    params: () => this.resolveInformationParams(),
    stream: ({ params }) => this.hiringCallService.listPtdActivities(params.idCargaDocente),
  });

  // Poblar modal PTD
  readonly ptdInfoWithWeightsResource = rxResource({
    params: () => {
      const idCargaDocente = this.idCargaDocente();
      const idPersonaGeneral = this.information()?.idPersonaGeneral;
      const idPeriodoUniversitario = this.idPeriodoUniversitario();

      if (!this.isOpen() || idCargaDocente == null || idPersonaGeneral == null || idPeriodoUniversitario == null) {
        return undefined;
      }

      return { idPersonaGeneral, idCargaDocente, idPeriodoUniversitario };
    },
    stream: ({ params }) => this.hiringCallService.getInfoPtdWithWeights(
      params.idPersonaGeneral,
      params.idCargaDocente,
      params.idPeriodoUniversitario
    )
  });


  readonly information = computed(() => {
    if (!this.isOpen() || !this.informationResource.hasValue()) {
      return null;
    }
    return this.informationResource.value();
  });

  readonly ptdActivities = computed(() => {
    if (!this.isOpen() || !this.ptdActivitiesResource.hasValue()) {
      return null;
    }
    return this.ptdActivitiesResource.value();
  });

  readonly ptdInfoWithWeights = computed(() => {
    if (!this.isOpen() || !this.ptdInfoWithWeightsResource.hasValue()) {
      return null;
    }
    return this.ptdInfoWithWeightsResource.value();
  });

  readonly sections = computed (() => this.currentStep() === 'resumen' ? SUMMARY_SECTIONS : PTD_SECTIONS);

  readonly hasObservation = computed(() => this.observation().length !== 0);

  readonly ptdExists = computed(() => this.ptdInfoWithWeights() != null);

  readonly saveButtonDisabled = computed(() => {
    return !this.hasObservation() || (this.currentStep() === 'ptd' && (!this.ponderacionValida() || this.ptdExists()));
  })

  readonly isLoadingSummary = computed(
    () => this.isOpen() && this.informationResource.isLoading(),
  );

  readonly isLoadingPtdActivities = computed(
    () => this.isOpen() && this.ptdActivitiesResource.isLoading(),
  );

  readonly summaryActivityTables = computed(() => {
    if (!this.isOpen()) {
      return [];
    }
    return mapActivitySummaryTables(this.information()?.horasActividades);
  });

  readonly ptdActivityTables = computed(() => {
    if (!this.isOpen()) {
      return [];
    }
    return this.ptdActivities() ?? [];
  });

  readonly titleName = computed(() => {
    const name = this.information()?.nombreCompleto?.trim();
    return name || 'Plan de trabajo';
  });

  readonly titleDocument = computed(
    () => this.information()?.documentoIdentidad?.trim() || '',
  );

  readonly headerChips = computed(() =>
    this.buildHeaderChips(this.information()),
  );

  readonly totalPonderacion = computed(() => {
    this.formChanges();

    return this.actividadesFormArray.controls.reduce(
      (total, control) => total + Number(control.controls['ponderacion'].value ?? 0),
      0,
    );
  });

  readonly ponderacionValida = computed(() =>
    this.actividadesFormArray.length > 0 &&
    this.totalPonderacion() === 100 &&
    this.ptdForm.valid
  );

  readonly ptdForm = new FormGroup({
    actividades: new FormArray<FormGroup>([])
  });
  

  constructor() {
    effect(() => {
      const isOpen = this.isOpen();
      const idCargaDocente = this.idCargaDocente();

      if (!isOpen || idCargaDocente == null) {
        return;
      }

      untracked(() => {
        this.currentStep.set('resumen');
        this.expandedSections.set(createInitialExpandedSections());
        this.observation.set('');
      });
    });

    effect(() => {
      const activities = this.ptdActivities();
      if (activities === null) {
        return;
      }
      if (this.ptdInfoWithWeightsResource.isLoading()) {
        return;
      }

      untracked(() => this.initializePtdForm(activities, this.ptdInfoWithWeights()));
    });

    effect(() => {
      this.ptdForm.valueChanges.subscribe(() => {
        this.formChanges.update((value) => value + 1);
      });
    });
  }

  isSectionExpanded(sectionId: PtdSectionId): boolean {
    return this.expandedSections()[sectionId];
  }

  onSectionExpandedChange(sectionId: PtdSectionId, expanded: boolean): void {
    this.expandedSections.update((current) => ({
      ...current,
      [sectionId]: expanded,
    }));
  }

  hoursLabel(hours: number): string {
    return `${hours ?? 0}h`;
  }

  onObservationInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.observation.set(textarea.value);
  }

  continueToPtd(): void {
    if (!this.hasObservation()) {
      return;
    }

    this.currentStep.set('ptd');
  }

  backToSummary(): void {
    this.currentStep.set('resumen');
  }

  private resolveInformationParams(): { idCargaDocente: number } | undefined {
    if (!this.isOpen()) {
      return undefined;
    }

    const idCargaDocente = this.idCargaDocente();
    if (idCargaDocente == null) {
      return undefined;
    }

    return { idCargaDocente };
  }

  onSave(): void {
    if (this.isSaving() || this.ptdExists()) {
      return;
    }

    const idPersonaGeneral = this.information()?.idPersonaGeneral;
    const idCargaDocente = this.idCargaDocente();
    const idPeriodoUniversitario = this.idPeriodoUniversitario();
    if (idPersonaGeneral == null || idCargaDocente == null || idPeriodoUniversitario == null || !this.ponderacionValida()) {
      return
    }

    const result = this.buildSavePayload(idPersonaGeneral, idCargaDocente, idPeriodoUniversitario);
    if (result.registros.length === 0 || result.observacion == null) {
      return;
    }

    this.isSaving.set(true);
    this.hiringCallService.savePtd(result)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.isSaving.set(false))
      )
      .subscribe({
        next: () => this.close.emit()
      });
  }

  private buildHeaderChips(
    information: ProfessorInformationItem | null,
  ): HeaderChip[] {
    if (!information) {
      return [];
    }

    const chips: HeaderChip[] = [];
    const candidates: Array<HeaderChip | null> = [
      this.toChip('modalidad', null, information.modalidadContratacion),
      this.toChip('categoria', 'Categoría', information.categoriaDocente),
      this.toChip('puntos', 'Puntos', information.puntos),
      this.toDateChip(information.fechaInicio, information.fechaFin),
      this.toChip('direccion', 'Dirección', information.direccionDomicilio),
      this.toChip('correo-personal', 'Personal', information.correoPersonal),
      this.toChip(
        'correo-institucional',
        'Institucional',
        information.correoInstitucional,
      ),
    ];

    forNext(candidates, (chip) => {
      if (chip) {
        chips.push(chip);
      }
    });

    return chips;
  }

  private toChip(
    id: string,
    prefix: string | null,
    value: string | number | null | undefined,
    icon?: AppIconName,
  ): HeaderChip | null {
    const text = this.displayText(value);
    if (text === '-') {
      return null;
    }

    return {
      id,
      label: prefix ? `${prefix} · ${text}` : text,
      icon,
    };
  }

  private toDateChip(
    fechaInicio: string | null | undefined,
    fechaFin: string | null | undefined,
  ): HeaderChip | null {
    const start = this.displayDate(fechaInicio);
    const end = this.displayDate(fechaFin);

    if (start === '-' && end === '-') {
      return null;
    }

    if (start === '-') {
      return { id: 'fechas', label: end, icon: 'calendar' };
    }

    if (end === '-') {
      return { id: 'fechas', label: start, icon: 'calendar' };
    }

    return {
      id: 'fechas',
      label: `${start} — ${end}`,
      icon: 'calendar',
    };
  }

  private displayText(value: string | number | null | undefined): string {
    if (value == null) {
      return '-';
    }

    const text = String(value).trim();
    return text || '-';
  }

  private displayDate(value: string | null | undefined): string {
    const text = value?.trim();
    if (!text) {
      return '-';
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
    if (!match) {
      return text;
    }

    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  private initializePtdForm(activities: SummaryPtdActivity[], ptdInfo: PdtInfoWithWeights|null): void {
    const ponderacionesPrecalculadas = this.calculatePonderaciones(activities);
    const ponderacionesAlmacenadas = new Map<number, number>(
      (ptdInfo?.actividades ?? []).map(
        (item: ActivityWeights) => [
          item.idTipoActividad,
          item.ponderado,
        ],
      ),
    );
    const nivelesAlmacenados = new Map<number, string | null>(
      (ptdInfo?.actividades ?? []).map(
        (item: ActivityWeights) => [
          item.idTipoActividad,
          item.nivel,
        ],
      ),
    );

    this.actividadesFormArray.clear();

    activities.forEach((activity, index) => {
      const esPtd = activity.codigo === 'PTD';
      const esLenguaExtranjera = this.isSecondLanguage(activity.criterio);
      const ponderacion = ponderacionesAlmacenadas.has(activity.id)
        ? ponderacionesAlmacenadas.get(activity.id)
        : ponderacionesPrecalculadas[index]
      const nivel = nivelesAlmacenados.has(activity.id)
        ? nivelesAlmacenados.get(activity.id) ?? null
        : 'A1';

      this.actividadesFormArray.push(
        new FormGroup({
          idActividad: new FormControl(activity.id, {
            nonNullable: true,
          }),
          ponderacion: new FormControl(
            { value: ponderacion, disabled: (!esPtd || this.ptdExists()) },
            {
              nonNullable: true,
              validators: [
                Validators.required,
                Validators.min(0),
                Validators.max(100),
              ],
            }
          ),
          nivel: new FormControl<string | null>(
            { value: nivel, disabled: (!esLenguaExtranjera || this.ptdExists()) },
            {
              validators: esLenguaExtranjera
                ? [Validators.required]
                : [],
            },
          ),
        }),
      );
    });

    if (ptdInfo) {
      this.observation.set(ptdInfo.observacion.descripcion ?? '');
    }
  }

  private calculatePonderaciones(activities: SummaryPtdActivity[]): number[] {
    const ponderaciones = activities.map(() => 0);

    const criterios = activities
      .map((activity, index) => ({ activity, index }))
      .filter(({ activity }) => activity.codigo !== 'PTD');

    const criteriosConHoras = criterios.filter(
      ({ activity }) => (activity.totalHoras ?? 0) > 0,
    );
    
    let asignado = 0;
    const objetivo = 70;  // 70%
    const totalHoras = criterios.reduce(
      (total, { activity }) => total + Math.max(0, activity.totalHoras ?? 0),
      0,
    );
    if (totalHoras === 0) {
      return ponderaciones;
    }

    criteriosConHoras.forEach(({ activity, index }, position) => {
      const esUltima = position === criteriosConHoras.length - 1;

      const valor = esUltima
        ? objetivo - asignado
        : Math.round(((activity.totalHoras ?? 0) / totalHoras) * objetivo);

      ponderaciones[index] = valor;
      asignado += valor;
    });

    return ponderaciones;
  }

  private buildSavePayload(idPersonaGeneral: number, idCargaDocente: number, idPeriodoUniversitario: number): SavePtdRequest {
    const activities = this.ptdActivities() ?? [];
    const formValues = this.ptdForm.getRawValue();
    
    const registros: SavePtdPayload[] = [];
    const observacion: ObservacionPtd = {
      idCargaDocente,
      descripcion: this.observation().trim()
    }
    
    activities.forEach((activity, index) => {
      const formActivity = formValues.actividades[index];
      if (!formActivity) {
        return;
      }

      const base = {
        nivel: this.isSecondLanguage(activity.criterio) ? formActivity['nivel'] : null,
        ponderado: Number(formActivity['ponderacion']),
        idTipoActividad: activity.id,
        idPersonaGeneral,
        idPeriodoUniversitario
      }

      const esPtd = activity.codigo === 'PTD';
      if (esPtd) {
        registros.push({
          ...base,
          idDetalleCargaDocente: null,
          idDetalleNovedadCargaDocente: null
        });
        return;
      };

      activity.detalles.forEach((detalle) => {
        const esDeNovedad = detalle.esDeNovedad === 1;

        registros.push({
          ...base,
          idDetalleCargaDocente: esDeNovedad ? null : detalle.id,
          idDetalleNovedadCargaDocente: esDeNovedad ? detalle.id : null
        })
      });
    });

    return { registros, observacion };
  }

  isSecondLanguage(criterio: string): boolean {
    return criterio.trim().toLocaleLowerCase() === 'lengua extranjera'
  }

  get actividadesFormArray(): FormArray<FormGroup> {
    return this.ptdForm.controls.actividades;
  }
}
