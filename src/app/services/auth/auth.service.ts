// src/app/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Definimos la estructura de los datos que recibiremos
export interface FaceLoginData {
  idUsuario: number;
  descriptor_facial: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  // URL de tu backend. ¡Asegúrate de que el puerto sea correcto!
  private readonly apiUrl = 'http://localhost:3000';

  // Obtiene la lista de todos los descriptores faciales del backend
  getFaceLoginData(): Observable<FaceLoginData[]> {
    return this.http.get<FaceLoginData[]>(
      `${this.apiUrl}/users/facial-login-data`
    );
  }

  // Realiza el login final enviando el ID del usuario verificado
  loginByUserId(userId: number): Observable<{ access_token: string }> {
    return this.http.post<{ access_token: string }>(
      `${this.apiUrl}/auth/login-by-userid`,
      { userId }
    );
  }
  registerFace(descriptor: number[]): Observable<{ message: string }> {
    const token = localStorage.getItem('access_token');

    // Creamos las cabeceras para enviar el token
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
    });

    // Hacemos la petición PATCH a la ruta protegida, enviando el descriptor y las cabeceras
    return this.http.patch<{ message: string }>(
      `${this.apiUrl}/users/me/register-face`,
      { descriptor },
      { headers }
    );
  }
}
