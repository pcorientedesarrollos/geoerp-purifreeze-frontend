import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { RutasComponent } from './pages/rutas/rutas.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
    children: [
      {
        path: 'dashboard',
        component: DashboardComponent,
        data: { title: 'Dashboard' }, // <-- CAMBIO CLAVE: Añade esta línea
      },
      // Cuando agregues más rutas, sigue el mismo patrón:
      {
        path: 'rutas',
        component: RutasComponent,
        data: { title: 'Gestión de Rutas' }
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '' },
];
