// import { Injectable } from '@angular/core';
// import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// import { Observable, throwError } from 'rxjs';
// import { catchError } from 'rxjs/operators';
// import { GeoRutas } from '../../interfaces/geo-rutas';
// import { environment } from '../../../enviroments/enviroments';

// @Injectable({
//   providedIn: 'root',
// })
// export class GeoRutasService {
//   private readonly API_URI = `${environment.apiUrl}/geo-rutas`;

//   constructor(private http: HttpClient) {}

//   // CORRECCIÓN: Renombrado de 'getRutasList' a 'getRutas' para estandarizar
//   getRutas(): Observable<GeoRutas[]> {
//     return this.http
//       .get<GeoRutas[]>(this.API_URI)
//       .pipe(catchError(this.handleError));
//   }

//   // CORRECCIÓN: Renombrado de 'getRutaById' a 'getRutaPorId' para coincidir con el componente
//   getRutaPorId(id: number): Observable<GeoRutas> {
//     return this.http
//       .get<GeoRutas>(`${this.API_URI}/${id}`)
//       .pipe(catchError(this.handleError));
//   }

//   // CORRECCIÓN: Renombrado de 'guardarRuta' a 'createRuta' para coincidir con el componente
//   createRuta(ruta: GeoRutas): Observable<GeoRutas> {
//     return this.http
//       .post<GeoRutas>(this.API_URI, ruta)
//       .pipe(catchError(this.handleError));
//   }

//   // --- MÉTODO AÑADIDO QUE FALTABA ---
//   // Este método usa PATCH, que es ideal para actualizaciones parciales.
//   updateRuta(id: number, ruta: GeoRutas): Observable<GeoRutas> {
//     return this.http
//       .patch<GeoRutas>(`${this.API_URI}/${id}`, ruta)
//       .pipe(catchError(this.handleError));
//   }
//   deleteRuta(id: number): Observable<any> {
//     return this.http
//       .delete(`${this.API_URI}/${id}`)
//       .pipe(catchError(this.handleError));
//   }

//   // --- El manejador de errores no necesita cambios ---
//   private handleError(error: HttpErrorResponse) {
//     if (error.status === 0) {
//       console.error('Ocurrió un error de red o del cliente:', error.error);
//     } else {
//       console.error(
//         `El backend retornó el código ${error.status}, ` +
//           `el cuerpo del error fue: ${JSON.stringify(error.error)}`
//       );
//     }
//     return throwError(
//       () =>
//         new Error(
//           'Algo malo ha sucedido; por favor, inténtelo de nuevo más tarde.'
//         )
//     );
//   }
// }




import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../enviroments/enviroments';
// Asegúrate de importar AMBAS interfaces desde el archivo correcto
import { GeoRutas, CreateGeoRutaPayload } from '../../interfaces/geo-rutas';

@Injectable({
  providedIn: 'root',
})
export class GeoRutasService {
  private readonly API_URI = `${environment.apiUrl}/geo-rutas`;

  constructor(private http: HttpClient) {}

  createRuta(ruta: CreateGeoRutaPayload): Observable<GeoRutas> {
    return this.http
      .post<GeoRutas>(this.API_URI, ruta)
      .pipe(catchError(this.handleError));
  }

  
  getRutas(): Observable<GeoRutas[]> {
    return this.http
      .get<GeoRutas[]>(this.API_URI)
      .pipe(catchError(this.handleError));
  }

  getRutaPorId(id: number): Observable<GeoRutas> {
    return this.http
      .get<GeoRutas>(`${this.API_URI}/${id}`)
      .pipe(catchError(this.handleError));
  }
  
  updateRuta(id: number, ruta: Partial<GeoRutas>): Observable<GeoRutas> {
    return this.http
      .patch<GeoRutas>(`${this.API_URI}/${id}`, ruta)
      .pipe(catchError(this.handleError));
  }

  deleteRuta(id: number): Observable<any> {
    return this.http
      .delete(`${this.API_URI}/${id}`)
      .pipe(catchError(this.handleError));
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