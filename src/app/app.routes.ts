import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RutasComponent } from './pages/rutas/rutas.component';

// --- CAMBIO: Importa los nuevos componentes que acabamos de crear ---
import { ServiciosComponent } from './pages/servicios/servicios.component';
import { ClientesComponent } from './pages/catalogs/clientes/clientes.component';
import { LoginComponent } from './pages/login/login.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    data: { title: 'Inicio de Sesión' }, // <-- se puede cambiar el nombre
  },

  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { title: 'Dashboard' },
      },
      // --- CAMBIO: Añade las nuevas rutas aquí ---
      {
        path: 'rutas',
        component: RutasComponent,
        data: { title: 'Gestión de Rutas' },
      },
      {
        path: 'servicios',
        component: ServiciosComponent,
        data: { title: 'Servicios' },
      },
      {
        path: 'catalogs/clientes',
        component: ClientesComponent,
        data: { title: 'Catálogo de Clientes' },
      },
      // Cuando agregues más rutas, sigue el mismo patrón:
      {
        path: 'rutas',
        component: RutasComponent,
        data: { title: 'Gestión de Rutas' },
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
