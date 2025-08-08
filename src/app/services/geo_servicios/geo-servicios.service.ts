// Contenido para copiar y pegar
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';
import { Servicio } from '../../interfaces/geo_servicios';

@Injectable({
  providedIn: 'root'
})
export class GeoServiciosService {
  private readonly API_URI = `${environment.apiUrl}/geo-servicios`;

  constructor(private http: HttpClient) { }

  getServiciosPorCliente(idCliente: number): Observable<Servicio[]> {
    // La URL ahora será /api/servicios/cliente/:idCliente
    return this.http.get<Servicio[]>(`${this.API_URI}/cliente/${idCliente}`)
      .pipe(
        catchError(error => {
          console.error(`Error al obtener servicios para el cliente ${idCliente}:`, error);
          return of([]);
        })
      );
  }
}

