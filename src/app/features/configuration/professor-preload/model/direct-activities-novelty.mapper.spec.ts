import { describe, expect, it } from 'vitest';
import { DirectLearningActivity } from './professor-activities-modal.models';
import { flattenDirectActivities } from './direct-activities-novelty.mapper';

function activity(
  overrides: Partial<DirectLearningActivity> = {},
): DirectLearningActivity {
  return {
    id: 'a1',
    criterio: 'FAD',
    unidad: 'Pamplona',
    programa: 'Sistemas',
    materia: 'Calculo',
    horasPresenciales: 8,
    grupo: 'A',
    cupos: 30,
    idTipoActividad: 2,
    codigoTipoActividad: 'FAD',
    idUnidadRegional: 1,
    idPrograma: 5,
    codigoMateria: '11501',
    idGrupo: 10,
    ...overrides,
  };
}

describe('flattenDirectActivities', () => {
  it('aplana las actividades de todos los códigos', () => {
    const rows = flattenDirectActivities({
      FAD: [activity({ id: 'a1' }), activity({ id: 'a2' })],
    });

    expect(rows).toHaveLength(2);
    expect(rows[0].id).toBe('a1');
    expect(rows[1].id).toBe('a2');
  });
});
