import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';
import { GeoTipoServicio } from '../../interfaces/geo_tipo-servicios';

@Injectable({
  providedIn: 'root'
})
export class GeoTipoServicioService {

  private readonly API_URI = `${environment.apiUrl}/geo-tipo-servicio`;

  constructor(private http: HttpClient) { }

  getTiposServicio(): Observable<GeoTipoServicio[]> {
    return this.http.get<GeoTipoServicio[]>(this.API_URI)
      .pipe(
        catchError(this.handleError)
      );
  }

  getTipoServicioById(id: number): Observable<GeoTipoServicio> {
    return this.http.get<GeoTipoServicio>(`${this.API_URI}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createTipoServicio(tipoServicio: GeoTipoServicio): Observable<GeoTipoServicio> {
    return this.http.post<GeoTipoServicio>(this.API_URI, tipoServicio)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateTipoServicio(id: number, tipoServicio: GeoTipoServicio): Observable<GeoTipoServicio> {
    return this.http.put<GeoTipoServicio>(`${this.API_URI}/${id}`, tipoServicio)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteTipoServicio(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URI}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  changeStatus(id: number, estado: number): Observable<GeoTipoServicio> {
    // El método PATCH es ideal para actualizaciones parciales
    return this.http.patch<GeoTipoServicio>(`${this.API_URI}/${id}`, { activo: estado })
      .pipe(
        catchError(this.handleError)
      );
  }

  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente o de la red.
      console.error('Ocurrió un error:', error.error.message);
    } else {
      // El backend retornó un código de error.
      console.error(
        `El backend retornó el código ${error.status}, ` +
        `el cuerpo del error fue: ${JSON.stringify(error.error)}`);
    }
    // Retorna un observable con un mensaje de error para el usuario final.
    return throwError(
      'Algo salió mal; por favor, inténtelo de nuevo más tarde.');
  }
}