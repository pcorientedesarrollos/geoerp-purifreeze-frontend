// RUTA: src/app/services/dashboard.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../enviroments/enviroments';

// Interfaces para tipar las respuestas del backend
export interface DashboardStats {
  vehiculosEnRuta: number;
  distanciaTotal: number; //
}
export interface LiveLocation {
  idUnidadTransporte: number;
  latitud: string;
  longitud: string;
  ultimaActualizacion: string;
  nombreUnidad: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly apiUrl = `${environment.apiUrl}/dashboard`;
  private http = inject(HttpClient);

  /**
   * Obtiene las estadísticas del dashboard.
   * @param month El mes para filtrar (opcional).
   * @param year El año para filtrar (opcional).
   */
  getStats(month?: number, year?: number): Observable<DashboardStats> {
    let params = new HttpParams();
    if (month) {
      params = params.set('month', month.toString());
    }
    if (year) {
      params = params.set('year', year.toString());
    }

    return this.http.get<DashboardStats>(`${this.apiUrl}/stats`, { params });
  }

  /**
   * Obtiene las ubicaciones en tiempo real de los vehículos en ruta.
   */
  getLiveLocations(): Observable<LiveLocation[]> {
    return this.http.get<LiveLocation[]>(`${this.apiUrl}/live-locations`);
  }
}
