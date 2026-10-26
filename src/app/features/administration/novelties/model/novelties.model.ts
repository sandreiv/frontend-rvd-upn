import { NoveltyComponentKey } from "../../../configuration/professor-preload/model/novelties.model";

export type NoveltyAction =
  | 'ACTUALIZAR'
  | 'ELIMINAR'
  | 'GUARDAR';

export interface NoveltyItem {
  id: number;
  tipo: string;
  descripcion: string;
  accion: NoveltyAction | string;
  componente: NoveltyComponentKey | null;
  forPlanta: '1' | '0' | string | null;
}

export interface NoveltyFormData {
  tipo: string;
  descripcion: string;
  accion: NoveltyAction;
  componente: NoveltyComponentKey | null;
  forPlanta: '1' | '0';
}

export interface DeleteBulkNoveltiesRequest {
  ids: number[];
}

export const NOVELTY_ACTION_OPTIONS = [
  {
    value: 'ACTUALIZAR',
    label: 'Actualizar',
  },
  {
    value: 'ELIMINAR',
    label: 'Eliminar',
  },
  {
    value: 'GUARDAR',
    label: 'Guardar',
  },
];

export interface NoveltyComponentOption {
  value: NoveltyComponentKey;
  label: string;
}

export const NOVELTY_COMPONENT_OPTIONS: NoveltyComponentOption[] = [
  {
    value: 'asign-name-nn',
    label: 'Asignar nombre a NN',
  },
  {
    value: 'update-contract-value',
    label: 'Actualizar valor de contrato',
  },
  {
    value: 'change-professor',
    label: 'Cambio de docente',
  },
  {
    value: 'change-contract-modality',
    label: 'Cambio de modalidad de contrato',
  },
  {
    value: 'change-direct-activities',
    label: 'Cambio en actividades directas',
  },
  {
    value: 'change-project-activities',
    label: 'Cambio en actividades indirectas y proyectos',
  },
]