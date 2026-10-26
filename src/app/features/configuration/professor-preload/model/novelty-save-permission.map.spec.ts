import { describe, expect, it } from 'vitest';
import { PRELOAD_FUNC } from '../../../../core/config/func-route.map';
import { hasNoveltySavePermission } from './novelty-save-permission.map';

describe('hasNoveltySavePermission', () => {
  it('exige 02_16 para cambio de modalidad', () => {
    const withoutPermission = hasNoveltySavePermission(
      () => false,
      'change-contract-modality',
    );
    const withPermission = hasNoveltySavePermission(
      (codigo) =>
        codigo === PRELOAD_FUNC.SAVE_CONTRACT_MODALITY_PROFESSOR,
      'change-contract-modality',
    );

    expect(withoutPermission).toBe(false);
    expect(withPermission).toBe(true);
  });

  it('permite novedades sin hija registrada en Vortal', () => {
    expect(
      hasNoveltySavePermission(() => false, 'asign-name-nn'),
    ).toBe(true);
    expect(
      hasNoveltySavePermission(
        () => false,
        'change-direct-activities',
      ),
    ).toBe(true);
  });

  it('es falsa si no hay componente seleccionado', () => {
    expect(hasNoveltySavePermission(() => true, null)).toBe(false);
  });
});
