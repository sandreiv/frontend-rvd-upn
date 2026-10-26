import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';

/**
 * Servicio simulado para demostrar el patrón de carga de datos
 * En producción, reemplaza estas llamadas con HttpClient.get()
 *
 * Patrón recomendado:
 * 1. Método getRecords(offset, limit) que retorna Observable<T[]>
 * 2. El componente padre se suscribe en onLoadMore
 * 3. Los datos nuevos se agregan al array existente
 */

export interface Record {
  id: number;
  title: string;
  description: string;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class DataLoadingService {
  private totalRecords = 100;

  /**
   * Simula una llamada HTTP GET con offset/limit
   * En producción:
   * return this.http.get<Record[]>('/api/records', { params: { offset, limit } });
   */
  getRecords(offset: number, limit: number): Observable<Record[]> {
    // Generar datos simulados
    const data: Record[] = [];
    const maxIndex = Math.min(offset + limit, this.totalRecords);

    for (let i = offset; i < maxIndex; i++) {
      data.push({
        id: i + 1,
        title: `Registro ${i + 1}`,
        description: `Descripción del registro ${i + 1}`,
        createdAt: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
      });
    }

    // Retornar con delay de 500ms para simular red
    return of(data).pipe(delay(500));
  }

  /**
   * Ejemplo: obtener registros filtrados
   * En producción:
   * return this.http.get<Record[]>('/api/records', {
   *   params: { offset, limit, search }
   * });
   */
  getRecordsFiltered(
    offset: number,
    limit: number,
    searchTerm: string,
  ): Observable<Record[]> {
    // Simular filtrado
    const allData = this.generateAllData();
    const filtered = allData.filter((r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const data = filtered.slice(offset, offset + limit);
    return of(data).pipe(delay(500));
  }

  /**
   * Helper: generar todos los datos (para simulación)
   * En producción no necesitarías esto
   */
  private generateAllData(): Record[] {
    const data: Record[] = [];
    for (let i = 0; i < this.totalRecords; i++) {
      data.push({
        id: i + 1,
        title: `Registro ${i + 1}`,
        description: `Descripción del registro ${i + 1}`,
        createdAt: `2024-01-${String((i % 28) + 1).padStart(2, '0')}`,
      });
    }
    return data;
  }
}

