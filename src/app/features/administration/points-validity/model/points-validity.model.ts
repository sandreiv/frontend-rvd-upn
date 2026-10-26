export interface PointsValidityItem {
  id: number;
  anio: number;
  valorPunto: string;
}

export interface PointsValidityFormData {
  anio: number;
  valorPunto: string;
}

export interface DeleteBulkPointsValidityRequest {
  ids: number[];
}