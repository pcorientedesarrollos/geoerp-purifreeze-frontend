import { Routes } from '@angular/router';
import { ClientesComponent } from './clientes/clientes.component';

export const catalogosRoutes: Routes = [

  {
    path: 'clientes',
    component: ClientesComponent,
  },
    // Aquí puedes añadir más rutas relacionadas con los catálogos
];
