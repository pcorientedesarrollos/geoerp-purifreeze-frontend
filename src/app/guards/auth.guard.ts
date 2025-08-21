// src/app/guards/auth.guard.ts
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common'; // Importa esta función
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID); // Inyecta el PLATFORM_ID

  // Comprueba si el código se está ejecutando en un navegador
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('access_token');

    if (token) {
      return true;
    } else {
      if (state.url !== '/login') {
        router.navigate(['/login']);
      }
    }
  }

  // Si no estamos en un navegador (estamos en el servidor), no permitimos el acceso
  // a rutas protegidas y redirigimos.
  router.navigate(['/login']);
  return false;
};
