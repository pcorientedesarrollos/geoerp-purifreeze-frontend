import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { LoginComponent } from './pages/login/login.component';
import { RutasComponent } from './pages/rutas/rutas.component';
import { ServiciosComponent } from './pages/servicios/servicios.component';
import { ClientesComponent } from './pages/catalogs/clientes/clientes.component';

// Importaciones para la nueva funcionalidad
import { ProfileComponent } from './pages/profile/profile.component';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  // --- RUTA PÚBLICA ---
  // La página de login es la única a la que se puede acceder sin estar autenticado.
  {
    path: 'login',
    component: LoginComponent,
    // No necesita título aquí, ya que está fuera del layout principal
  },

  // --- RUTAS PROTEGIDAS ---
  // Este es el contenedor principal de la aplicación.
  {
    path: '',
    component: MainLayoutComponent,
    // --- CAMBIO CLAVE: El guardián protege a este componente y a TODOS sus hijos ---
    canActivate: [authGuard],
    children: [
      // Si el usuario está autenticado, puede acceder a cualquiera de estas rutas:
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { title: 'Dashboard' },
      },
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
      // {
      //   path: 'catalogs/clientes',
      //   component: ClientesComponent,
      //   data: { title: 'Catálogo de Clientes' },
      // },

      {
        path:'catalogs',
        loadChildren: () =>
          import('./pages/catalogs/catalogos.routes').then(
            (routes) => routes.catalogosRoutes)
      },
      
      // La redirección por defecto DENTRO del layout principal
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },

  // --- RUTA "CATCH-ALL" ---
  // Si ninguna de las rutas anteriores coincide, redirige al login.
  { path: '**', redirectTo: 'login' },
];
