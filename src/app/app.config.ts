// RUTA COMPLETA: src/app/app.config.ts

import {
  ApplicationConfig,
  importProvidersFrom,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideNativeDateAdapter } from '@angular/material/core';

// Importaciones necesarias para ngx-socket-io
import { SocketIoModule, SocketIoConfig } from 'ngx-socket-io';

// ============================================================================
const socketIoConfig: SocketIoConfig = {
  url: 'http://localhost:3000', // Reemplaza esto si el backend no corre en localhost
  options: {},
};
// ============================================================================

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(),
    provideAnimations(),
    provideNativeDateAdapter(),

    // Y usamos el nuevo nombre aquí
    importProvidersFrom(SocketIoModule.forRoot(socketIoConfig)),
  ],
};
