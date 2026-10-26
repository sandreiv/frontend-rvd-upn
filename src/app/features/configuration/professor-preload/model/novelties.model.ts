export type NoveltyComponentKey =
  | 'asign-name-nn'
  | 'update-contract-value'
  | 'change-professor'
  | 'change-professor-hours'
  | 'change-contract-modality'
  | 'change-direct-activities'
  | 'change-project-activities';

export interface NoveltiesItem {
  id: number;
  tipo: string;
  descripcion: string;
  accion: string;
  componente?: NoveltyComponentKey | string | null;
}

const NOVELTY_COMPONENT_KEYS: NoveltyComponentKey[] = [
  'asign-name-nn',
  'update-contract-value',
  'change-professor',
  'change-professor-hours',
  'change-contract-modality',
  'change-direct-activities',
  'change-project-activities',
];

export function isNoveltyComponentKey(
  value: string | null | undefined,
): value is NoveltyComponentKey {
  return (
    value != null &&
    NOVELTY_COMPONENT_KEYS.includes(value as NoveltyComponentKey)
  );
}


