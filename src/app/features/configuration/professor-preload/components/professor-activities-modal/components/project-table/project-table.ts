import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { forNext } from '../../../../../../../core/utils/for-next.function';
import { Checkbox } from '../../../../../../../shared/components/form/input/checkbox';
import { Select } from '../../../../../../../shared/components/form/select/select';
import { Button } from '../../../../../../../shared/ui/button/button';
import { formatSentenceValue } from '../../../../../../../shared/utils/normalized-text.util';
import { CoordinationService } from '../../../../data/coordination.service';
import {
  EMPTY_COORDINATION_COST_CENTERS,
  coordinationCostCenterOptions,
} from '../../../../model/coordination-cost-centers.model';
import {
  DetalleCargaDocenteRequest,
  SaveDetailProfessorPreloadRequest,
} from '../../../../model/professor-activity-save.model';
import { ProfessorLoadDetailItem } from '../../../../model/professor-load-detail.model';
import {
  ProfessorProjectItem,
  ProfessorProjectSchedule,
  ProjectExtraField,
  projectFunctionLabel,
  projectLevelLabel,
  projectProgramName,
  projectScheduleLines,
  projectSubjectName,
} from '../../../../model/professor-project.model';

interface ProjectDetailRef {
  id: number;
  horas: number | null;
  idPrograma: number | null;
  centroCosto: string | null;
}

@Component({
  selector: 'app-project-table',
  imports: [Checkbox, Button, Select],
  templateUrl: './project-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTable {
  private readonly coordinationService = inject(CoordinationService);

  readonly projects = input<ProfessorProjectItem[]>([]);
  readonly extraField = input<ProjectExtraField | null>(null);
  readonly showParticularSubject = input(false);
  readonly showCostCenter = input(false);
  readonly activityId = input.required<number>();
  readonly idCoordinacion = input<number | null>(null);
  readonly idUnidadRegional = input<number | null>(null);
  readonly idCargaDocente = input<number | null>(null);
  readonly savedDetails = input<ProfessorLoadDetailItem[]>([]);
  readonly detailSaved = output<void>();

  private readonly selectedIds = signal<number[]>([]);
  private readonly costCenterByProject = signal<Record<number, string>>({});
  readonly isSaving = signal(false);

  private readonly costCentersResource = rxResource({
    params: () => {
      if (!this.showCostCenter()) {
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

  readonly costCenterOptions = computed(() =>
    coordinationCostCenterOptions(this.costCentersResource.value()),
  );

  sentence(value: string | null | undefined): string {
    return formatSentenceValue(value);
  }

  functionLabel(value: string | null | undefined): string {
    return projectFunctionLabel(value);
  }

  levelLabel(value: string | null | undefined): string {
    return projectLevelLabel(value);
  }

  scheduleLines(blocks: ProfessorProjectSchedule[] | null | undefined): string[] {
    return projectScheduleLines(blocks);
  }

  subjectName(item: ProfessorProjectItem): string {
    return projectSubjectName(item);
  }

  programName(item: ProfessorProjectItem): string {
    return projectProgramName(item);
  }

  hoursLabel(horas: string | null | undefined): string {
    const value = this.parseHours(horas);
    return value == null ? '-' : String(value);
  }

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
  }

  isLinked(id: number): boolean {
    return this.linkedProjectIds().includes(id);
  }

  selectedCostCenter(id: number): string {
    return this.costCenterByProject()[id] ?? '';
  }

  savedCostCenter(id: number): string {
    const detailId = this.projectLinks().get(id);
    let label = '-';
    forNext(this.activityDetails(), (detail) => {
      if (detail.id === detailId && detail.centroCosto) {
        label = detail.centroCosto;
      }
    });
    return label;
  }

  setCostCenter(id: number, value: string): void {
    this.costCenterByProject.update((current) => ({ ...current, [id]: value }));
  }

  isDisassociateDisabled(): boolean {
    return this.isSaving() || this.selectedDetailIds().length === 0;
  }

  toggleProject(id: number, checked: boolean): void {
    this.selectedIds.update((ids) => {
      if (checked) {
        return ids.includes(id) ? ids : [...ids, id];
      }

      return ids.filter((item) => item !== id);
    });
  }

  isAssociateDisabled(): boolean {
    return (
      this.isSaving() ||
      !this.hasSelection() ||
      this.idCargaDocente() == null ||
      this.idCoordinacion() == null
    );
  }

  associate(): void {
    const request = this.buildSaveRequest();
    if (!request || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    firstValueFrom(this.coordinationService.saveActivityDistribution(request))
      .then(() => {
        this.selectedIds.set([]);
        this.detailSaved.emit();
      })
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => this.isSaving.set(false));
  }

  disassociate(): void {
    const ids = this.selectedDetailIds();
    if (ids.length === 0 || this.isSaving()) {
      return;
    }

    this.isSaving.set(true);
    firstValueFrom(this.coordinationService.deleteDetailProfessorLoadBulk({ ids }))
      .then(() => {
        this.selectedIds.set([]);
        this.detailSaved.emit();
      })
      .catch((error: unknown) => {
        console.error(error);
      })
      .finally(() => this.isSaving.set(false));
  }

  private hasSelection(): boolean {
    return this.pendingProjects().length > 0;
  }

  private pendingProjects(): ProfessorProjectItem[] {
    const selected = new Set(this.selectedIds());
    const linked = new Set(this.linkedProjectIds());
    const pending: ProfessorProjectItem[] = [];

    forNext(this.projects(), (item) => {
      const horas = this.parseHours(item.horas);
      if (!selected.has(item.id) || linked.has(item.id) || horas == null || horas <= 0) {
        return;
      }

      if (this.showCostCenter() && this.costCenterId(item.id) == null) {
        return;
      }

      pending.push(item);
    });

    return pending;
  }

  private buildSaveRequest(): SaveDetailProfessorPreloadRequest | null {
    const idCargaDocente = this.idCargaDocente();
    const idCoordinacion = this.idCoordinacion();
    const pending = this.pendingProjects();
    if (idCargaDocente == null || idCoordinacion == null || pending.length === 0) {
      return null;
    }

    const detalles: DetalleCargaDocenteRequest[] = [];
    forNext(pending, (item) => {
      const horas = this.parseHours(item.horas);
      if (horas == null || horas <= 0) {
        return;
      }

      const idCentroCosto = this.showCostCenter()
        ? this.costCenterId(item.id)
        : this.listedCostCenterId(item);
      detalles.push({
        idTipoActividad: this.activityId(),
        horas,
        idCoordinacion,
        idUnidadRegional: this.idUnidadRegional() ?? undefined,
        idPrograma: this.programId(item),
        materia:
          idCentroCosto == null
            ? null
            : { codigoMateria: '', idCentroCosto },
        materiaBanco: null,
        extras: '0',
        data: null,
      });
    });
    if (detalles.length === 0) {
      return null;
    }

    return { idCargaDocente, detalles };
  }

  private selectedDetailIds(): number[] {
    const selected = new Set(this.selectedIds());
    const links = this.projectLinks();
    const ids: number[] = [];

    forNext(this.projects(), (item) => {
      const id = links.get(item.id);
      if (!selected.has(item.id) || id == null || ids.includes(id)) {
        return;
      }

      ids.push(id);
    });

    return ids;
  }

  private linkedProjectIds(): number[] {
    const links = this.projectLinks();
    const ids: number[] = [];

    forNext(this.projects(), (item) => {
      if (links.has(item.id)) {
        ids.push(item.id);
      }
    });

    return ids;
  }

  private projectLinks(): Map<number, number> {
    const available = this.activityDetails();
    const used: number[] = [];
    const links = new Map<number, number>();

    forNext(this.projects(), (project) => {
      const id = this.matchDetail(available, used, project, true);
      if (id == null) {
        return;
      }

      used.push(id);
      links.set(project.id, id);
    });

    forNext(this.projects(), (project) => {
      if (links.has(project.id)) {
        return;
      }

      const id = this.matchDetail(available, used, project, false);
      if (id == null || this.otherProjectNeeds(project.id, id, links)) {
        return;
      }

      used.push(id);
      links.set(project.id, id);
    });

    return links;
  }

  private matchDetail(
    available: ProjectDetailRef[],
    used: number[],
    project: ProfessorProjectItem,
    sameHours: boolean,
  ): number | null {
    const horas = this.parseHours(project.horas);
    const programId = project.idPrograma ?? null;
    let match: number | null = null;

    forNext(available, (detail) => {
      if (match != null || used.includes(detail.id) || detail.idPrograma !== programId) {
        return;
      }

      if (sameHours && detail.horas !== horas) {
        return;
      }

      match = detail.id;
    });

    return match;
  }

  private otherProjectNeeds(
    projectId: number,
    detailId: number,
    links: Map<number, number>,
  ): boolean {
    let needed = false;

    forNext(this.projects(), (project) => {
      if (needed || project.id === projectId || links.has(project.id)) {
        return;
      }

      if (this.sameRelation(project, detailId)) {
        needed = true;
      }
    });

    return needed;
  }

  private sameRelation(project: ProfessorProjectItem, detailId: number): boolean {
    const horas = this.parseHours(project.horas);
    const programId = project.idPrograma ?? null;
    let same = false;

    forNext(this.activityDetails(), (detail) => {
      if (detail.id === detailId && detail.horas === horas && detail.idPrograma === programId) {
        same = true;
      }
    });

    return same;
  }

  private activityDetails(): ProjectDetailRef[] {
    const activityId = this.activityId();
    const details: ProjectDetailRef[] = [];

    forNext(this.savedDetails(), (detail) => {
      forNext(detail.detalles, (item) => {
        const already = details.some((row) => row.id === detail.idDetalleCargaDocente);
        if (item.tipoActividad?.id !== activityId || already) {
          return;
        }

        details.push({
          id: detail.idDetalleCargaDocente,
          horas: this.parseHours(item.horas),
          idPrograma: item.programa?.id ?? null,
          centroCosto: item.centroCosto?.descripcion?.trim()
            ? formatSentenceValue(item.centroCosto.descripcion)
            : null,
        });
      });
    });

    return details;
  }

  private programId(item: ProfessorProjectItem): number | undefined {
    const particular = this.showParticularSubject()
      ? item.proyecto?.materiaParticular?.programa?.id
      : null;
    const id = particular ?? item.idPrograma;
    return id != null && Number.isInteger(id) && id > 0 ? id : undefined;
  }

  private listedCostCenterId(item: ProfessorProjectItem): number | null {
    const id = item.idCentroCosto;
    return id != null && Number.isInteger(id) && id > 0 ? id : null;
  }

  private costCenterId(projectId: number): number | null {
    const raw = this.costCenterByProject()[projectId];
    const value = Number(raw);
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  private parseHours(horas: string | null | undefined): number | null {
    if (horas == null || !horas.trim()) {
      return null;
    }

    const value = Number(horas.trim().replace(',', '.'));
    return Number.isFinite(value) ? value : null;
  }
}
