
import { Injectable } from '@angular/core';
import { environment } from '../../../enviroments/enviroments';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { GeoUsuario } from '../../interfaces/geo_usuarios';

@Injectable({
  providedIn: 'root'
})
export class GeoUsuariosService {
  private readonly API_URI = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) { }

  // --- MÉTODO NUEVO ---
  // Obtiene solo los operadores disponibles para ser asignados a una nueva ruta.
  getAvailableOperators(): Observable<GeoUsuario[]> {
    return this.http.get<GeoUsuario[]>(`${this.API_URI}/available-operators`)
      .pipe(catchError(this.handleError));
  }

  // --- MÉTODOS EXISTENTES (se mantienen por si se usan en otro lugar) ---
  getUsuarios(): Observable<GeoUsuario[]> {
    return this.http.get<GeoUsuario[]>(this.API_URI)
      .pipe(catchError(this.handleError));
  }

  getUsuarioById(id: number): Observable<GeoUsuario> {
    return this.http.get<GeoUsuario>(`${this.API_URI}/${id}`)
      .pipe(catchError(this.handleError));
  }

  createUsuario(usuario: GeoUsuario): Observable<GeoUsuario> {
    return this.http.post<GeoUsuario>(this.API_URI, usuario)
      .pipe(catchError(this.handleError));
  }

  updateUsuario(id: number, usuario: GeoUsuario): Observable<GeoUsuario> {
    return this.http.put<GeoUsuario>(`${this.API_URI}/${id}`, usuario)
      .pipe(catchError(this.handleError));
  }

  deleteUsuario(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API_URI}/${id}`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    // ... (sin cambios en el manejo de errores)
    if (error.status === 0) {
      console.error('Ocurrió un error de red o del usuario:', error.error);
    } else {
      console.error(
        `El backend retornó el código ${error.status}, ` +
        `el cuerpo del error fue: ${JSON.stringify(error.error)}`
      );
    }
    return throwError(() => new Error('Algo malo ha sucedido; por favor, inténtelo de nuevo más tarde.'));
  }
}