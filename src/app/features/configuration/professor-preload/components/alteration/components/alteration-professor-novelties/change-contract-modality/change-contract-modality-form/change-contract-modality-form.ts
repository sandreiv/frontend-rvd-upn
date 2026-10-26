import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { catchError, of } from 'rxjs';
import { Label } from '../../../../../../../../../shared/components/form/label/label';
import {
  Option,
  Select,
} from '../../../../../../../../../shared/components/form/select/select';
import { InputField } from '../../../../../../../../../shared/components/form/input/input-field';
import { Icon } from '../../../../../../../../../shared/ui/icon/icon';
import { forNext } from '../../../../../../../../../core/utils/for-next.function';
import { CoordinationService } from '../../../../../../data/coordination.service';
import {
  CategoriaCatedratico,
  ContractModalityItem,
  CoordinationItem,
  LoadRestrictionPreview,
  ModalityProfessor,
  ValuePointsPreload,
  WorkDate,
} from '../../../../../../model/coordination.model';
import {
  ContractValues,
  computeContractValues,
  countInclusiveDays,
  formatCurrencyCOP,
  formatWorkDateRange,
  professorDisplayName,
  ProfessorFieldConfig,
  resolveAssignmentFields,
  resolveModalityKind,
  resolveWeeklyHoursLabel,
} from '../../../../../../model/professor-form.config';
import { NoveltyAssignmentSnapshot } from '../../../../../../model/novelty-carga-docente.model';

@Component({
  selector: 'app-change-contract-modality-form',
  imports: [Label, Select, InputField, Icon, ReactiveFormsModule],
  templateUrl: './change-contract-modality-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangeContractModalityForm {
  private readonly coordinationService = inject(CoordinationService);

  readonly professor = input<ModalityProfessor | null>(null);
  readonly coordination = input<CoordinationItem | null>(null);
  readonly contractModality = input<ContractModalityItem | null>(null);

  readonly selectedWorkDate = signal<WorkDate | null>(null);
  readonly selectedCategoriaId = signal<number | null>(null);
  readonly manualNumeroPuntos = signal<number | null>(null);
  readonly professorForm = signal<FormGroup>(new FormGroup({}));

  readonly hasIdentifiedProfessor = computed(
    () => this.professor()?.idPersonaGeneral != null,
  );

  readonly displayName = computed(() => {
    const professor = this.professor();
    return professorDisplayName(
      professor?.nombreCompleto,
      professor?.idPersonaGeneral,
    );
  });

  readonly modalityKind = computed(() =>
    resolveModalityKind(this.contractModality()?.nombre),
  );

  readonly fields = computed(() =>
    resolveAssignmentFields(
      this.modalityKind(),
      this.hasIdentifiedProfessor(),
      false,
    ),
  );

  readonly effectiveCategoriaId = computed(
    () =>
      this.selectedCategoriaId() ??
      this.professor()?.idCategoriaCatedratico ??
      null,
  );

  private readonly workDatesResource = rxResource({
    params: () => {
      const idCarga = this.coordination()?.idCarga;
      const modalityId = this.contractModality()?.id;
      if (idCarga == null || modalityId == null) {
        return undefined;
      }
      return { idCarga, modalityId };
    },
    stream: ({ params }) =>
      this.coordinationService.getWorkDates(
        params.idCarga,
        params.modalityId,
      ),
    defaultValue: [] as WorkDate[],
  });

  private readonly loadRestrictionResource = rxResource<
    LoadRestrictionPreview | null,
    { modalityId: number } | undefined
  >({
    params: () => {
      const modalityId = this.contractModality()?.id;
      if (modalityId == null) {
        return undefined;
      }
      return { modalityId };
    },
    stream: ({ params }) =>
      this.coordinationService
        .getLoadRestrictionByModality(params.modalityId)
        .pipe(catchError(() => of(null))),
    defaultValue: null,
  });

  private readonly categoriasResource = rxResource({
    params: () => {
      const modalityId = this.contractModality()?.id;
      if (modalityId == null) {
        return undefined;
      }
      return { modalityId };
    },
    stream: ({ params }) =>
      this.coordinationService.getCategoriaCatedratico(params.modalityId),
    defaultValue: [] as CategoriaCatedratico[],
  });

  private readonly valuePointsResource = rxResource<
    ValuePointsPreload | null,
    {
      anio: number;
      idCategoria: number;
      idPersona: number | null;
      modalityId: number;
    } | undefined
  >({
    params: () => {
      const anio = this.coordination()?.anioUniversidad;
      const idCategoria = this.effectiveCategoriaId();
      const modalityId = this.contractModality()?.id;
      if (anio == null || idCategoria == null || modalityId == null) {
        return undefined;
      }
      return {
        anio,
        idCategoria,
        idPersona: this.professor()?.idPersonaGeneral ?? null,
        modalityId,
      };
    },
    stream: ({ params }) =>
      this.coordinationService
        .getValuePointsPreload(
          params.anio,
          params.idCategoria,
          params.idPersona,
          params.modalityId,
        )
        .pipe(catchError(() => of(null))),
    defaultValue: null,
  });

  readonly workDates = computed(() => this.workDatesResource.value());
  readonly categorias = computed(() => this.categoriasResource.value());

  readonly exceptionHours = computed(() => {
    const idPersona = this.professor()?.idPersonaGeneral;
    if (idPersona == null) {
      return null;
    }
    const exception = this.loadRestrictionResource
      .value()
      ?.personasExcepcion?.find((item) => item.idPersona === idPersona);
    return String(exception?.maximoHoras ?? '').trim() || null;
  });

  readonly formaPago = computed(
    () => this.loadRestrictionResource.value()?.formaPago ?? null,
  );

  readonly restrictionReady = computed(() => {
    const status = this.loadRestrictionResource.status();
    return status === 'resolved' || status === 'error';
  });

  readonly fechaLaborOptions = computed<Option[]>(() =>
    this.workDates().map((workDate) => ({
      value: String(workDate.id),
      label: formatWorkDateRange(workDate.fechaInicio, workDate.fechaFin),
    })),
  );

  readonly categoriaOptions = computed<Option[]>(() =>
    this.categorias().map((categoria) => ({
      value: String(categoria.id),
      label: categoria.descripcion,
    })),
  );

  readonly asignacionSalarialNum = computed<number | null>(() => {
    const values = this.valuePointsResource.value();
    if (!values) {
      return this.professor()?.asignacionSalarial ?? null;
    }
    if (this.hasIdentifiedProfessor()) {
      return values.asignacionSalarial ?? null;
    }
    const valorPunto = values.valorPunto;
    const puntos = this.manualNumeroPuntos();
    if (valorPunto == null || puntos == null) {
      return null;
    }
    return valorPunto * puntos;
  });

  readonly valorHoraNum = computed<number | null>(() => {
    const values = this.valuePointsResource.value();
    if (values?.valorHora != null) {
      return values.valorHora;
    }
    return this.professor()?.valorHora ?? null;
  });

  readonly contractValues = computed<ContractValues | null>(() => {
    if (this.modalityKind() !== 'tiempoCompletoOcasional') {
      return null;
    }
    const asignacion = this.asignacionSalarialNum();
    const workDate = this.selectedWorkDate();
    if (asignacion == null || !workDate) {
      return null;
    }
    const days = countInclusiveDays(
      workDate.fechaInicio,
      workDate.fechaFin,
    );
    if (days <= 0) {
      return null;
    }
    return computeContractValues(asignacion, days);
  });

  constructor() {
    effect(() => {
      const professor = this.professor();
      this.contractModality();
      untracked(() => this.resetSelection(professor));
    });

    effect(() => {
      const fields = this.fields();
      untracked(() => this.professorForm.set(this.buildForm(fields)));
    });

    effect(() => {
      const form = this.professorForm();
      const professor = this.professor();
      const dates = this.workDates();
      const categorias = this.categorias();
      untracked(() => this.prefillForm(form, professor, dates, categorias));
    });

    effect(() => {
      const form = this.professorForm();
      const values = this.valuePointsResource.value();
      untracked(() => this.patchValuePoints(form, values));
    });

    effect(() => {
      const form = this.professorForm();
      const asignacion = this.asignacionSalarialNum();
      const contract = this.contractValues();
      untracked(() => this.patchMoneyFields(form, asignacion, contract));
    });
  }

  assignmentSnapshot(): NoveltyAssignmentSnapshot | null {
    const modalityId = this.contractModality()?.id;
    const categoriaId = this.effectiveCategoriaId();
    const workDate = this.selectedWorkDate();
    if (modalityId == null || categoriaId == null || !workDate) {
      return null;
    }

    const values = this.valuePointsResource.value();
    const contract = this.contractValues();
    return {
      idModalidadContratacion: modalityId,
      idCategoriaCatedratico: categoriaId,
      workDate,
      semanas: workDate.semanas ?? '',
      horas: resolveWeeklyHoursLabel(
        workDate.rangoHoras,
        this.exceptionHours(),
      ),
      horasDeExcepcion: this.exceptionHours(),
      valorHora: this.toAmount(values?.valorHora),
      puntos: this.puntosString(),
      valorPunto: this.toAmount(values?.valorPunto),
      valorContrato: this.toAmount(contract?.valorContrato),
      valorPrestaciones: this.toAmount(contract?.valorPrestaciones),
      totalContrato: this.toAmount(contract?.totalContrato),
      asignacionSalarial: this.toAmount(this.asignacionSalarialNum()),
    };
  }

  onFechaLaborChange(workDateId: string): void {
    const workDate =
      this.workDates().find((item) => String(item.id) === workDateId) ??
      null;
    this.selectedWorkDate.set(workDate);
    this.patchWorkDateFields(this.professorForm(), workDate);
  }

  onCategoriaChange(categoriaId: string): void {
    const id = Number(categoriaId);
    this.selectedCategoriaId.set(Number.isNaN(id) ? null : id);
  }

  onNumeroPuntosChange(value: string | number): void {
    const puntos = Number(value);
    this.manualNumeroPuntos.set(
      value === '' || Number.isNaN(puntos) ? null : puntos,
    );
  }

  private resetSelection(professor: ModalityProfessor | null): void {
    this.selectedWorkDate.set(null);
    this.selectedCategoriaId.set(professor?.idCategoriaCatedratico ?? null);
    const puntos = professor?.puntos != null ? Number(professor.puntos) : null;
    this.manualNumeroPuntos.set(
      puntos == null || Number.isNaN(puntos) ? null : puntos,
    );
  }

  private buildForm(fields: ProfessorFieldConfig[]): FormGroup {
    const controls: Record<string, FormControl> = {};
    forNext(fields, (field) => {
      controls[field.key] = new FormControl({
        value: '',
        disabled: field.readonly === true,
      });
    });
    return new FormGroup(controls);
  }

  private prefillForm(
    form: FormGroup,
    professor: ModalityProfessor | null,
    dates: WorkDate[],
    categorias: CategoriaCatedratico[],
  ): void {
    if (!professor || !this.fields().length) {
      return;
    }

    const workDate = this.resolveWorkDate(professor, dates);
    this.selectedWorkDate.set(workDate);
    form.patchValue({
      categoriaCatedratico: this.resolveCategoriaValue(
        professor,
        categorias,
      ),
      fechaLabor: workDate ? String(workDate.id) : '',
      numeroPuntos: professor.puntos ?? '',
    });
    this.patchWorkDateFields(form, workDate);
  }

  private resolveWorkDate(
    professor: ModalityProfessor,
    dates: WorkDate[],
  ): WorkDate | null {
    return (
      dates.find((item) => item.id === professor.idFechasConvocatoria) ??
      dates[0] ??
      null
    );
  }

  private resolveCategoriaValue(
    professor: ModalityProfessor,
    categorias: CategoriaCatedratico[],
  ): string {
    const categoria = categorias.find(
      (item) => item.id === professor.idCategoriaCatedratico,
    );
    if (this.modalityKind() === 'catedra' && this.hasIdentifiedProfessor()) {
      return String(professor.idCategoriaCatedratico);
    }
    return categoria?.descripcion ?? String(professor.idCategoriaCatedratico);
  }

  private puntosString(): string {
    const values = this.valuePointsResource.value();
    if (this.hasIdentifiedProfessor()) {
      const puntos = values?.puntosDocente;
      return puntos == null ? '' : String(puntos);
    }
    const puntos = this.manualNumeroPuntos();
    return puntos == null ? '' : String(puntos);
  }

  private toAmount(value: number | null | undefined): number | null {
    if (value == null || Number.isNaN(value)) {
      return null;
    }
    return Math.round(value * 100) / 100;
  }

  private patchWorkDateFields(
    form: FormGroup,
    workDate: WorkDate | null,
  ): void {
    if (!workDate) {
      return;
    }
    form.patchValue({
      semanas: workDate.semanas ?? '',
      vacaciones: workDate.vacaciones ?? '',
      horasSemanales: resolveWeeklyHoursLabel(
        workDate.rangoHoras,
        this.exceptionHours(),
      ),
    });
  }

  private patchValuePoints(
    form: FormGroup,
    values: ValuePointsPreload | null,
  ): void {
    if (!values) {
      return;
    }
    if (this.modalityKind() === 'catedra') {
      form.patchValue({ valorHora: formatCurrencyCOP(values.valorHora) });
      return;
    }
    form.patchValue({
      valorPunto: formatCurrencyCOP(values.valorPunto),
      numeroPuntos: this.hasIdentifiedProfessor()
        ? values.puntosDocente
        : this.manualNumeroPuntos(),
    });
  }

  private patchMoneyFields(
    form: FormGroup,
    asignacion: number | null,
    contract: ContractValues | null,
  ): void {
    if (this.modalityKind() !== 'tiempoCompletoOcasional') {
      return;
    }
    if (asignacion != null) {
      form.patchValue({
        asignacionSalarial: formatCurrencyCOP(asignacion),
      });
    }
    if (!contract) {
      return;
    }
    form.patchValue({
      valorContrato: formatCurrencyCOP(contract.valorContrato),
      valorPrestaciones: formatCurrencyCOP(contract.valorPrestaciones),
      totalContrato: formatCurrencyCOP(contract.totalContrato),
    });
  }
}
