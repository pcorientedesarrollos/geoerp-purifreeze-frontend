// src/app/pages/rutas/lista-rutas/lista-rutas.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router'; // RouterModule para routerLink
import { Observable } from 'rxjs';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// Servicios e Interfaces
import { GeoRutasService } from '../../../services/geo_rutas/geo-rutas.service';
import { GeoRutas } from '../../../interfaces/geo-rutas';

@Component({
  selector: 'app-lista-rutas',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule, // Añadido
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
  ],
  templateUrl: './lista-rutas.component.html',
  styleUrls: ['./lista-rutas.component.css'],
})
export class ListaRutasComponent implements OnInit {
  private geoRutasService = inject(GeoRutasService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  // Usamos un Observable para manejar los datos de forma reactiva
  public rutas$!: Observable<GeoRutas[]>;
  public displayedColumns: string[] = [
    //LISTADO DE COLUMNAS
    'id',
    'fecha',
    'operador',
    'vehiculo',
    'paradas',
    'acciones',
  ];

  ngOnInit(): void {
    this.cargarRutas();
  }

  cargarRutas(): void {
    this.rutas$ = this.geoRutasService.getRutas();
  }

  // Navega a la página de edición
  editarRuta(idRuta: number): void {
    this.router.navigate(['/rutas/editar', idRuta]);
  }

  // Llama al servicio para eliminar una ruta
  eliminarRuta(idRuta: number): void {
    // En una app real, aquí iría un diálogo de confirmación
    if (confirm('¿Estás seguro de que deseas eliminar esta ruta?')) {
      this.geoRutasService.deleteRuta(idRuta).subscribe({
        next: () => {
          this.snackBar.open('Ruta eliminada con éxito', 'Ok', {
            duration: 3000,
          });
          this.cargarRutas(); // Recargamos la lista
        },
        error: (err) => {
          this.snackBar.open('Error al eliminar la ruta', 'Cerrar', {
            duration: 4000,
          });
          console.error(err);
        },
      });
    }
  }
}
