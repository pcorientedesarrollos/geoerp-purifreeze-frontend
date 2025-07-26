import { Routes } from '@angular/router';
import { GeoRecorridoComponent } from './geo-recorrido.component';

export const GEO_RECORRIDO_ROUTES: Routes = [
  {
    path: '', // La ruta raíz (ej: /recorridos) cargará este componente
    component: GeoRecorridoComponent,
  },
];
