import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';
import { GeoStatus } from '../../interfaces/geo_status';

@Injectable({
  providedIn: 'root'
})
export class GeoStatusService {

  private readonly API_URI = `${environment.apiUrl}/geo-status`;

  constructor(private http: HttpClient) { }

  getStatuses(): Observable<GeoStatus[]> {
    return this.http.get<GeoStatus[]>(this.API_URI)
      .pipe(
        catchError(this.handleError)
      );
  }

  getStatusById(id: number): Observable<GeoStatus> {
    return this.http.get<GeoStatus>(`${this.API_URI}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  createStatus(status: GeoStatus): Observable<GeoStatus> {
    return this.http.post<GeoStatus>(this.API_URI, status)
      .pipe(
        catchError(this.handleError)
      );
  }

  updateStatus(id: number, status: GeoStatus): Observable<GeoStatus> {
    return this.http.put<GeoStatus>(`${this.API_URI}/${id}`, status)
      .pipe(
        catchError(this.handleError)
      );
  }

  deleteStatus(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URI}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }
  
  changeStatus(id: number, estado: number): Observable<GeoStatus> {
    return this.http.patch<GeoStatus>(`${this.API_URI}/${id}`, { activo: estado })
      .pipe(
        catchError(this.handleError)
      );
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