import { Routes } from '@angular/router';

// Importamos los dos componentes que usaremos
import { ListaRutasComponent } from './lista-rutas/lista-rutas.component';
import { RutasComponent } from './rutas.component'; // Este es tu componente de Formulario
import { GeoEditRutasComponent } from './geo-edit-rutas/geo-edit-rutas.component';

export const RUTAS_ROUTES: Routes = [
  {
    path: '', // La ruta vacía (/rutas) mostrará la lista
    component: ListaRutasComponent,
    data: { title: 'Gestión de Rutas' },
  },
  {
    path: 'crear', // La ruta /rutas/crear mostrará el formulario de creación
    component: RutasComponent,
    data: { title: 'Crear Nueva Ruta' },
  },
  {
    path: 'editar/:id', // La ruta /rutas/editar/123 mostrará el formulario para editar la ruta 123
    component: GeoEditRutasComponent,
    data: { title: 'Editar Ruta' },
  },
];
