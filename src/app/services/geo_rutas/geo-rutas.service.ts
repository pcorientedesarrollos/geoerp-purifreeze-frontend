import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { GeoRutas } from '../../interfaces/geo-rutas';
import { environment } from '../../../enviroments/enviroments';

@Injectable({
  providedIn: 'root'
})
export class GeoRutasService {

  private readonly API_URI = `${environment.apiUrl}/geo-rutas`;

  constructor(private http: HttpClient) {}


  getRutasList(): Observable<GeoRutas[]> {
    return this.http.get<GeoRutas[]>(this.API_URI)
      .pipe(
        catchError(this.handleError)
      );
  }


  getRutaById(id: number): Observable<GeoRutas> {
    return this.http.get<GeoRutas>(`${this.API_URI}/${id}`)
      .pipe(
        catchError(this.handleError)
      );
  }


  guardarRuta(ruta: GeoRutas): Observable<GeoRutas> {
    return this.http.post<GeoRutas>(this.API_URI, ruta)
      .pipe(
        catchError(this.handleError)
      );
  }




  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // Ocurrió un error del lado del cliente o de la red.
      console.error('Ocurrió un error:', error.error.message);
    } else {
      // El backend retornó un código de respuesta no exitoso.
      // El cuerpo de la respuesta puede contener pistas sobre lo que salió mal.
      console.error(
        `El backend retornó el código ${error.status}, ` +
        `el cuerpo del error fue: ${JSON.stringify(error.error)}`);
    }
    // Retorna un observable con un mensaje de error legible para el usuario final.
    return throwError(
      'Algo malo ha sucedido; por favor, inténtelo de nuevo más tarde.');
  }
}