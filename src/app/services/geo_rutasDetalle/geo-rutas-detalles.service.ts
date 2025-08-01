// import { Injectable } from '@angular/core';
// import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// import { Observable, throwError } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { GeoRutasDetalle } from '../../interfaces/geo-rutas-detalle';
// import { environment } from '../../../enviroments/enviroments';

// @Injectable({
//   providedIn: 'root'
// })
// export class GeoRutasDetallesService {
//   private API_URI = environment.apiUrl;

//   constructor(private http: HttpClient) {}

//   getRutasDetallesList(): Observable<GeoRutasDetalle[]> {
//     return this.http.get<GeoRutasDetalle[]>(`${this.API_URI}/geo-rutas-detalle`)
//       .pipe(
//         catchError(this.handleError)
//       );
//   }

//   getRutasDetalles(id: number): Observable<GeoRutasDetalle> {
//     return this.http.get<GeoRutasDetalle>(`${this.API_URI}/geo-rutas-detalle/${id}`)
//       .pipe(
//         catchError(this.handleError)
//       );
//   }

//   guardarRutasDetalles(rutaDetalle: GeoRutasDetalle): Observable<GeoRutasDetalle> {
//     return this.http.post<GeoRutasDetalle>(`${this.API_URI}/geo-rutas-detalle`, rutaDetalle)
//       .pipe(
//         catchError(this.handleError)
//       );
//   }

// private handleError(error: HttpErrorResponse) {
//   // Esta comprobación funciona tanto en el navegador como en el servidor (SSR)
//   if (error.status === 0) {
//     // Ocurrió un error del lado del cliente o de la red.
//     console.error('Ocurrió un error de red o del cliente:', error.error);
//   } else {
//     // El backend retornó un código de respuesta no exitoso.
//     // El cuerpo de la respuesta puede contener pistas sobre lo que salió mal.
//     console.error(
//       `El backend retornó el código ${error.status}, ` +
//       `el cuerpo del error fue: ${JSON.stringify(error.error)}`
//     );
//   }
  
//   // Retorna un observable con un mensaje de error legible para el usuario final.
//   // Se usa la sintaxis moderna de throwError.
//   return throwError(() => new Error('Algo malo ha sucedido; por favor, inténtelo de nuevo más tarde.'));}


// }


// src/app/services/geo_rutasDetalle/geo-rutas-detalle.service.ts

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';

// --- IMPORTACIONES DE INTERFACES CORREGIDAS ---
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

  private handleError(error: HttpErrorResponse) {
    if (error.status === 0) {
      // Ocurrió un error del lado del cliente o de la red.
      console.error('Ocurrió un error de red o del cliente:', error.error);
    } else {
      // El backend retornó un código de respuesta no exitoso.
      console.error(
        `El backend retornó el código ${error.status}, ` +
          `el cuerpo del error fue: ${JSON.stringify(error.error)}`
      );
    }
    // Retorna un observable con un mensaje de error legible para el usuario final.
    return throwError(() => new Error('Algo malo ha sucedido; por favor, inténtelo de nuevo más tarde.'));
  }
}