import { Routes } from '@angular/router';
import { ClientesComponent } from './clientes/clientes.component';
import { UnidadesComponent } from './unidades/unidades.component';

export const catalogosRoutes: Routes = [

  {
    path: 'clientes',
    component: ClientesComponent,
  },
    {
    path: 'unidades',
    component: UnidadesComponent,
  },
];
