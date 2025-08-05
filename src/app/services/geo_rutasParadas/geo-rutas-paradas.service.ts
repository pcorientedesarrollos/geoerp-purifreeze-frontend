import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroments';

import { GeoRutasParada } from '../../interfaces/geo-rutas-parada';
import { catchError, Observable, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeoRutasParadasService {
  private readonly API_URI = `${environment.apiUrl}/geo-rutas-paradas`;

  constructor(private http: HttpClient) {}

  getRutasParadasList(): Observable<GeoRutasParada[]> {
    return this.http
      .get<GeoRutasParada[]>(this.API_URI)
      .pipe(catchError(this.handleError));
  }

  getRutasParada(id: number): Observable<GeoRutasParada> {
    return this.http
      .get<GeoRutasParada>(`${this.API_URI}/${id}`)
      .pipe(catchError(this.handleError));
  }

  guardarRutasParada(rutaParadas: GeoRutasParada): Observable<GeoRutasParada> {
    return this.http
      .post<GeoRutasParada>(this.API_URI, rutaParadas)
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
    return throwError(
      () =>
        new Error(
          'Algo malo ha sucedido; por favor, inténtelo de nuevo más tarde.'
        )
    );
  }
}
