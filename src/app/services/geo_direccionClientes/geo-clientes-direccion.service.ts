import { Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroments';
import { catchError, Observable, throwError } from 'rxjs';
import { GeoClientesDireccion } from '../../interfaces/geo_clientes-direccion';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class GeoClientesDireccionService {
  private readonly API_URI = `${environment.apiUrl}/geo-clientes-direccion`;

  constructor(private http: HttpClient) { }

  getClientesDireccion(): Observable<GeoClientesDireccion[]> {
    return this.http.get<GeoClientesDireccion[]>(this.API_URI)
      .pipe(catchError(this.handleError));
  }

  getClienteDireccionById(id: number): Observable<GeoClientesDireccion> {
    return this.http.get<GeoClientesDireccion>(`${this.API_URI}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createClienteDireccion(cliente: GeoClientesDireccion): Observable<GeoClientesDireccion> {
    return this.http.post<GeoClientesDireccion>(this.API_URI, cliente)
      .pipe(catchError(this.handleError));
  }

  updateClienteDireccion(id: number, cliente: GeoClientesDireccion): Observable<GeoClientesDireccion> {
    return this.http.put<GeoClientesDireccion>(`${this.API_URI}/${id}`, cliente)
      .pipe(catchError(this.handleError));
  }

  deleteClienteDireccion(id: number): Observable<void> {
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
