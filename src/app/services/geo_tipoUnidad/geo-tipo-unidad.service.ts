import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GeoTipoUnidad } from '../../interfaces/geo_tipo-unidad';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class GeoTipoUnidadService {

  private readonly API_URI = `${environment.apiUrl}/geo-tipo-unidades`;

  constructor(private http: HttpClient) { }

  getTiposUnidad(): Observable<GeoTipoUnidad[]> {
    return this.http.get<GeoTipoUnidad[]>(this.API_URI)
      .pipe(
        catchError(this.handleError) // Centraliza el manejo de errores
      );
  }

  getTipoUnidadById(id: number): Observable<GeoTipoUnidad> {
    const url = `${this.API_URI}/${id}`;
    return this.http.get<GeoTipoUnidad>(url)
      .pipe(
        catchError(this.handleError)
      );
  }

  createTipoUnidad(tipoUnidad: GeoTipoUnidad): Observable<GeoTipoUnidad> {
    return this.http.post<GeoTipoUnidad>(this.API_URI, tipoUnidad)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateTipoUnidad(id: number, tipoUnidad: GeoTipoUnidad): Observable<GeoTipoUnidad> {
    const url = `${this.API_URI}/${id}`;
    return this.http.put<GeoTipoUnidad>(url, tipoUnidad)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteTipoUnidad(id: number): Observable<void> {
    const url = `${this.API_URI}/${id}`;
    return this.http.delete<void>(url)
      .pipe(
        catchError(this.handleError)
      );
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