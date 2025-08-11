
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';
import { GeoRutaDetallePayload, GeoRutasDetalle, ServicioDisponible } from '../../interfaces/geo-rutas-detalle';

@Injectable({
  providedIn: 'root'
})
export class GeoRutasDetalleService {
  private readonly API_URI = `${environment.apiUrl}/geo-rutas-detalle`;

  constructor(private http: HttpClient) {}

  findServiciosDisponiblesParaRuta(): Observable<ServicioDisponible[]> {
    return this.http
      .get<ServicioDisponible[]>(`${this.API_URI}/servicios-disponibles`)
      .pipe(catchError(this.handleError));
  }

  create(payload: GeoRutaDetallePayload): Observable<GeoRutasDetalle> {
    return this.http
      .post<GeoRutasDetalle>(this.API_URI, payload)
      .pipe(catchError(this.handleError));
  }

  getAll(): Observable<GeoRutasDetalle[]> {
    return this.http
      .get<GeoRutasDetalle[]>(this.API_URI)
      .pipe(catchError(this.handleError));
  }

  getPorId(id: number): Observable<GeoRutasDetalle> {
    return this.http
      .get<GeoRutasDetalle>(`${this.API_URI}/${id}`)
      .pipe(catchError(this.handleError));
  }

  // --- MÉTODO UPDATE AÑADIDO Y CORREGIDO ---
  // Necesario para cambiar el estado (status) de un servicio.
  update(id: number, payload: Partial<GeoRutasDetalle>): Observable<GeoRutasDetalle> {
    return this.http
      .patch<GeoRutasDetalle>(`${this.API_URI}/${id}`, payload)
      .pipe(catchError(this.handleError));
  }

  // --- MÉTODO REMOVE AÑADIDO Y CORREGIDO ---
  // Necesario para eliminar un servicio de una ruta.
  remove(id: number): Observable<any> {
    return this.http
      .delete(`${this.API_URI}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
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