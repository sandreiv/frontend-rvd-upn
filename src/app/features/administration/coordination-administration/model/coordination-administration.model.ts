import { TabBarItem } from '../../../../shared/ui/tab-bar/tab-bar.types';

export type CoordinationAdministrationTabId =
  | 'associationCoordinations'
  | 'costCenters'
  | 'people'

export interface CatalogOptionItem {
  id: number;
  label: string;
  codigo?: string | null;
}

export interface CoordinationAssociationCatalogs {
  coordinaciones: CatalogOptionItem[];
  programas: CatalogOptionItem[];
  centrosCosto: CatalogOptionItem[];
  personas: CatalogOptionItem[];
}

export interface CoordinationAssociationItem {
  id: number;
  idCoordinacion: number;
  coordinacion: string;
  idPrograma?: number | null;
  programa?: string | null;
  idCentroCosto: number | null;
  centroCosto: string | null;
  estado: '1' | '0' | 'ACTIVO' | 'INACTIVO' | string;
}

export interface CoordinationAssociationFormData {
  id?: number | null;
  idCoordinacion: number;
  idPrograma?: number | null;
  idCentroCosto: number | null;
  estado: '1' | '0';
}

export interface DeleteBulkCoordinationAssociationRequest {
  ids: number[];
}

export const COORDINATION_ADMINISTRATION_TABS: TabBarItem[] = [
  {
    id: 'associationCoordinations',
    label: 'Asociación coordinaciones',
    accent: 'brand',
  },
  {
    id: 'costCenters',
    label: 'Centros costo',
    accent: 'brandDeep',
  },
  {
    id: 'people',
    label: 'Personas',
    accent: 'brandLight',
  },
];

export interface CostCenterAssignmentItem {
  id: number;
  idCoordinacion: number;
  coordinacion: string;
  idCentroCosto: number;
  centroCosto: string;
  estado: '1' | '0' | 'ACTIVO' | 'INACTIVO' | string;
}

export interface CostCenterAssignmentFormData {
  id?: number | null;
  idCoordinacion: number;
  idCentroCosto: number;
  estado: '1' | '0';
}

export interface DeleteBulkCostCenterAssignmentRequest {
  ids: number[];
}

export interface PersonCoordinationItem {
  id: number,
  idPersonaGeneral: number;
  persona: string;
  documentoIdentidad: string;
  idCoordinacion: number;
  coordinacion: string;
  estado: '1' | '0' | 'ACTIVO' | 'INACTIVO' | string;
}

export interface PersonCoordinationFormData {
  id?: number | null;
  idPersonaGeneral: number;
  idCoordinacion: number;
  estado: '1' | '0';
}

export interface PersonCoordinationKey {
  idPersonaGeneral: number;
  idCoordinacion: number;
}

export interface DeleteBulkPersonCoordinationRequest {
  registros: PersonCoordinationKey[];
}

export interface CoordinationManagementItem {
  id: number;
  idCoordinacionPadre: number | null;

  idUnidadRegional: number | null;
  unidadRegional: string | null;

  idUnidad: number | null;
  unidad: string | null;

  esAcademica: '1' | '0' | 'S' | 'N' | string;
}

export interface CoordinationManagementFormData {
  idUnidadRegional: number;
  idUnidad: number;
  esAcademica: '1' | '0';
}

export interface DeleteBulkCoordinationsRequest {
  ids: number[];
}