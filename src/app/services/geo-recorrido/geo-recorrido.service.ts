// import { HttpClient } from '@angular/common/http';
// import { inject, Injectable } from '@angular/core';
// import { environment } from '../../../enviroments/enviroments';
// import {
//   CreateGeoRecorrido,
//   GeoRecorrido,
// } from '../../interfaces/geo-recorrido';
// import { Observable } from 'rxjs';

// @Injectable({
//   providedIn: 'root',
// })
// export class GeoRecorridoService {
//   constructor() {}
//   private http = inject(HttpClient);
//   // Usa la URL base del entorno para que sea configurable
//   private apiUrl = `${environment.apiUrl}/geo-recorrido`;

//   // Obtiene todos los registros del recorrido
//   getRecorridos(): Observable<GeoRecorrido[]> {
//     return this.http.get<GeoRecorrido[]>(this.apiUrl);
//   }

//   // Agrega un nuevo registro
//   addRecorrido(data: CreateGeoRecorrido): Observable<GeoRecorrido> {
//     return this.http.post<GeoRecorrido>(this.apiUrl, data);
//   }

//   // Elimina un registro por su ID
//   deleteRecorrido(id: number): Observable<void> {
//     return this.http.delete<void>(`${this.apiUrl}/${id}`);
//   }
// }


// src/app/services/geo-recorrido/geo-recorrido.service.ts

import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroments';
import {
  CreateGeoRecorrido,
  GeoRecorrido,
} from '../../interfaces/geo-recorrido';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class GeoRecorridoService {
  constructor() {}
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/geo-recorrido`;

  // Este método se mantiene, aunque no lo usaremos para seleccionar la ruta.
  getRecorridos(): Observable<GeoRecorrido[]> {
    return this.http.get<GeoRecorrido[]>(this.apiUrl);
  }

  // === NUEVO MÉTODO EFICIENTE ===
  // Este es el método clave. Llama al endpoint del backend que filtra los
  // recorridos por ID de ruta directamente en la base de datos.
  getRecorridosPorRuta(idRuta: number): Observable<GeoRecorrido[]> {
    return this.http.get<GeoRecorrido[]>(`${this.apiUrl}/recorrido/${idRuta}`);
  }

  addRecorrido(data: CreateGeoRecorrido): Observable<GeoRecorrido> {
    return this.http.post<GeoRecorrido>(this.apiUrl, data);
  }

  deleteRecorrido(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}