import {
  FechaFormMeta,
  isHiringContratacion,
  ModalityFormItem,
} from './preload-call.model';
import {
  BuildPreloadCallSavePayloadParams,
  PreloadCallFechaCodigo,
  PreloadCallSaveCotc,
  PreloadCallSaveCotcFecha,
  PreloadCallSaveFecha,
  PreloadCallSaveRequest,
} from './preload-call-save.model';

function resolveFechaId(
  fechasMeta: FechaFormMeta[],
  codigo: PreloadCallFechaCodigo,
): number | undefined {
  return fechasMeta.find((item) => item.codigo === codigo)?.id;
}

function buildFechaIfComplete(
  codigo: PreloadCallFechaCodigo,
  fechaInicio: string,
  fechaFin: string,
  id?: number,
): PreloadCallSaveFecha | null {
  const inicio = fechaInicio.trim();
  const fin = fechaFin.trim();
  if (!inicio || !fin) {
    return null;
  }
  const fecha: PreloadCallSaveFecha = {
    codigo,
    fechaInicio: inicio,
    fechaFin: fin,
    id: id ?? null,
  };
  return fecha;
}

function resolveCotcGroupKey(item: ModalityFormItem): string {
  if (item.cotcId != null) {
    return `cotc-${item.cotcId}`;
  }
  return `mod-${item.tipoModalidad}`;
}

function mapCotcFecha(row: ModalityFormItem): PreloadCallSaveCotcFecha {
  return {
    id: row.fechaId ?? null,
    vacaciones: row.diasVacaciones ?? null,
    fechaInicio: row.fechaInicio ?? null,
    fechaFin: row.fechaFin ?? null,
    semanas: row.semanas ?? null,
  };
}

function mapConvocatoriaTipoContratacion(
  rows: ModalityFormItem[],
  skipFechas: boolean,
): PreloadCallSaveCotc[] {
  const groups = new Map<string, ModalityFormItem[]>();

  for (const row of rows) {
    const key = resolveCotcGroupKey(row);
    const current = groups.get(key) ?? [];
    current.push(row);
    groups.set(key, current);
  }

  return Array.from(groups.values()).map((group) => {
    const first = group[0];
    const omitFechas = skipFechas;

    return {
      id: first.cotcId ?? null,
      idModalidadContratacion: Number(first.tipoModalidad),
      fechas: omitFechas ? [] : group.map((row) => mapCotcFecha(row)),
    };
  });
}

function buildCallFechas(
  params: BuildPreloadCallSavePayloadParams,
  includeCteiIsu: boolean,
): PreloadCallSaveFecha[] {
  const fechas: PreloadCallSaveFecha[] = [];
  const convocatoriaFecha = buildFechaIfComplete(
    'CNV',
    params.fechaInicio,
    params.fechaFin,
    resolveFechaId(params.fechasMeta, 'CNV'),
  );

  if (convocatoriaFecha) {
    fechas.push(convocatoriaFecha);
  }

  if (!includeCteiIsu) {
    return fechas;
  }

  const cteiFecha = buildFechaIfComplete(
    'CTEI',
    params.fechaInicioCtei,
    params.fechaFinCtei,
    resolveFechaId(params.fechasMeta, 'CTEI'),
  );
  const isuFecha = buildFechaIfComplete(
    'ISU',
    params.fechaInicioIsu,
    params.fechaFinIsu,
    resolveFechaId(params.fechasMeta, 'ISU'),
  );

  if (cteiFecha) {
    fechas.push(cteiFecha);
  }
  if (isuFecha) {
    fechas.push(isuFecha);
  }

  return fechas;
}

export function buildPreloadCallSavePayload(
  params: BuildPreloadCallSavePayloadParams,
): PreloadCallSaveRequest {
  const isHiring = isHiringContratacion(params.contratacion);

  const convocatoria: PreloadCallSaveRequest['convocatoria'] = {
    nombre: params.nombre.trim(),
    descripcion: params.descripcion.trim(),
    autoriza: {
      id: params.idPersonaNaturalGeneral,
      documentoIdentidad: params.documentoIdentidad.trim(),
      nombreCompleto: params.nombreCompleto.trim(),
    },
    periodo: {
      id: params.periodo.id,
      periodo: params.periodo.periodo,
      ano: params.periodo.anio,
    },
    nivelEducativo: {
      id: params.nivelEducativo.id,
      descripcion: params.nivelEducativo.descripcion,
    },
    contratacion: params.contratacion ?? '0',
  };

  if (params.convocatoriaId != null) {
    convocatoria.id = params.convocatoriaId;
  }

  return {
    convocatoria,
    fechas: buildCallFechas(params, !isHiring),
    convocatoriaTipoContratacion: mapConvocatoriaTipoContratacion(
      params.modalityRows,
      isHiring,
    ),
  };
}
