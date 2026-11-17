import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Label } from '../../../../../../../../../shared/components/form/label/label';
import {
  Option,
  Select,
} from '../../../../../../../../../shared/components/form/select/select';
import { InputField } from '../../../../../../../../../shared/components/form/input/input-field';
import { Button } from '../../../../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../../../../shared/ui/icon/icon';
import { TooltipComponent } from '../../../../../../../../../shared/ui/tooltip';
import { Checkbox } from '../../../../../../../../../shared/components/form/input/checkbox';
import { formatSentenceValue } from '../../../../../../../../../shared/utils/normalized-text.util';
import { CoordinationService } from '../../../../../../data/coordination.service';
import { forNext } from '../../../../../../../../../core/utils/for-next.function';
import {
  ActivityTypeNode,
  activityComponentKey,
} from '../../../../../../model/professor-activities.model';
import {
  ProfessorLoadDetailItem,
  SubjectActivityRow,
  scheduleTooltip,
  subjectRowsFromLoadDetails,
} from '../../../../../../model/professor-load-detail.model';
import {
  DetalleMateriaRequest,
  SaveDetailProfessorPreloadRequest,
} from '../../../../../../model/professor-activity-save.model';
import {
  PensumItem,
  ProgramItem,
  SubjectComponentItem,
  SubjectGroupItem,
  SubjectItem,
  GroupScheduleItem,
} from '../../../../../../model/subject-catalog.model';

@Component({
  selector: 'app-subject',
  imports: [ReactiveFormsModule, Label, Select, InputField, Button, Icon, Checkbox, TooltipComponent],
  templateUrl: './subject.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Subject {
  private readonly coordinationService = inject(CoordinationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly activity = input.required<ActivityTypeNode>();
  readonly idCoordinacion = input<number | null>(null);
  readonly idUnidadRegional = input<number | null>(null);
  readonly idPeriodoUniversidad = input<number | null>(null);
  readonly idConvocatoria = input<number | null>(null);
  readonly idCargaDocente = input<number | null>(null);
  readonly savedDetails = input<ProfessorLoadDetailItem[]>([]);
  readonly detailSaved = output<void>();

  readonly form = new FormGroup({
    idPrograma: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idPensum: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    codigoMateria: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    codigoComponente: new FormControl('', { nonNullable: true }),
    idGrupo: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    idClaseSemanal: new FormControl<string[]>([], { nonNullable: true }),
    creditos: new FormControl<number | null>({ value: null, disabled: true }),
    cupoMaximo: new FormControl<number | null>({ value: null, disabled: true }),
    horasTotales: new FormControl<number | null>({ value: null, disabled: true }),
    horasExtras: new FormControl(false, { nonNullable: true }),
  });

  readonly addFormOpen = signal(false);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);
  readonly activities = signal<SubjectActivityRow[]>([]);

  private readonly hiddenDetailIds = signal<number[]>([]);

  private readonly selectedProgramId = signal<number | null>(null);
  private readonly selectedPensumId = signal<number | null>(null);
  private readonly selectedSubjectCode = signal<string | null>(null);
  private readonly selectedComponentCode = signal<string | null>(null);
  private readonly selectedGroupId = signal<number | null>(null);

  private readonly programsResource = rxResource({
    params: () => {
      const idCoordinacion = this.idCoordinacion();
      const idUnidadRegional = this.idUnidadRegional();
      const idPeriodoUniversidad = this.idPeriodoUniversidad();
      if (
        idCoordinacion == null ||
        idUnidadRegional == null ||
        idPeriodoUniversidad == null
      ) {
        return undefined;
      }

      return { idCoordinacion, idUnidadRegional, idPeriodoUniversidad };
    },
    stream: ({ params }) =>
      this.coordinationService.listPrograms(
        params.idCoordinacion,
        params.idUnidadRegional,
        params.idPeriodoUniversidad,
      ),
    defaultValue: [] as ProgramItem[],
  });

  private readonly pensumsResource = rxResource({
    params: () => {
      const idPrograma = this.selectedProgramId();
      if (idPrograma == null) {
        return undefined;
      }

      return { idPrograma };
    },
    stream: ({ params }) => this.coordinationService.listPensums(params.idPrograma),
    defaultValue: [] as PensumItem[],
  });

  private readonly subjectsResource = rxResource({
    params: () => {
      const idPensum = this.selectedPensumId();
      if (idPensum == null) {
        return undefined;
      }

      return { idPensum, educationalPractice: this.isEducationalPractice() };
    },
    stream: ({ params }) =>
      params.educationalPractice
        ? this.coordinationService.listEducationalPracticeSubject(params.idPensum)
        : this.coordinationService.listSubjects(params.idPensum),
    defaultValue: [] as SubjectItem[],
  });

  private readonly componentsResource = rxResource({
    params: () => {
      const subject = this.selectedSubject();
      if (subject?.esElectiva !== true || !subject.codigoMateria) {
        return undefined;
      }

      return { codigoMateria: subject.codigoMateria };
    },
    stream: ({ params }) => this.coordinationService.listSubjectComponents(params.codigoMateria),
    defaultValue: [] as SubjectComponentItem[],
  });

  private readonly groupsResource = rxResource({
    params: () => {
      const idConvocatoria = this.idConvocatoria();
      const codigoMateria = this.groupSubjectCode();
      if (idConvocatoria == null || !codigoMateria) {
        return undefined;
      }

      return { idConvocatoria, codigoMateria };
    },
    stream: ({ params }) =>
      this.coordinationService.listSubjectGroups(params.idConvocatoria, params.codigoMateria),
    defaultValue: [] as SubjectGroupItem[],
  });

  private readonly scheduleResource = rxResource({
    params: () => {
      if (this.selectedSubject()?.esCompartida !== true) {
        return undefined;
      }

      const idGrupo = this.selectedGroupId();
      if (idGrupo == null) {
        return undefined;
      }

      return { idGrupo };
    },
    stream: ({ params }) => this.coordinationService.listGroupSchedule(params.idGrupo),
    defaultValue: [] as GroupScheduleItem[],
  });

  readonly programOptions = computed<Option[]>(() =>
    this.toOptions(
      this.programsResource.value(),
      (item) => String(item.id),
      (item) => item.nombre?.trim() || 'Programa',
    ),
  );

  readonly pensumOptions = computed<Option[]>(() =>
    this.toOptions(
      this.pensumsResource.value(),
      (item) => String(item.id),
      (item) => item.descripcion?.trim() || 'Pensum',
    ),
  );

  readonly subjectOptions = computed<Option[]>(() => this.buildSubjectOptions());

  readonly componentOptions = computed<Option[]>(() => {
    if (!this.showComponents() || this.componentsResource.isLoading()) {
      return [];
    }

    return this.toOptions(
      this.componentsResource.value().filter((item) => item.materia?.codigoMateria),
      (item) => item.materia?.codigoMateria ?? '',
      (item) => item.materia?.nombre?.trim() || item.materia?.codigoMateria || 'Componente',
    );
  });

  readonly groupOptions = computed<Option[]>(() => {
    if (!this.groupSubjectCode() || this.groupsResource.isLoading()) {
      return [];
    }

    return this.toOptions(
      this.groupsResource.value(),
      (item) => String(item.id),
      (item) => this.groupLabel(item),
    );
  });

  readonly showComponents = computed(() => this.selectedSubject()?.esElectiva === true);

  readonly showSchedule = computed(
    () => this.selectedSubject()?.esCompartida === true && this.selectedGroupId() != null,
  );

  readonly scheduleOptions = computed<Option[]>(() => {
    if (!this.showSchedule() || this.scheduleResource.isLoading()) {
      return [];
    }

    const options: Option[] = [];
    forNext(this.scheduleResource.value(), (item) => {
      options.push({
        value: String(item.id),
        label: this.scheduleLabel(item),
      });
    });
    return options;
  });

  constructor() {
    effect(() => {
      const rows = subjectRowsFromLoadDetails(this.savedDetails(), this.activity().id);
      untracked(() => {
        const hidden = new Set(this.hiddenDetailIds());
        this.activities.set(
          rows.filter(
            (row) =>
              row.idDetalleCargaDocente == null || !hidden.has(row.idDetalleCargaDocente),
          ),
        );
      });
    });
    this.setupCascadeListeners();
    effect(() => {
      const subjects = this.subjectsResource.value();
      const code = this.selectedSubjectCode();
      if (!code) {
        return;
      }

      const subject = subjects.find((item) => item.codigoMateria === code);
      if (subject && !this.canSelectSubject(subject)) {
        untracked(() => this.clearSubjectSelection());
      }
    });
  }

  toggleAddForm(): void {
    this.addFormOpen.update((open) => !open);
  }

  cancelAddForm(): void {
    this.resetForm();
    this.addFormOpen.set(false);
  }

  onAddActivity(): void {
    if (this.form.invalid || this.isSaving()) {
      this.form.markAllAsTouched();
      return;
    }

    const request = this.buildSaveRequest();
    if (!request) {
      return;
    }

    this.isSaving.set(true);
    firstValueFrom(this.coordinationService.saveActivityDistribution(request))
      .then(() => {
        this.activities.update((items) => [...items, this.buildActivityRow()]);
        this.resetForm();
        this.addFormOpen.set(false);
        this.detailSaved.emit();
      })
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => this.isSaving.set(false));
  }

  removeActivity(idDetalleCargaDocente: number | null): void {
    if (idDetalleCargaDocente == null || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    firstValueFrom(this.coordinationService.deleteDetailProfessorLoad(idDetalleCargaDocente))
      .then(() => {
        this.hiddenDetailIds.update((ids) =>
          ids.includes(idDetalleCargaDocente) ? ids : [...ids, idDetalleCargaDocente],
        );
        this.activities.update((items) =>
          items.filter((item) => item.idDetalleCargaDocente !== idDetalleCargaDocente),
        );
        this.detailSaved.emit();
      })
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => this.isDeleting.set(false));
  }

  sentence(value: string | null | undefined): string {
    return formatSentenceValue(value);
  }

  isProgramDisabled(): boolean {
    return (
      this.idCoordinacion() == null ||
      this.idUnidadRegional() == null ||
      this.idPeriodoUniversidad() == null
    );
  }

  isPensumDisabled(): boolean {
    return this.selectedProgramId() == null;
  }

  isSubjectDisabled(): boolean {
    return this.selectedPensumId() == null;
  }

  isGroupDisabled(): boolean {
    return this.idConvocatoria() == null || !this.groupSubjectCode();
  }

  isScheduleDisabled(): boolean {
    return this.scheduleResource.isLoading();
  }

  private setupCascadeListeners(): void {
    this.form.controls.idPrograma.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.selectedProgramId.set(this.toId(value));
        this.selectedPensumId.set(null);
        this.selectedSubjectCode.set(null);
        this.selectedComponentCode.set(null);
        this.resetFromPensum();
      });

    this.form.controls.idPensum.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.selectedPensumId.set(this.toId(value));
        this.selectedSubjectCode.set(null);
        this.selectedComponentCode.set(null);
        this.resetFromSubject();
      });

    this.form.controls.codigoMateria.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.selectedSubjectCode.set(value || null);
        this.selectedComponentCode.set(null);
        this.resetFromGroup();
        this.applySubjectTotals();
        this.syncComponentValidator();
        this.syncScheduleValidator();
      });

    this.form.controls.codigoComponente.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.selectedComponentCode.set(value || null);
        this.resetGroupSelection();
      });

    this.form.controls.idGrupo.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.selectedGroupId.set(this.toId(value));
        this.form.controls.idClaseSemanal.setValue([], { emitEvent: false });
        this.applyGroupCapacity(value);
        this.syncScheduleValidator();
      });
  }

  private resetFromPensum(): void {
    this.form.patchValue(
      {
        idPensum: '',
        codigoMateria: '',
        codigoComponente: '',
        idGrupo: '',
        idClaseSemanal: [],
        creditos: null,
        cupoMaximo: null,
        horasTotales: null,
      },
      { emitEvent: false },
    );
    this.clearSelectedGroup();
  }

  private resetFromSubject(): void {
    this.form.patchValue(
      {
        codigoMateria: '',
        codigoComponente: '',
        idGrupo: '',
        idClaseSemanal: [],
        creditos: null,
        cupoMaximo: null,
        horasTotales: null,
      },
      { emitEvent: false },
    );
    this.clearSelectedGroup();
  }

  private resetFromGroup(): void {
    this.form.patchValue(
      {
        codigoComponente: '',
        idGrupo: '',
        idClaseSemanal: [],
        cupoMaximo: null,
      },
      { emitEvent: false },
    );
    this.clearSelectedGroup();
  }

  private applySubjectTotals(): void {
    const subject = this.selectedSubject();
    this.form.patchValue(
      {
        creditos: subject?.ponderacionAcademica ?? null,
        horasTotales: subject?.horasDirectas ?? null,
      },
      { emitEvent: false },
    );
  }

  private resetGroupSelection(): void {
    this.form.patchValue(
      {
        idGrupo: '',
        idClaseSemanal: [],
        cupoMaximo: null,
      },
      { emitEvent: false },
    );
    this.clearSelectedGroup();
  }

  private applyGroupCapacity(idGrupo: string): void {
    if (!idGrupo) {
      this.form.patchValue({ cupoMaximo: null }, { emitEvent: false });
      return;
    }

    const group = this.groupsResource.value().find((item) => String(item.id) === idGrupo);
    this.form.patchValue({ cupoMaximo: group?.capacidad ?? null }, { emitEvent: false });
  }

  private clearSubjectSelection(): void {
    this.selectedSubjectCode.set(null);
    this.selectedComponentCode.set(null);
    this.form.patchValue(
      {
        codigoMateria: '',
        codigoComponente: '',
        idGrupo: '',
        idClaseSemanal: [],
        creditos: null,
        cupoMaximo: null,
        horasTotales: null,
      },
      { emitEvent: false },
    );
    this.syncComponentValidator();
    this.clearSelectedGroup();
  }

  private resetForm(): void {
    this.form.reset({
      idPrograma: '',
      idPensum: '',
      codigoMateria: '',
      codigoComponente: '',
      idGrupo: '',
      idClaseSemanal: [],
      creditos: null,
      cupoMaximo: null,
      horasTotales: null,
      horasExtras: false,
    });
    this.form.controls.creditos.disable({ emitEvent: false });
    this.form.controls.cupoMaximo.disable({ emitEvent: false });
    this.form.controls.horasTotales.disable({ emitEvent: false });
    this.selectedProgramId.set(null);
    this.selectedPensumId.set(null);
    this.selectedSubjectCode.set(null);
    this.selectedComponentCode.set(null);
    this.selectedGroupId.set(null);
    this.syncComponentValidator();
    this.syncScheduleValidator();
  }

  private buildSaveRequest(): SaveDetailProfessorPreloadRequest | null {
    const idCargaDocente = this.idCargaDocente();
    const idCoordinacion = this.idCoordinacion();
    const idUnidadRegional = this.idUnidadRegional();
    const subject = this.selectedSubject();
    const value = this.form.getRawValue();
    const idPrograma = this.toId(value.idPrograma);
    const idGrupo = this.toId(value.idGrupo);
    const horas = value.horasTotales;

    if (
      idCargaDocente == null ||
      idCoordinacion == null ||
      idUnidadRegional == null ||
      subject == null ||
      idPrograma == null ||
      idGrupo == null ||
      horas == null
    ) {
      return null;
    }

    const component = this.selectedComponentSubject();
    if (subject.esElectiva === true && component == null) {
      return null;
    }

    const materia = subject.esElectiva === true ? component : subject;
    const idCentroCosto = this.selectedProgram()?.centroCosto?.id ?? null;
    const data = this.scheduleData(subject);
    if (subject.esCompartida === true && data == null) {
      return null;
    }

    return {
      idCargaDocente,
      detalles: [
        {
          idTipoActividad: this.activity().id,
          horas: Number(horas),
          idCoordinacion,
          idUnidadRegional,
          idPrograma,
          idGrupo,
          materia: this.toMateriaRequest(materia, idCentroCosto),
          materiaBanco:
            subject.esElectiva === true
              ? this.toMateriaRequest(subject, idCentroCosto)
              : null,
          extras: value.horasExtras ? '1' : '0',
          data: this.scheduleData(subject),
        },
      ],
    };
  }

  private selectedComponentSubject(): SubjectItem | null {
    const code = this.selectedComponentCode();
    if (!code) {
      return null;
    }

    return (
      this.componentsResource.value().find((item) => item.materia?.codigoMateria === code)
        ?.materia ?? null
    );
  }

  private toMateriaRequest(
    subject: SubjectItem | null,
    idCentroCosto: number | null,
  ): DetalleMateriaRequest | null {
    if (!subject?.codigoMateria) {
      return null;
    }

    return {
      codigoMateria: subject.codigoMateria,
      idCentroCosto,
    };
  }

  private selectedProgram(): ProgramItem | null {
    const idPrograma = this.selectedProgramId();
    if (idPrograma == null) {
      return null;
    }

    return this.programsResource.value().find((item) => item.id === idPrograma) ?? null;
  }

  private buildActivityRow(): SubjectActivityRow {
    const value = this.form.getRawValue();

    return {
      id: `subject-${Date.now()}`,
      idDetalleCargaDocente: null,
      programa: this.optionLabel(this.programOptions(), value.idPrograma),
      pensum: this.optionLabel(this.pensumOptions(), value.idPensum),
      materia: this.optionLabel(this.subjectOptions(), value.codigoMateria),
      componente: value.codigoComponente
        ? this.optionLabel(this.componentOptions(), value.codigoComponente)
        : '',
      grupo: value.idGrupo ? this.optionLabel(this.groupOptions(), value.idGrupo) : '',
      creditos: value.creditos,
      cupoMaximo: value.cupoMaximo,
      horasTotales: value.horasTotales,
      horasExtras: value.horasExtras,
      esCompartida: this.selectedSubject()?.esCompartida === true,
      horarioTooltip: scheduleTooltip(this.selectedSchedules()),
    };
  }

  private isEducationalPractice(): boolean {
    return activityComponentKey(this.activity().componente) === 'PRACTICAEDUCATIVA';
  }

  private selectedSubject(): SubjectItem | null {
    const code = this.selectedSubjectCode();
    if (!code) {
      return null;
    }

    return this.subjectsResource.value().find((item) => item.codigoMateria === code) ?? null;
  }

  private groupSubjectCode(): string | null {
    if (this.selectedSubject()?.esElectiva === true) {
      return this.selectedComponentCode();
    }

    return this.selectedSubjectCode();
  }

  private syncComponentValidator(): void {
    const control = this.form.controls.codigoComponente;
    if (this.selectedSubject()?.esElectiva === true) {
      control.setValidators([Validators.required]);
    } else {
      control.clearValidators();
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  private syncScheduleValidator(): void {
    const control = this.form.controls.idClaseSemanal;
    if (this.showSchedule()) {
      control.setValidators([Validators.required]);
    } else {
      control.clearValidators();
    }

    control.updateValueAndValidity({ emitEvent: false });
  }

  private clearSelectedGroup(): void {
    this.selectedGroupId.set(null);
    this.syncScheduleValidator();
  }

  private selectedSchedules(): GroupScheduleItem[] {
    const selected = new Set(this.form.controls.idClaseSemanal.value);
    const items: GroupScheduleItem[] = [];
    forNext(this.scheduleResource.value(), (item) => {
      if (selected.has(String(item.id))) {
        items.push(item);
      }
    });
    return items;
  }

  private scheduleData(subject: SubjectItem): string | null {
    if (subject.esCompartida !== true) {
      return null;
    }

    const idsClaseSemanal: number[] = [];
    forNext(this.form.controls.idClaseSemanal.value, (value) => {
      const id = Number(value);
      if (!Number.isInteger(id)) {
        return;
      }

      idsClaseSemanal.push(id);
    });
    if (idsClaseSemanal.length === 0) {
      return null;
    }

    return JSON.stringify({ idsClaseSemanal });
  }

  private scheduleLabel(item: GroupScheduleItem): string {
    const day = this.dayName(item.dia);
    const from = item.bloqueInicial?.horaInicio?.trim() || item.bloqueInicial?.nombre?.trim() || '';
    const to = item.bloqueFinal?.horaFinal?.trim() || item.bloqueFinal?.nombre?.trim() || '';
    const hours = from && to ? `${from} - ${to}` : from || to || 'Horario';
    return day ? `${day} · ${hours}` : hours;
  }

  private dayName(day: number | null): string {
    const names = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    if (day == null || day < 1 || day > 7) {
      return '';
    }

    return names[day];
  }

  private canSelectSubject(subject: SubjectItem): boolean {
    return subject.tieneGrupo === true || subject.esElectiva === true;
  }

  private buildSubjectOptions(): Option[] {
    const subjects = [...this.subjectsResource.value()].sort((left, right) => {
      const leftPeriod = left.periodo ?? 0;
      const rightPeriod = right.periodo ?? 0;
      if (leftPeriod !== rightPeriod) {
        return leftPeriod - rightPeriod;
      }

      return (left.nombre ?? '').localeCompare(right.nombre ?? '', 'es-CO');
    });

    return subjects.map((item) => ({
      value: item.codigoMateria,
      label: item.nombre?.trim() || item.codigoMateria,
      group: item.periodo != null ? `Semestre ${item.periodo}` : undefined,
      disabled: !this.canSelectSubject(item),
    }));
  }

  private toOptions<T>(
    items: T[],
    resolveValue: (item: T) => string,
    resolveLabel: (item: T) => string,
  ): Option[] {
    return [...items]
      .sort((left, right) => resolveLabel(left).localeCompare(resolveLabel(right), 'es-CO'))
      .map((item) => ({
        value: resolveValue(item),
        label: resolveLabel(item),
      }));
  }

  private groupLabel(group: SubjectGroupItem): string {
    const nombre = group.nombre?.trim() || 'Grupo';
    const anio = group.periodo?.anio ?? '';
    const periodo = group.periodo?.periodo?.trim() ?? '';
    return `${nombre} - ${anio} - ${periodo}`;
  }

  private optionLabel(options: Option[], value: string): string {
    return options.find((option) => option.value === value)?.label ?? value;
  }

  private toId(value: string): number | null {
    if (!value) {
      return null;
    }

    const id = Number(value);
    return Number.isInteger(id) ? id : null;
  }
}
