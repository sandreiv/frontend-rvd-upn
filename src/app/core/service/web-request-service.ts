import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { StorageService } from './storage-service';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class WebRequestService {
  private http = inject(HttpClient);
  private storageService = inject(StorageService);

  // Base URL desde environment
  private baseUrl: string = environment.api.baseUrl;

  constructor() {}

  /**
   * Obtener headers con token de autorización
   */
  private getAuthHeaders(customHeaders?: any, includeJsonContentType = true): HttpHeaders {
    //const token = this.storageService.getToken();
    //const user = this.storageService.getUser();
    return new HttpHeaders({
      ...(includeJsonContentType && { 'Content-Type': 'application/json' }),
      ...customHeaders,
      //...(token && { Authorization: `Bearer ${token}` }),
    });
  }

  /**
   * GET simple
   * @param endpoint - Ruta del endpoint (ej: '/cvs', '/usuarios')
   * @param params - Parámetros de query opcionales
   */
  get<T = any>(endpoint: string, params?: any): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      params: params,
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * GET con headers personalizados
   */
  getWithHeaders<T = any>(endpoint: string, params?: any, customHeaders?: any): Observable<T> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      params: params,
      headers: this.getAuthHeaders(customHeaders),
    });
  }

  /**
   * GET observando la respuesta completa (headers, status, etc.)
   */
  getObserve<T = any>(endpoint: string, params?: any): Observable<any> {
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, {
      params: params,
      headers: this.getAuthHeaders(),
      observe: 'response',
    });
  }

  /**
   * GET para previsualizacion de documentos en Editar
   */

  getBlob(endpoint: string, params?: any): Observable<Blob> {
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      params,
      headers: this.getAuthHeaders(undefined, false),
      responseType: 'blob',
    });
  }

  /**
   * GET blob observando la respuesta completa (headers, status, body).
   * Útil para descargas con Content-Disposition.
   */
  getBlobResponse(
    endpoint: string,
    params?: any,
  ): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}${endpoint}`, {
      params,
      headers: this.getAuthHeaders(undefined, false),
      responseType: 'blob',
      observe: 'response',
    });
  }

  /**
   * POST simple
   * @param endpoint - Ruta del endpoint
   * @param payload - Body de la petición
   * @param params - Parámetros de query opcionales
   */
  post<T = any>(endpoint: string, payload: any, params?: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, payload, {
      params: params,
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * POST sin token (para login, registro, etc.)
   */
  postWithoutAuth<T = any>(endpoint: string, payload: any, customHeaders?: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, payload, {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        ...customHeaders,
      }),
    });
  }

  /**
   * POST con headers personalizados
   */
  postWithHeaders<T = any>(
    endpoint: string,
    payload: any,
    customHeaders?: any,
    params?: any,
  ): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, payload, {
      params: params,
      headers: this.getAuthHeaders(customHeaders),
    });
  }

  /**
   * POST observando respuesta completa
   */
  postObserve<T = any>(endpoint: string, payload: any, params?: any): Observable<any> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, payload, {
      params: params,
      headers: this.getAuthHeaders(),
      observe: 'response',
    });
  }

  /**
   * POST con FormData (sin Content-Type fijo para permitir boundary automático)
   */
  postFormData<T = any>(endpoint: string, payload: FormData, params?: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, payload, {
      params: params,
      headers: this.getAuthHeaders(undefined, false),
    });
  }

  /**
   * PUT con FormData (sin Content-Type fijo para permitir boundary automático)
   */
  putFormData<T = any>(endpoint: string, payload: FormData, params?: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, payload, {
      params: params,
      headers: this.getAuthHeaders(undefined, false),
    });
  }

  /**
   * PUT
   */
  put<T = any>(endpoint: string, payload: any, params?: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, payload, {
      params: params,
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * PUT con headers personalizados
   */
  putWithHeaders<T = any>(
    endpoint: string,
    payload: any,
    customHeaders?: any,
    params?: any,
  ): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, payload, {
      params: params,
      headers: this.getAuthHeaders(customHeaders),
    });
  }

  /**
   * PATCH
   */
  patch<T = any>(endpoint: string, payload: any, params?: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, payload, {
      params: params,
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * DELETE
   */
  delete<T = any>(endpoint: string, params?: any): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
      params: params,
      headers: this.getAuthHeaders(),
    });
  }

  /**
   * DELETE con headers personalizados
   */
  deleteWithHeaders<T = any>(endpoint: string, customHeaders?: any, params?: any): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
      params: params,
      headers: this.getAuthHeaders(customHeaders),
    });
  }
}
