import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GeoRutasDetalle } from '../../interfaces/geo-rutas-detalle';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class GeoRutasDetallesService {
  private API_URI = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getRutasDetallesList(): Observable<GeoRutasDetalle[]> {
    return this.http.get<GeoRutasDetalle[]>(`${this.API_URI}/geo-rutas-detalle`)
      .pipe(
        catchError(this.handleError)
      );
  }

  getRutasDetalles(id: number): Observable<GeoRutasDetalle> {
    return this.http.get<GeoRutasDetalle>(`${this.API_URI}/geo-rutas-detalle/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  guardarRutasDetalles(rutaDetalle: GeoRutasDetalle): Observable<GeoRutasDetalle> {
    return this.http.post<GeoRutasDetalle>(`${this.API_URI}/geo-rutas-detalle`, rutaDetalle)
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    // Distingue entre errores del lado del cliente/red y errores del backend.
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o de red.
      console.error('Ocurrió un error:', error.error.message);
    } else {
      // El backend retornó un código de respuesta no exitoso.
      console.error(
        `El backend retornó el código ${error.status}, ` +
        `el cuerpo del error fue: ${JSON.stringify(error.error)}`);
    }
    // Retorna un observable con un mensaje de error legible para el usuario.
    return throwError(
      'Algo salió mal; por favor, inténtelo de nuevo más tarde.');
  }
}