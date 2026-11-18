import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { forNext } from '../../../../../../../core/utils/for-next.function';
import { Checkbox } from '../../../../../../../shared/components/form/input/checkbox';
import { Button } from '../../../../../../../shared/ui/button/button';
import { formatSentenceValue } from '../../../../../../../shared/utils/normalized-text.util';
import { CoordinationService } from '../../../../data/coordination.service';
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
  projectScheduleLines,
} from '../../../../model/professor-project.model';

interface ProjectDetailRef {
  id: number;
  horas: number | null;
  idPrograma: number | null;
}

@Component({
  selector: 'app-project-table',
  imports: [Checkbox, Button],
  templateUrl: './project-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectTable {
  private readonly coordinationService = inject(CoordinationService);

  readonly projects = input<ProfessorProjectItem[]>([]);
  readonly extraField = input<ProjectExtraField | null>(null);
  readonly activityId = input.required<number>();
  readonly idCoordinacion = input<number | null>(null);
  readonly idUnidadRegional = input<number | null>(null);
  readonly idCargaDocente = input<number | null>(null);
  readonly savedDetails = input<ProfessorLoadDetailItem[]>([]);
  readonly detailSaved = output<void>();

  private readonly selectedIds = signal<number[]>([]);
  readonly isSaving = signal(false);

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

  hoursLabel(horas: string | null | undefined): string {
    const value = this.parseHours(horas);
    return value == null ? '-' : String(value);
  }

  isSelected(id: number): boolean {
    return this.selectedIds().includes(id);
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

      detalles.push({
        idTipoActividad: this.activityId(),
        horas,
        idCoordinacion,
        idUnidadRegional: this.idUnidadRegional() ?? undefined,
        idPrograma: item.idPrograma ?? undefined,
        materia: null,
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
        });
      });
    });

    return details;
  }

  private parseHours(horas: string | null | undefined): number | null {
    if (horas == null || !horas.trim()) {
      return null;
    }

    const value = Number(horas.trim().replace(',', '.'));
    return Number.isFinite(value) ? value : null;
  }
}
