export interface PublicAccessRequest {
  numeroDocumento: string;
  fechaExpedicion: string;
}

export interface PublicTeacherProfile {
  numeroDocumento: string;
  nombreCompleto: string;
}

export interface PublicTeacher extends PublicTeacherProfile {
  id: number;
}

export interface PublicSessionResponse {
  accessToken: string;
  docente: PublicTeacherProfile;
}
