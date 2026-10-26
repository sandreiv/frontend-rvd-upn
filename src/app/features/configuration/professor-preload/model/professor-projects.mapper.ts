import { SimpleActivity } from './professor-activities-modal.models';
import {
  PersonaProyectoDto,
  ProfessorProjectRow,
  ProyectoDocenteDto,
} from './professor-projects.model';

export function detectProjectActivityCodigos(
  proyectos: ProyectoDocenteDto[],
  idPersonaGeneral: number | null | undefined,
  allowedCodigos?: readonly string[],
): string[] {
  if (idPersonaGeneral == null) {
    return [];
  }

  const allowed =
    allowedCodigos != null ? new Set(allowedCodigos) : null;
  const codigos = new Set<string>();

  for (let index = 0; index < proyectos.length; index += 1) {
    const proyecto = proyectos[index];
    for (
      let personaIndex = 0;
      personaIndex < proyecto.personaProyecto.length;
      personaIndex += 1
    ) {
      const persona = proyecto.personaProyecto[personaIndex];
      if (persona.idPersonaGeneral !== idPersonaGeneral) {
        continue;
      }

      const codigo = persona.tipoActividad.codigo;
      if (allowed && !allowed.has(codigo)) {
        continue;
      }

      codigos.add(codigo);
    }
  }

  return Array.from(codigos);
}

export function buildProjectHierarchyRows(
  proyectos: ProyectoDocenteDto[],
  activityCodigo: string,
  idPersonaGeneral: number | null | undefined,
): ProfessorProjectRow[] {
  if (idPersonaGeneral == null) {
    return [];
  }

  const rows: ProfessorProjectRow[] = [];
  for (let index = 0; index < proyectos.length; index += 1) {
    const proyecto = proyectos[index];
    const parentPersona = findPersonaProyecto(
      proyecto.personaProyecto,
      idPersonaGeneral,
      activityCodigo,
    );
    if (!parentPersona) {
      continue;
    }

    const productos = proyecto.productos ?? [];
    const tieneHijos = productos.length > 0;

    rows.push(
      mapToProjectRow(proyecto, parentPersona, 0, true, true),
    );

    if (!tieneHijos) {
      continue;
    }

    for (let childIndex = 0; childIndex < productos.length; childIndex += 1) {
      const producto = productos[childIndex];
      const childPersona = findPersonaProyecto(
        producto.personaProyecto,
        idPersonaGeneral,
        activityCodigo,
      );
      if (!childPersona) {
        continue;
      }

      rows.push(
        mapToProjectRow(producto, childPersona, 1, false, false),
      );
    }
  }

  return rows;
}

export function mapProjectsToActivityRows(
  proyectos: ProyectoDocenteDto[],
  activityCodigo: string,
  idPersonaGeneral: number | null | undefined,
): SimpleActivity[] {
  const hierarchyRows = buildProjectHierarchyRows(
    proyectos,
    activityCodigo,
    idPersonaGeneral,
  );

  return hierarchyRows
    .filter((row) => row.esSeleccionable)
    .map((row) => ({
      id: String(row.idPersonaProyecto),
      actividad: row.nombreActividad,
      horasDedicacion: row.horasDedicacion ?? 0,
      descripcionProyecto: row.nombreProyecto,
    }));
}

export function sumProjectActivityHours(rows: SimpleActivity[]): number {
  let total = 0;
  for (let index = 0; index < rows.length; index += 1) {
    total += rows[index].horasDedicacion ?? 0;
  }
  return total;
}

function findPersonaProyecto(
  personas: PersonaProyectoDto[],
  idPersonaGeneral: number,
  activityCodigo: string,
): PersonaProyectoDto | undefined {
  return personas.find(
    (item) =>
      item.idPersonaGeneral === idPersonaGeneral &&
      item.tipoActividad.codigo === activityCodigo,
  );
}

function mapToProjectRow(
  proyecto: ProyectoDocenteDto,
  persona: PersonaProyectoDto,
  nivel: 0 | 1,
  esPadre: boolean,
  esSeleccionable: boolean,
): ProfessorProjectRow {
  return {
    idPersonaProyecto: persona.id,
    idProyecto: proyecto.id,
    idTipoActividad: persona.tipoActividad.id,
    codigoTipoActividad: persona.tipoActividad.codigo,
    nombreProyecto: resolveProjectLabel(proyecto),
    nombreActividad: persona.tipoActividad.nombre,
    horasDedicacion:
      nivel === 1
        ? parseChildProjectHours(persona.horas)
        : parseProjectHours(persona.horas),
    nivel,
    esPadre,
    esSeleccionable,
  };
}

function parseProjectHours(horas: string): number {
  const trimmed = horas?.trim() ?? '';
  if (!trimmed) {
    return 0;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseChildProjectHours(horas: string): number | null {
  const trimmed = horas?.trim() ?? '';
  if (!trimmed) {
    return null;
  }

  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveProjectLabel(proyecto: ProyectoDocenteDto): string {
  return proyecto.nombre?.trim() || proyecto.descripcion?.trim() || '';
}
