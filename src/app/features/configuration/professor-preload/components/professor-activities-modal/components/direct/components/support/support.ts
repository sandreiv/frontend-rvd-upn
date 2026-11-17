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
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { Label } from '../../../../../../../../../shared/components/form/label/label';
import { InputField } from '../../../../../../../../../shared/components/form/input/input-field';
import { Option, Select } from '../../../../../../../../../shared/components/form/select/select';
import { Button } from '../../../../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../../../../shared/ui/icon/icon';
import { formatSentenceValue } from '../../../../../../../../../shared/utils/normalized-text.util';
import { CoordinationService } from '../../../../../../data/coordination.service';
import { forNext } from '../../../../../../../../../core/utils/for-next.function';
import { ActivityTypeNode } from '../../../../../../model/professor-activities.model';
import { ProfessorLoadDetailItem } from '../../../../../../model/professor-load-detail.model';
import {
  DetalleCargaDocenteRequest,
  SaveDetailProfessorPreloadRequest,
} from '../../../../../../model/professor-activity-save.model';
import {
  ProfessorSubjectLoadItem,
  professorSubjectKey,
  supportProgramRows,
  SupportProgramRow,
  SupportSubjectEntry,
} from '../../../../../../model/subject-catalog.model';

@Component({
  selector: 'app-support',
  imports: [ReactiveFormsModule, Label, InputField, Select, Button, Icon],
  templateUrl: './support.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Support {
  private readonly coordinationService = inject(CoordinationService);
  private readonly destroyRef = inject(DestroyRef);

  readonly activity = input.required<ActivityTypeNode>();
  readonly idCoordinacion = input<number | null>(null);
  readonly idUnidadRegional = input<number | null>(null);
  readonly idCargaDocente = input<number | null>(null);
  readonly savedDetails = input<ProfessorLoadDetailItem[]>([]);
  readonly detailSaved = output<void>();

  readonly form = new FormGroup({
    materias: new FormControl<string[]>([], { nonNullable: true }),
  });

  private readonly selectedKeys = signal<string[]>([]);
  private readonly hiddenDetailIds = signal<number[]>([]);
  private readonly hoursByKey = signal<Record<string, number | null>>({});
  readonly rows = signal<SupportProgramRow[]>([]);
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  private readonly subjectsResource = rxResource({
    params: () => {
      const idCargaDocente = this.idCargaDocente();
      if (idCargaDocente == null) {
        return undefined;
      }

      return { idCargaDocente };
    },
    stream: ({ params }) => this.coordinationService.listProfessorSubjects(params.idCargaDocente),
    defaultValue: [] as ProfessorSubjectLoadItem[],
  });

  readonly subjectOptions = computed<Option[]>(() => this.buildOptions());

  readonly chips = computed(() => {
    const selected = new Set(this.selectedKeys());
    const hours = this.hoursByKey();
    const chips: { key: string; nombre: string; horas: number | null }[] = [];
    const seen = new Set<string>();
    forNext(this.subjectsResource.value(), (item) => {
      const key = professorSubjectKey(item);
      if (!key || !selected.has(key) || seen.has(key)) {
        return;
      }

      seen.add(key);
      chips.push({
        key,
        nombre: item.materia?.nombre?.trim() || item.materia?.codigoMateria?.trim() || '',
        horas: hours[key] ?? null,
      });
    });
    return chips;
  });

  constructor() {
    effect(() => {
      const catalog = this.subjectsResource.value();
      const details = this.savedDetails();
      untracked(() => {
        const hidden = new Set(this.hiddenDetailIds());
        const rows = this.withoutHidden(this.rowsFromDetails(details, catalog), hidden);
        this.rows.set(rows);
      });
    });
    this.form.controls.materias.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.selectedKeys.set(value);
        this.hoursByKey.update((current) => {
          const next: Record<string, number | null> = {};
          forNext(value, (key) => {
            next[key] = current[key] ?? null;
          });
          return next;
        });
      });
  }

  sentence(value: string | null | undefined): string {
    return formatSentenceValue(value);
  }

  isSubjectDisabled(): boolean {
    return this.idCargaDocente() == null || this.subjectsResource.isLoading();
  }

  isAddDisabled(): boolean {
    return (
      !this.hasHours() ||
      this.isSaving() ||
      this.isSubjectDisabled() ||
      this.idCoordinacion() == null
    );
  }

  setHours(key: string, value: string | number): void {
    const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
    const horas = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    this.hoursByKey.update((current) => ({ ...current, [key]: horas }));
  }

  removeChip(key: string): void {
    const next = this.form.controls.materias.value.filter((item) => item !== key);
    this.form.controls.materias.setValue(next);
  }

  isFirstSubject(materias: SupportSubjectEntry[], index: number): boolean {
    if (index === 0) {
      return true;
    }

    return materias[index]?.nombre !== materias[index - 1]?.nombre;
  }

  removeSubject(idDetalleCargaDocente: number | null): void {
    if (idDetalleCargaDocente == null || this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    firstValueFrom(this.coordinationService.deleteDetailProfessorLoad(idDetalleCargaDocente))
      .then(() => {
        this.hiddenDetailIds.update((ids) =>
          ids.includes(idDetalleCargaDocente) ? ids : [...ids, idDetalleCargaDocente],
        );
        this.rows.update((rows) => this.withoutDetail(rows, idDetalleCargaDocente));
        this.detailSaved.emit();
      })
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => this.isDeleting.set(false));
  }

  onAdd(): void {
    const items = this.pendingItems();
    if (items.length === 0 || this.isSaving()) {
      return;
    }

    this.saveSupportSubjects(items);
  }

  private pendingItems(): ProfessorSubjectLoadItem[] {
    const selected = new Set(this.selectedKeys());
    const seen = new Set<string>();
    const items: ProfessorSubjectLoadItem[] = [];
    forNext(this.subjectsResource.value(), (item) => {
      const key = professorSubjectKey(item);
      if (!key || !selected.has(key) || seen.has(key)) {
        return;
      }

      seen.add(key);
      items.push(item);
    });
    return items;
  }

  private saveSupportSubjects(items: ProfessorSubjectLoadItem[]): void {
    const request = this.buildSaveRequest(items);
    if (!request) {
      return;
    }

    this.isSaving.set(true);
    firstValueFrom(this.coordinationService.saveActivityDistribution(request))
      .then(() => {
        this.commitSaved(items);
        this.detailSaved.emit();
      })
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => this.isSaving.set(false));
  }

  private buildSaveRequest(
    items: ProfessorSubjectLoadItem[],
  ): SaveDetailProfessorPreloadRequest | null {
    const idCargaDocente = this.idCargaDocente();
    const idCoordinacion = this.idCoordinacion();
    const hours = this.hoursByKey();
    if (idCargaDocente == null || idCoordinacion == null) {
      return null;
    }

    const detalles: DetalleCargaDocenteRequest[] = [];
    forNext(items, (item) => {
      const codigoMateria = item.materia?.codigoMateria?.trim() ?? '';
      const idPrograma = item.programa?.id;
      const key = professorSubjectKey(item);
      const horas = key ? hours[key] : null;
      if (!codigoMateria || idPrograma == null || horas == null) {
        return;
      }

      detalles.push({
        idTipoActividad: this.activity().id,
        horas,
        idCoordinacion,
        idUnidadRegional: this.idUnidadRegional() ?? undefined,
        idPrograma,
        materia: {
          codigoMateria,
          idCentroCosto: item.programa?.centroCosto?.id ?? null,
        },
        materiaBanco: null,
        extras: '0',
        data: null,
      });
    });
    if (detalles.length !== items.length) {
      return null;
    }

    return { idCargaDocente, detalles };
  }

  private hasHours(): boolean {
    const chips = this.chips();
    if (chips.length === 0) {
      return false;
    }

    return chips.every((chip) => chip.horas != null && chip.horas > 0);
  }

  private commitSaved(items: ProfessorSubjectLoadItem[]): void {
    const keys: string[] = [];
    forNext(items, (item) => {
      const key = professorSubjectKey(item);
      if (key) {
        keys.push(key);
      }
    });
    const hours = this.hoursByKey();
    const added = supportProgramRows(this.subjectsResource.value(), keys, hours);
    this.rows.update((current) => this.mergeRows(current, added));
    this.form.controls.materias.setValue([]);
  }

  private rowsFromDetails(
    details: ProfessorLoadDetailItem[],
    catalog: ProfessorSubjectLoadItem[],
  ): SupportProgramRow[] {
    const rows: SupportProgramRow[] = [];
    forNext(details, (detail) => {
      forNext(detail.detalles, (item) => {
        const program = item.programa;
        if (item.tipoActividad?.id !== this.activity().id || program?.id == null) {
          return;
        }

        const name = item.materia?.nombre?.trim() || item.materia?.codigoMateria?.trim() || '';
        if (!name) {
          return;
        }

        const horas = this.toHours(item.horas);
        const grupos = this.groupNames(catalog, item.materia?.codigoMateria, program.id);
        const labels = grupos.length > 0 ? grupos : [item.grupo?.nombre?.trim() ?? ''];
        forNext(labels, (grupo) => {
          this.pushSubject(
            rows,
            program.id,
            program.nombre,
            name,
            grupo,
            horas,
            detail.idDetalleCargaDocente,
          );
        });
      });
    });
    return rows;
  }

  private groupNames(
    catalog: ProfessorSubjectLoadItem[],
    codigo: string | null | undefined,
    idPrograma: number,
  ): string[] {
    const code = codigo?.trim() ?? '';
    const grupos: string[] = [];
    if (!code) {
      return grupos;
    }

    forNext(catalog, (item) => {
      const sameSubject = item.materia?.codigoMateria?.trim() === code;
      const sameProgram = item.programa?.id === idPrograma;
      const grupo = item.grupo?.nombre?.trim() ?? '';
      if (!sameSubject || !sameProgram || !grupo || grupos.includes(grupo)) {
        return;
      }

      grupos.push(grupo);
    });
    return grupos;
  }

  private pushSubject(
    rows: SupportProgramRow[],
    idPrograma: number,
    programa: string | null | undefined,
    nombre: string,
    grupo: string,
    horas: number | null,
    idDetalleCargaDocente: number | null,
  ): void {
    const entry = { nombre, grupo, horas, idDetalleCargaDocente };
    const current = rows.find((row) => row.idPrograma === idPrograma);
    if (!current) {
      rows.push({
        idPrograma,
        programa: programa?.trim() ?? '',
        materias: [entry],
      });
      return;
    }

    const existing = current.materias.find(
      (materia) => materia.nombre === nombre && materia.grupo === grupo,
    );
    if (!existing) {
      current.materias.push(entry);
      return;
    }

    if (horas != null) {
      existing.horas = horas;
    }

    if (idDetalleCargaDocente != null) {
      existing.idDetalleCargaDocente = idDetalleCargaDocente;
    }
  }

  private mergeRows(current: SupportProgramRow[], added: SupportProgramRow[]): SupportProgramRow[] {
    const rows = current.map((row) => ({ ...row, materias: [...row.materias] }));
    forNext(added, (row) => {
      const found = rows.find((item) => item.idPrograma === row.idPrograma);
      if (!found) {
        rows.push({ ...row, materias: [...row.materias] });
        return;
      }

      forNext(row.materias, (materia) => {
        const existing = found.materias.find(
          (item) => item.nombre === materia.nombre && item.grupo === materia.grupo,
        );
        if (!existing) {
          found.materias.push(materia);
          return;
        }

        if (materia.horas != null) {
          existing.horas = materia.horas;
        }

        if (materia.idDetalleCargaDocente != null) {
          existing.idDetalleCargaDocente = materia.idDetalleCargaDocente;
        }
      });
    });
    return rows;
  }

  private withoutHidden(rows: SupportProgramRow[], hidden: Set<number>): SupportProgramRow[] {
    return this.dropSubjects(
      rows,
      (_row, materia) =>
        materia.idDetalleCargaDocente != null && hidden.has(materia.idDetalleCargaDocente),
    );
  }

  private withoutDetail(
    rows: SupportProgramRow[],
    idDetalleCargaDocente: number,
  ): SupportProgramRow[] {
    return this.dropSubjects(
      rows,
      (_row, materia) => materia.idDetalleCargaDocente === idDetalleCargaDocente,
    );
  }

  private dropSubjects(
    rows: SupportProgramRow[],
    remove: (row: SupportProgramRow, materia: SupportSubjectEntry) => boolean,
  ): SupportProgramRow[] {
    const visible: SupportProgramRow[] = [];
    forNext(rows, (row) => {
      const materias = row.materias.filter((materia) => !remove(row, materia));
      if (materias.length > 0) {
        visible.push({ ...row, materias });
      }
    });
    return visible;
  }

  private toHours(horas: string | null | undefined): number | null {
    if (horas == null || !horas.trim()) {
      return null;
    }

    const value = Number(horas.trim().replace(',', '.'));
    return Number.isFinite(value) ? value : null;
  }

  private buildOptions(): Option[] {
    const options: Option[] = [];
    const seen = new Set<string>();
    forNext(this.subjectsResource.value(), (item) => {
      const value = professorSubjectKey(item);
      if (!value || seen.has(value)) {
        return;
      }

      seen.add(value);

      const subject = item.materia?.nombre?.trim() || item.materia?.codigoMateria?.trim() || '';
      const program = item.programa?.nombre?.trim() ?? '';
      options.push({
        value,
        label: formatSentenceValue(subject),
        group: program ? formatSentenceValue(program) : undefined,
      });
    });
    return options;
  }
}
