
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';
import { GeoUnidadTransporte } from '../../interfaces/geo_unidad-transportes';

@Injectable({
  providedIn: 'root'
})
export class GeoUnidadTransportesService {
  private readonly API_URI = `${environment.apiUrl}/geo-unidad-transporte`;

  constructor(private http: HttpClient) { }

  // --- MÉTODO NUEVO ---
  // Obtiene solo las unidades disponibles para ser asignadas a una nueva ruta.
  getAvailableUnidadesTransporte(): Observable<GeoUnidadTransporte[]> {
    return this.http.get<GeoUnidadTransporte[]>(`${this.API_URI}/available`)
      .pipe(catchError(this.handleError));
  }

  // --- MÉTODOS EXISTENTES (se mantienen por si se usan en otro lugar) ---
  getUnidadesTransporte(): Observable<GeoUnidadTransporte[]> {
    return this.http.get<GeoUnidadTransporte[]>(this.API_URI)
      .pipe(catchError(this.handleError));
  }

  createUnidadTransporte(unidad: Partial<GeoUnidadTransporte>): Observable<GeoUnidadTransporte> {
    return this.http.post<GeoUnidadTransporte>(this.API_URI, unidad)
      .pipe(catchError(this.handleError));
  }

  updateUnidadTransporte(id: number, unidad: Partial<GeoUnidadTransporte>): Observable<any> {
    return this.http.patch(`${this.API_URI}/${id}`, unidad)
      .pipe(catchError(this.handleError));
  }

  deleteUnidadTransporte(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URI}/${id}`)
      .pipe(catchError(this.handleError));
  }
  
  private handleError(error: HttpErrorResponse) {
    // ... (sin cambios en el manejo de errores)
    if (error.status === 0) {
      console.error('Ocurrió un error de red o del cliente:', error.error);
    } else {
      console.error(
        `El backend retornó el código ${error.status}, ` +
        `el cuerpo del error fue: ${JSON.stringify(error.error)}`
      );
    }
    return throwError(() => new Error('Algo malo ha sucedido; por favor, inténtelo de nuevo más tarde.'));
  }
}