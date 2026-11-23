/**
 * Autor: GRUPO DE DESARROLLO ESPECÍFICO - CIADTI - Universidad de Pamplona
 * Modificaciones:
 * 09/11/2026 - Leonel Antonio Perez Rios - Ajuste de columnas para participantes y roles en esquema general
 * 10/11/2026 - Leonel Antonio Perez Rios - Remoción de columna rol inexistente en BD
 * 10/11/2026 - Leonel Antonio Perez Rios - Inclusión de badge para la columna de estado y refactorización limpia
 * 13/11/2026 - Inclusión de columnas Función y Centro de costo
 * 17/11/2026 - Inclusión de columna Nivel académico, tipado estricto, eliminación de tipos any y formateo de horario dinámico
 */
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Output,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { ProjectsService } from '../../data/projects.service';
import { DataTable } from '../../../../../shared/ui/data-table/data-table';
import {
  DataTableActionEvent,
  DataTableColumn,
  DataTableRowAction,
  DataTableToolbarActionEvent,
} from '../../../../../shared/ui/data-table/table.types';
import {
  DayOfWeekOption,
  ParticipantDataPayload,
  ParticipantFunctionOption,
  ParticipantLevelOption,
  ParticipantSchedule,
  ParticipantScheduleSlot,
  ProjectPersonItem,
} from '../../model/projects.model';

@Component({
  selector: 'app-project-person-table',
  imports: [DataTable],
  templateUrl: './project-person-table.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectPersonTable {
  private readonly projectsService = inject(ProjectsService);
  private readonly functionLabels = signal<Record<string, string>>({});
  private readonly levelLabels = signal<Record<string, string>>({});
  private readonly dayLabels = signal<Record<string, string>>({});

  persons = input<ProjectPersonItem[]>([]);
  selectedPersonIds = model<string[]>([]);
  isGestionable = input(true);

  constructor() {
    this.projectsService.listParticipantFunctions().subscribe({
      next: (list: ParticipantFunctionOption[]) => {
        const map: Record<string, string> = {};
        for (const item of list ?? []) {
          map[item.codigo] = item.nombre;
        }
        this.functionLabels.set(map);
      },
      error: () => {},
    });

    this.projectsService.listParticipantLevels().subscribe({
      next: (list: ParticipantLevelOption[]) => {
        const map: Record<string, string> = {};
        for (const item of list ?? []) {
          map[item.codigo] = item.nombre;
        }
        this.levelLabels.set(map);
      },
      error: () => {},
    });

    this.projectsService.listDaysOfWeek().subscribe({
      next: (list: DayOfWeekOption[]) => {
        const map: Record<string, string> = {};
        for (const item of list ?? []) {
          map[item.codigo] = item.abreviacion;
        }
        this.dayLabels.set(map);
      },
      error: () => {},
    });
  }

  @Output() refreshPersons = new EventEmitter<void>();
  @Output() addPerson = new EventEmitter<void>();
  @Output() editPerson = new EventEmitter<ProjectPersonItem>();
  @Output() deletePerson = new EventEmitter<ProjectPersonItem>();
  @Output() deleteAll = new EventEmitter<number[]>();

  readonly rowIdentity = (row: ProjectPersonItem): string => String(row.id);

  readonly columns: DataTableColumn<ProjectPersonItem>[] = [
    {
      id: 'docente',
      header: 'Docente',
      allowHtml: true,
      cell: (row) => this.formatDocente(row),
    },
    {
      id: 'centroCosto',
      header: 'Centro de costo',
      allowHtml: true,
      cell: (row) => this.formatCentroCosto(row),
    },
    {
      id: 'horas',
      header: 'Horas',
      allowHtml: true,
      cell: (row) => this.formatHoras(row),
    },
    {
      id: 'observacion',
      header: 'Observación',
      cell: (row) => row.observacion || '-',
      formatAsSentence: true,
    },
    {
      id: 'estado',
      header: 'Estado',
      allowHtml: true,
      cell: (row) => this.formatStatusBadge(row.esActivo || row.estado),
    },
  ];

  readonly rowActions = computed<DataTableRowAction<ProjectPersonItem>[]>(() => {
    if (this.isGestionable()) {
      return [
        { id: 'edit', label: 'Editar', icon: 'pencil' },
        {
          id: 'delete',
          label: 'Eliminar',
          icon: 'delete',
          className: 'text-red-500',
        },
      ];
    }
    return [
      { id: 'edit', label: 'Ver detalle', icon: 'eye' },
    ];
  });

  onToolbarAction(event: DataTableToolbarActionEvent<ProjectPersonItem>): void {
    if (event.actionId === 'refresh') {
      this.refreshPersons.emit();
      return;
    }

    if (event.actionId === 'add') {
      this.addPerson.emit();
      return;
    }

    if (event.actionId === 'deleteAll') {
      const numericIds = event.selectedIds
        .map((id: string | number) => Number(id))
        .filter((id: number) => Number.isFinite(id));
      this.deleteAll.emit(numericIds);
    }
  }

  onRowAction(event: DataTableActionEvent<ProjectPersonItem>): void {
    if (event.actionId === 'edit') {
      this.editPerson.emit(event.row);
      return;
    }

    if (event.actionId === 'delete') {
      this.deletePerson.emit(event.row);
    }
  }

  onSelectedIdsChange(keys: Array<string | number>): void {
    this.selectedPersonIds.set(keys.map((key) => String(key)));
  }

  private formatDocente(row: ProjectPersonItem): string {
    const nombre = row.nombreCompleto || '-';
    const doc = row.documento ? `Doc: ${row.documento}` : '';

    const funcionNombre = this.resolveFuncionLabel(row.funcion ?? row.data);
    const nivelNombre = this.resolveNivelLabel(row.nivel ?? row.data);

    const tags: string[] = [];
    if (doc) {
      tags.push(`<span>${doc}</span>`);
    }
    if (funcionNombre) {
      tags.push(
        `<span class="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10 dark:bg-blue-400/10 dark:text-blue-400 dark:ring-blue-400/30"><strong class="font-semibold text-blue-800 dark:text-blue-300">Función:</strong> ${funcionNombre}</span>`,
      );
    }
    if (nivelNombre) {
      tags.push(
        `<span class="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10 dark:bg-purple-400/10 dark:text-purple-400 dark:ring-purple-400/30"><strong class="font-semibold text-purple-800 dark:text-purple-300">Nivel:</strong> ${nivelNombre}</span>`,
      );
    }

    const subline = tags.length > 0
      ? `<div class="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-normal">${tags.join(' • ')}</div>`
      : '';

    return `
      <div>
        <span class="font-medium text-gray-900 dark:text-white capitalize">${nombre}</span>
        ${subline}
      </div>
    `;
  }

  private parseDataPayload(data?: string | null): ParticipantDataPayload | null {
    if (!data || !data.trim().startsWith('{')) {
      return null;
    }
    try {
      const parsed = JSON.parse(data.trim());
      return parsed && typeof parsed === 'object' ? (parsed as ParticipantDataPayload) : null;
    } catch {
      return null;
    }
  }

  private resolveFuncionLabel(funcion?: string | null): string | null {
    if (!funcion) {
      return null;
    }
    const trimmed = funcion.trim();
    const parsed = this.parseDataPayload(trimmed);
    const code = parsed?.funcion ? String(parsed.funcion) : (!trimmed.startsWith('{') ? trimmed : null);
    if (!code) {
      return null;
    }
    return this.functionLabels()[code] || code;
  }

  private resolveNivelLabel(nivel?: string | null): string | null {
    if (!nivel) {
      return null;
    }
    const trimmed = nivel.trim();
    const parsed = this.parseDataPayload(trimmed);
    const code = parsed?.nivel ? String(parsed.nivel) : (!trimmed.startsWith('{') ? trimmed : null);
    if (!code) {
      return null;
    }
    return this.levelLabels()[code] || code;
  }

  private formatCentroCosto(row: ProjectPersonItem): string {
    const cc =
      row.centroCostoCodigo && row.centroCostoNombre
        ? `${row.centroCostoCodigo} - ${row.centroCostoNombre}`
        : row.centroCostoNombre || row.centroCostoCodigo || '-';

    if (!row.programaNombre) {
      return cc;
    }

    return `
      <div>
        <span>${cc}</span>
        <span class="block text-[11px] text-gray-500 dark:text-gray-400 font-normal">Prog: ${row.programaNombre}</span>
      </div>
    `;
  }

  private formatHoras(row: ProjectPersonItem): string {
    const horasText = row.horas ? `${row.horas} hrs` : '-';
    const horarioSummary = this.extractHorarioSummary(row.data);
    if (!horarioSummary) {
      return horasText;
    }
    return `
      <div>
        <span class="font-medium text-gray-900 dark:text-white">${horasText}</span>
        <span class="block text-[11px] text-gray-500 dark:text-gray-400 font-normal">${horarioSummary}</span>
      </div>
    `;
  }

  private extractHorarioSummary(data?: string | null): string | null {
    const parsed = this.parseDataPayload(data);
    if (!parsed?.horario) {
      return null;
    }

    const labels = this.dayLabels();
    const getDayName = (code: string): string =>
      labels[code] || labels[String(code).toUpperCase()] || code;

    if (Array.isArray(parsed.horario)) {
      const slots: ParticipantScheduleSlot[] = parsed.horario;
      if (slots.length === 0) {
        return null;
      }

      const first = slots[0];
      const allSameRange = slots.every(
        (s: ParticipantScheduleSlot) =>
          s.horaInicio === first?.horaInicio && s.horaFin === first?.horaFin,
      );

      if (allSameRange) {
        const days = slots.map((s: ParticipantScheduleSlot) => getDayName(s.dia)).join(', ');
        const range =
          first?.horaInicio && first?.horaFin ? ` (${first.horaInicio} - ${first.horaFin})` : '';
        return `${days}${range}`;
      }

      return slots
        .map((s: ParticipantScheduleSlot) => {
          const d = getDayName(s.dia);
          return s.horaInicio && s.horaFin ? `${d} (${s.horaInicio}-${s.horaFin})` : d;
        })
        .join(', ');
    }

    const legacy = parsed.horario as ParticipantSchedule;
    if (Array.isArray(legacy.dias) && legacy.dias.length > 0) {
      const days = legacy.dias.map((d: string) => getDayName(d)).join(', ');
      const range =
        legacy.horaInicio && legacy.horaFin
          ? ` (${legacy.horaInicio} - ${legacy.horaFin})`
          : '';
      return `${days}${range}`;
    }

    return null;
  }

  private formatStatusBadge(value: string | null | undefined): string {
    const normalized = String(value ?? '').trim().toUpperCase();
    const isActive =
      normalized === '1' ||
      normalized === 'S' ||
      normalized === 'SI' ||
      normalized === 'ACTIVO' ||
      normalized === 'TRUE';

    if (isActive) {
      return `
        <span class="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 border border-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Activo
        </span>
      `;
    }

    return `
      <span class="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-medium text-rose-700 border border-rose-200/80 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
        <span class="h-1.5 w-1.5 rounded-full bg-rose-500"></span>
        Inactivo
      </span>
    `;
  }
}
