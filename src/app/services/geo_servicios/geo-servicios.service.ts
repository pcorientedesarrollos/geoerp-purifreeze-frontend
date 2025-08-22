// Contenido para copiar y pegar
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';
import { Servicio } from '../../interfaces/geo_servicios';

@Injectable({
  providedIn: 'root'
})
export class GeoServiciosService {
  private readonly API_URI = `${environment.apiUrl}/geo-servicios`;

  constructor(private http: HttpClient) { }

  
    getTodosLosServicios(): Observable<Servicio[]> {
      return this.http
        .get<Servicio[]>(this.API_URI)
        .pipe(catchError(this.handleError));
    }


  getServiciosPorCliente(idCliente: number): Observable<Servicio[]> {
    return this.http.get<Servicio[]>(`${this.API_URI}/cliente/${idCliente}`)
      .pipe(
        catchError(error => {
          console.error(`Error al obtener servicios para el cliente ${idCliente}:`, error);
          return of([]);
        })
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

    return throwError(
      () =>
        new Error(
          'Algo malo ha sucedido; por favor, inténtelo de nuevo más tarde.'
        )
    );
  }

}

