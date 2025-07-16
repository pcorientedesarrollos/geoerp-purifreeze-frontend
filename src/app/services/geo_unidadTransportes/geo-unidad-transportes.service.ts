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

  getUnidadesTransporte(): Observable<GeoUnidadTransporte[]> {
    return this.http.get<GeoUnidadTransporte[]>(this.API_URI)
      .pipe(catchError(this.handleError));
  }

  getUnidadTransporteById(id: number): Observable<GeoUnidadTransporte> {
    return this.http.get<GeoUnidadTransporte>(`${this.API_URI}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createUnidadTransporte(unidad: GeoUnidadTransporte): Observable<GeoUnidadTransporte> {
    return this.http.post<GeoUnidadTransporte>(this.API_URI, unidad)
      .pipe(catchError(this.handleError));
  }

  updateUnidadTransporte(id: number, unidad: GeoUnidadTransporte): Observable<GeoUnidadTransporte> {
    return this.http.put<GeoUnidadTransporte>(`${this.API_URI}/${id}`, unidad)
      .pipe(catchError(this.handleError));
  }

  deleteUnidadTransporte(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URI}/${id}`)
      .pipe(catchError(this.handleError));
  }



  
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o de la red.
      console.error('Ocurrió un error:', error.error.message);
    } else {
      // El backend retornó un código de respuesta no exitoso.
      console.error(
        `El backend retornó el código ${error.status}, ` +
        `el cuerpo del error fue: ${JSON.stringify(error.error)}`);
    }
    // Retorna un observable con un mensaje de error legible para el usuario final.
    return throwError(
      'Algo salió mal; por favor, inténtelo de nuevo más tarde.');
  }
}