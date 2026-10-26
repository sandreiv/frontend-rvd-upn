import { PRELOAD_FUNC } from '../../../../core/config/func-route.map';
import { NoveltyComponentKey } from './novelties.model';

/**
 * Componente de novedad → funcionalidad hija de Vortal para su
 * guardado. El coordinador solo ve y persiste las claves cuyo código
 * traiga el árbol.
 *
 * Para envolver un guardado nuevo:
 * 1. Crear la hija en Vortal (p. ej. 02_17) y asignarla al rol.
 * 2. Añadir la clave en PRELOAD_FUNC.
 * 3. Añadir canXxx() en PermissionService.
 * 4. Registrar aquí el componente → código.
 */
export const NOVELTY_SAVE_FUNC: Partial<
  Record<NoveltyComponentKey, string>
> = {
  'change-contract-modality':
    PRELOAD_FUNC.SAVE_CONTRACT_MODALITY_PROFESSOR,
};

/**
 * Si el componente aún no tiene hija en Vortal, el guardado sigue
 * permitido. En cuanto se registra el código, queda condicionado.
 */
export function hasNoveltySavePermission(
  can: (codigo: string) => boolean,
  key: NoveltyComponentKey | null,
): boolean {
  if (key == null) {
    return false;
  }

  const codigo = NOVELTY_SAVE_FUNC[key];
  if (codigo == null) {
    return true;
  }

  return can(codigo);
}
