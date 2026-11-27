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
import { debounceTime, distinctUntilChanged, firstValueFrom, Subject, switchMap } from 'rxjs';
import { forNext } from '../../../../../../../core/utils/for-next.function';
import { DatePicker } from '../../../../../../../shared/components/form/date-picker/date-picker';
import { InputField } from '../../../../../../../shared/components/form/input/input-field';
import { Label } from '../../../../../../../shared/components/form/label/label';
import { Option, Select } from '../../../../../../../shared/components/form/select/select';
import { Badge } from '../../../../../../../shared/ui/badge/badge';
import { Button } from '../../../../../../../shared/ui/button/button';
import { Icon } from '../../../../../../../shared/ui/icon/icon';
import { formatSentenceValue } from '../../../../../../../shared/utils/normalized-text.util';
import { ToastService } from '../../../../../../../core/service/toastService';
import { CoordinationService } from '../../../../data/coordination.service';
import {
  CoordinationCostCenter,
  EMPTY_COORDINATION_COST_CENTERS,
  coordinationCostCenterOptions,
} from '../../../../model/coordination-cost-centers.model';
import {
  findHoursLimitViolation,
  hoursLimitMessage,
} from '../../../../model/hours-limit.model';
import {
  DetalleCargaDocenteRequest,
  SaveDetailProfessorPreloadRequest,
} from '../../../../model/professor-activity-save.model';
import {
  ProfessorLoadDetailItem,
  administrativeSituationData,
  savedAdministrativeActivities,
  savedDependentActivities,
} from '../../../../model/professor-load-detail.model';
import {
  ActivityTypeNode,
  dependentActivityNodes,
} from '../../../../model/professor-activities.model';

interface ActivityChip {
  id: string;
  nombre: string;
  horas: number | null;
  texto: string;
  centroCosto: string;
  terminoDesde: string;
  terminoHasta: string;
  actoNumero: string;
  actoFecha: string;
}

@Component({
  selector: 'app-dependent-activity-select',
  imports: [ReactiveFormsModule, Label, Select, Button, InputField, DatePicker, Badge, Icon],
  templateUrl: './dependent-activity-select.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DependentActivitySelect {
  private readonly destroyRef = inject(DestroyRef);
  private readonly coordinationService = inject(CoordinationService);
  private readonly toastService = inject(ToastService);

  readonly activity = input.required<ActivityTypeNode>();
  readonly idCoordinacion = input<number | null>(null);
  readonly idUnidadRegional = input<number | null>(null);
  readonly idCargaDocente = input<number | null>(null);
  readonly savedDetails = input<ProfessorLoadDetailItem[]>([]);
  readonly activityTree = input<ActivityTypeNode[]>([]);
  readonly hoursLimit = input<number | null>(null);
  readonly withText = input(false);
  readonly withCostCenter = input(false);
  readonly withAdministrative = input(false);
  readonly detailSaved = output<void>();
  readonly isSaving = signal(false);
  readonly isDeleting = signal(false);

  readonly form = new FormGroup({
    actividades: new FormControl<string[]>([], { nonNullable: true }),
    anidadas: new FormControl<string[]>([], { nonNullable: true }),
  });

  private readonly selectedIds = signal<string[]>([]);
  private readonly nestedIds = signal<string[]>([]);
  private readonly hoursById = signal<Record<string, number | null>>({});
  private readonly textById = signal<Record<string, string>>({});
  private readonly costCenterById = signal<Record<string, string>>({});
  private readonly termFromById = signal<Record<string, string>>({});
  private readonly termToById = signal<Record<string, string>>({});
  private readonly actNumberById = signal<Record<string, string>>({});
  private readonly actDateById = signal<Record<string, string>>({});
  private readonly costCenterQuery = signal('');
  private readonly remoteCostCenters = signal<CoordinationCostCenter[] | null>(null);
  private readonly knownCostCenters = signal<Record<string, string>>({});
  private readonly costCenterQuery$ = new Subject<string>();

  private readonly costCentersResource = rxResource({
    params: () => {
      if (!this.withCostCenter()) {
        return undefined;
      }

      const idCoordinacion = this.idCoordinacion();
      if (idCoordinacion == null) {
        return undefined;
      }

      return { idCoordinacion };
    },
    stream: ({ params }) =>
      this.coordinationService.listCoordinationCostCenters(params.idCoordinacion),
    defaultValue: EMPTY_COORDINATION_COST_CENTERS,
  });

  readonly activityOptions = computed(() =>
    this.toOptions(dependentActivityNodes(this.activity(), this.activity().id)),
  );

  readonly nestedOptions = computed(() => this.buildNestedOptions(this.selectedIds()));

  readonly nestedLabel = computed(() => this.buildNestedLabel(this.selectedIds()));

  readonly chips = computed(() => this.buildChips());

  readonly costCenterOptions = computed(() => this.buildCostCenterOptions());

  readonly costCenterEmptyText = computed(() =>
    this.costCenterQuery().trim() && this.remoteCostCenters() == null
      ? 'Buscando...'
      : 'Sin centros de costo',
  );

  readonly savedRows = computed(() =>
    savedDependentActivities(this.savedDetails(), this.activityIds()),
  );

  readonly savedAdministrativeRows = computed(() =>
    savedAdministrativeActivities(this.savedDetails(), this.activityIds()),
  );

  constructor() {
    effect(() => {
      const options = coordinationCostCenterOptions(this.costCentersResource.value());
      untracked(() => this.rememberOptionLabels(options));
    });

    this.form.controls.actividades.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.selectedIds.set(value);
        this.syncDraft([...value, ...this.form.controls.anidadas.value]);
        this.pruneNested(value);
      });

    this.form.controls.anidadas.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.nestedIds.set(value);
        this.syncDraft([...this.form.controls.actividades.value, ...value]);
      });

    this.costCenterQuery$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((texto) => this.coordinationService.listCostCenters(texto)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((centers) => {
        this.rememberCostCenters(centers);
        this.remoteCostCenters.set(this.costCenterQuery().trim() ? centers : null);
      });
  }

  onCostCenterQuery(value: string): void {
    this.costCenterQuery.set(value);
    if (!value.trim()) {
      this.remoteCostCenters.set(null);
    }
    this.costCenterQuery$.next(value);
  }

  sentence(value: string | null | undefined): string {
    return formatSentenceValue(value);
  }

  isCoordinationGroup(group: string): boolean {
    const value = group.toLocaleLowerCase('es-CO');
    return (
      value.startsWith('coordinación') ||
      value.startsWith('coordinacion') ||
      value.startsWith('facultad') ||
      value.startsWith('decanatura') ||
      value.startsWith('departamento')
    );
  }

  isProgramGroup(group: string): boolean {
    return group.toLocaleLowerCase('es-CO').startsWith('programa');
  }

  cleanGroupName(group: string): string {
    return group
      .replace(/^(coordinaci[oó]n|programa|facultad|departamento):\s*/i, '')
      .trim();
  }

  isAddDisabled(): boolean {
    if (this.isSaving() || this.idCargaDocente() == null || this.idCoordinacion() == null) {
      return true;
    }

    const chips = this.chips();
    if (chips.length === 0) {
      return true;
    }

    let ready = true;
    forNext(chips, (chip) => {
      if (chip.horas == null || chip.horas <= 0) {
        ready = false;
      }
      if (this.withCostCenter() && !this.costCenterId(chip.centroCosto)) {
        ready = false;
      }
    });

    return !ready;
  }

  setHours(id: string, value: string | number): void {
    const parsed = typeof value === 'number' ? value : Number(String(value).replace(',', '.'));
    const horas = Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    this.hoursById.update((current) => ({ ...current, [id]: horas }));
  }

  setText(id: string, value: string | number): void {
    const texto = String(value ?? '');
    this.textById.update((current) => ({ ...current, [id]: texto }));
  }

  setCostCenter(id: string, value: string): void {
    this.costCenterById.update((current) => ({ ...current, [id]: value }));
  }

  setTermFrom(id: string, value: string | number): void {
    this.termFromById.update((current) => ({ ...current, [id]: this.textValue(value) }));
  }

  setTermTo(id: string, value: string | number): void {
    this.termToById.update((current) => ({ ...current, [id]: this.textValue(value) }));
  }

  setActNumber(id: string, value: string | number): void {
    this.actNumberById.update((current) => ({ ...current, [id]: this.textValue(value) }));
  }

  setActDate(id: string, value: string | number): void {
    this.actDateById.update((current) => ({ ...current, [id]: this.textValue(value) }));
  }

  removeChip(id: string): void {
    const activities = this.form.controls.actividades.value.filter((item) => item !== id);
    if (activities.length !== this.form.controls.actividades.value.length) {
      this.form.controls.actividades.setValue(activities);
      return;
    }

    const nested = this.form.controls.anidadas.value.filter((item) => item !== id);
    this.form.controls.anidadas.setValue(nested);
  }

  removeSavedDetail(idDetalleCargaDocente: number): void {
    if (this.isDeleting()) {
      return;
    }

    this.isDeleting.set(true);
    firstValueFrom(this.coordinationService.deleteDetailProfessorLoad(idDetalleCargaDocente))
      .then(() => {
        this.detailSaved.emit();
      })
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => this.isDeleting.set(false));
  }

  onAdd(): void {
    const request = this.buildSaveRequest();
    if (!request || this.isSaving() || this.blockedByHoursLimit(request.detalles)) {
      return;
    }

    this.isSaving.set(true);
    firstValueFrom(this.coordinationService.saveActivityDistribution(request))
      .then(() => {
        this.form.controls.actividades.setValue([]);
        this.form.controls.anidadas.setValue([]);
        this.detailSaved.emit();
      })
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => this.isSaving.set(false));
  }

  private blockedByHoursLimit(detalles: DetalleCargaDocenteRequest[]): boolean {
    const violation = findHoursLimitViolation({
      tree: this.activityTree(),
      linkageLimit: this.hoursLimit(),
      saved: this.savedDetails(),
      additions: detalles,
    });
    if (!violation) {
      return false;
    }

    this.toastService.show(hoursLimitMessage(violation), 'error', 'Límite de horas');
    return true;
  }

  private buildSaveRequest(): SaveDetailProfessorPreloadRequest | null {
    const idCargaDocente = this.idCargaDocente();
    const idCoordinacion = this.idCoordinacion();
    const chips = this.chips();
    if (idCargaDocente == null || idCoordinacion == null || chips.length === 0) {
      return null;
    }

    const detalles: DetalleCargaDocenteRequest[] = [];
    forNext(chips, (chip) => {
      const idTipoActividad = Number(chip.id);
      const idCentroCosto = this.costCenterId(chip.centroCosto);
      if (!Number.isInteger(idTipoActividad) || chip.horas == null || chip.horas <= 0) {
        return;
      }
      if (this.withCostCenter() && idCentroCosto == null) {
        return;
      }

      const descripcion = chip.texto.trim();
      detalles.push({
        idTipoActividad,
        horas: chip.horas,
        idCoordinacion,
        idUnidadRegional: this.idUnidadRegional() ?? undefined,
        materia:
          idCentroCosto == null ? null : { codigoMateria: '', idCentroCosto },
        materiaBanco: null,
        extras: '0',
        data: this.withAdministrative() ? this.administrativeData(chip) : null,
        descripcion: descripcion || null,
      });
    });

    if (detalles.length !== chips.length) {
      return null;
    }

    return { idCargaDocente, detalles };
  }

  private activityIds(): Set<number> {
    const ids = new Set<number>();
    this.collectActivityIds(this.activity(), ids);
    return ids;
  }

  private collectActivityIds(node: ActivityTypeNode, ids: Set<number>): void {
    ids.add(node.id);
    forNext(node.hijos, (child) => this.collectActivityIds(child, ids));
  }

  private buildCostCenterOptions(): Option[] {
    const query = this.costCenterQuery().trim();
    const remote = this.remoteCostCenters();
    const base =
      query && remote != null
        ? this.toCostCenterOptions(remote)
        : this.withCostCenterGroups(
            coordinationCostCenterOptions(this.costCentersResource.value()),
          );

    return this.withSelectedCostCenters(query && remote == null ? [] : base);
  }

  private withCostCenterGroups(options: Option[]): Option[] {
    const coordination = formatSentenceValue(
      this.costCentersResource.value()?.nombre?.trim() || 'Coordinación',
    );
    const grouped: Option[] = [];

    forNext(options, (option) => {
      grouped.push({
        ...option,
        group: this.costCenterGroupName(option.group, coordination),
      });
    });

    return grouped;
  }

  private costCenterGroupName(group: string | undefined, coordination: string): string {
    if (group === coordination) {
      return `Coordinación: ${group}`;
    }

    return `Programa: ${group ?? 'Programa'}`;
  }

  private toCostCenterOptions(centers: CoordinationCostCenter[]): Option[] {
    const options: Option[] = [];
    const seen = new Set<string>();
    forNext(centers, (center) => {
      if (center.id == null || seen.has(String(center.id))) {
        return;
      }

      seen.add(String(center.id));
      options.push({
        value: String(center.id),
        label: formatSentenceValue(center.descripcion),
        group: 'Otros centros de costo',
      });
    });
    return options;
  }

  private rememberCostCenters(centers: CoordinationCostCenter[]): void {
    this.knownCostCenters.update((current) => {
      const next = { ...current };
      forNext(centers, (center) => {
        if (center.id == null) {
          return;
        }
        next[String(center.id)] = formatSentenceValue(center.descripcion);
      });
      return next;
    });
  }

  private rememberOptionLabels(options: Option[]): void {
    this.knownCostCenters.update((current) => {
      const next = { ...current };
      forNext(options, (option) => {
        next[option.value] = option.label;
      });
      return next;
    });
  }

  private withSelectedCostCenters(options: Option[]): Option[] {
    const present = new Set<string>();
    forNext(options, (option) => present.add(option.value));

    const known = this.knownCostCenters();
    const extra: Option[] = [];
    forNext(this.chips(), (chip) => {
      const value = chip.centroCosto;
      if (!value || present.has(value)) {
        return;
      }

      present.add(value);
      extra.push({
        value,
        label: known[value] ?? value,
        group: 'Otros centros de costo',
      });
    });

    return extra.length ? [...extra, ...options] : options;
  }

  private costCenterId(value: string): number | null {
    const id = Number(value);
    return Number.isInteger(id) && id > 0 ? id : null;
  }

  private buildNestedOptions(selectedIds: string[]): Option[] {
    const selected = new Set(selectedIds);
    const nodes: ActivityTypeNode[] = [];

    forNext(dependentActivityNodes(this.activity(), this.activity().id), (node) => {
      if (!selected.has(String(node.id))) {
        return;
      }

      forNext(dependentActivityNodes(this.activity(), node.id), (child) => {
        nodes.push(child);
      });
    });

    return this.toOptions(nodes);
  }

  private buildNestedLabel(selectedIds: string[]): string {
    const selected = new Set(selectedIds);
    const labels: string[] = [];

    forNext(dependentActivityNodes(this.activity(), this.activity().id), (node) => {
      if (!selected.has(String(node.id))) {
        return;
      }

      if (dependentActivityNodes(this.activity(), node.id).length === 0) {
        return;
      }

      labels.push(node.nombre?.trim() || 'Actividad');
    });

    if (labels.length === 1) {
      return labels[0];
    }

    return 'Actividad';
  }

  private buildChips(): ActivityChip[] {
    const selected = new Set([...this.selectedIds(), ...this.nestedIds()]);
    const hours = this.hoursById();
    const texts = this.textById();
    const costCenters = this.costCenterById();
    const termFrom = this.termFromById();
    const termTo = this.termToById();
    const actNumbers = this.actNumberById();
    const actDates = this.actDateById();
    const chips: ActivityChip[] = [];
    const seen = new Set<string>();

    forNext(this.orderedNodes(), (node) => {
      const id = String(node.id);
      if (!selected.has(id) || seen.has(id)) {
        return;
      }

      seen.add(id);
      chips.push({
        id,
        nombre: node.nombre?.trim() || 'Actividad',
        horas: hours[id] ?? null,
        texto: texts[id] ?? '',
        centroCosto: costCenters[id] ?? '',
        terminoDesde: termFrom[id] ?? '',
        terminoHasta: termTo[id] ?? '',
        actoNumero: actNumbers[id] ?? '',
        actoFecha: actDates[id] ?? '',
      });
    });

    return chips;
  }

  private orderedNodes(): ActivityTypeNode[] {
    const nodes: ActivityTypeNode[] = [];

    forNext(dependentActivityNodes(this.activity(), this.activity().id), (node) => {
      nodes.push(node);
      forNext(dependentActivityNodes(this.activity(), node.id), (child) => {
        nodes.push(child);
      });
    });

    return nodes;
  }

  private pruneNested(parentIds: string[]): void {
    const allowed = new Set(this.buildNestedOptions(parentIds).map((option) => option.value));
    const current = this.form.controls.anidadas.value;
    const next = current.filter((id) => allowed.has(id));
    if (next.length !== current.length) {
      this.form.controls.anidadas.setValue(next);
    }
  }

  private syncDraft(ids: string[]): void {
    this.hoursById.update((current) => {
      const next: Record<string, number | null> = {};
      forNext(ids, (id) => {
        next[id] = current[id] ?? null;
      });
      return next;
    });
    this.textById.update((current) => {
      const next: Record<string, string> = {};
      forNext(ids, (id) => {
        next[id] = current[id] ?? '';
      });
      return next;
    });
    this.costCenterById.update((current) => {
      const next: Record<string, string> = {};
      forNext(ids, (id) => {
        next[id] = current[id] ?? '';
      });
      return next;
    });
    this.termFromById.update((current) => this.keepText(current, ids));
    this.termToById.update((current) => this.keepText(current, ids));
    this.actNumberById.update((current) => this.keepText(current, ids));
    this.actDateById.update((current) => this.keepText(current, ids));
  }

  private keepText(current: Record<string, string>, ids: string[]): Record<string, string> {
    const next: Record<string, string> = {};
    forNext(ids, (id) => {
      next[id] = current[id] ?? '';
    });
    return next;
  }

  private textValue(value: string | number): string {
    return String(value ?? '');
  }

  private administrativeData(chip: ActivityChip): string | null {
    return administrativeSituationData({
      desde: chip.terminoDesde,
      hasta: chip.terminoHasta,
      numero: chip.actoNumero,
      fecha: chip.actoFecha,
    });
  }

  private toOptions(nodes: ActivityTypeNode[]): Option[] {
    const options: Option[] = [];
    const seen = new Set<string>();

    forNext(nodes, (node) => {
      const value = String(node.id);
      if (seen.has(value)) {
        return;
      }

      seen.add(value);
      options.push({
        value,
        label: node.nombre?.trim() || 'Actividad',
      });
    });

    return options;
  }
}
