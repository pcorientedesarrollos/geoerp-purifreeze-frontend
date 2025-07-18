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
  // Esta comprobación funciona tanto en el navegador como en el servidor (SSR)
  if (error.status === 0) {
    // Ocurrió un error del lado del cliente o de la red.
    console.error('Ocurrió un error de red o del cliente:', error.error);
  } else {
    // El backend retornó un código de respuesta no exitoso.
    // El cuerpo de la respuesta puede contener pistas sobre lo que salió mal.
    console.error(
      `El backend retornó el código ${error.status}, ` +
      `el cuerpo del error fue: ${JSON.stringify(error.error)}`
    );
  }
  
  // Retorna un observable con un mensaje de error legible para el usuario final.
  // Se usa la sintaxis moderna de throwError.
  return throwError(() => new Error('Algo malo ha sucedido; por favor, inténtelo de nuevo más tarde.'));
}
}