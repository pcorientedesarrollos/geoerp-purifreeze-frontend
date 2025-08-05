// src/app/pages/rutas/lista-rutas/lista-rutas.component.ts

import { Component, OnInit, TemplateRef, inject, ViewChild } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

// Angular Material
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Servicios e Interfaces
import { GeoRutasService } from '../../../services/geo_rutas/geo-rutas.service';
import { GeoUsuariosService } from '../../../services/geo_usuarios/geo-usuarios.service';
import { GeoUnidadTransportesService } from '../../../services/geo_unidadTransportes/geo-unidad-transportes.service';
import { GeoRutas } from '../../../interfaces/geo-rutas';
import { GeoUsuario } from '../../../interfaces/geo_usuarios';
import { GeoUnidadTransporte } from '../../../interfaces/geo_unidad-transportes';
import { GeoRutasDetalle } from '../../../interfaces/geo-rutas-detalle';

@Component({
  selector: 'app-lista-rutas',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatSnackBarModule, MatDialogModule,
    MatCardModule, MatDividerModule, MatProgressSpinnerModule, DatePipe,
    MatFormFieldModule, MatInputModule, MatPaginatorModule, MatSortModule
  ],
  providers: [DatePipe],
  templateUrl: './lista-rutas.component.html',
  styleUrls: ['./lista-rutas.component.css'],
})
export class ListaRutasComponent implements OnInit {
  // Inyección de servicios
  private geoRutasService = inject(GeoRutasService);
  private geoUsuariosService = inject(GeoUsuariosService);
  private geoUnidadTransportesService = inject(GeoUnidadTransportesService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  public dialog = inject(MatDialog);
  private datePipe = inject(DatePipe);

  // Almacenes de datos de soporte
  public operadores: GeoUsuario[] = [];
  public unidades: GeoUnidadTransporte[] = [];

  public dataSource = new MatTableDataSource<GeoRutas>();
  public isLoading = true;
  public displayedColumns: string[] = ['id', 'fecha', 'operador', 'vehiculo', 'clientes', 'acciones'];

  // ---- INICIO DE LA SOLUCIÓN ----
  // Se usan setters para enlazar el Paginator y el Sort al dataSource
  // tan pronto como Angular los renderiza en la vista.
  private paginator!: MatPaginator;
  private sort!: MatSort;

  @ViewChild(MatPaginator)
  set setPaginator(paginator: MatPaginator) {
    if (paginator) {
      this.paginator = paginator;
      this.dataSource.paginator = this.paginator;
    }
  }

  @ViewChild(MatSort)
  set setSort(sort: MatSort) {
    if (sort) {
      this.sort = sort;
      this.dataSource.sort = this.sort;
    }
  }
  // ---- FIN DE LA SOLUCIÓN ----

  ngOnInit(): void {
    this.cargarDatos();
  }

  // Ya no se necesita ngAfterViewInit, los setters se encargan de la lógica.

  cargarDatos(): void {
    this.isLoading = true;
    forkJoin({
      rutas: this.geoRutasService.getRutas(),
      operadores: this.geoUsuariosService.getUsuarios(),
      unidades: this.geoUnidadTransportesService.getUnidadesTransporte()
    }).subscribe({
      next: (data) => {
        this.operadores = data.operadores;
        this.unidades = data.unidades;
        this.dataSource.data = data.rutas;
        this.setupFilterPredicate();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.snackBar.open('Error al cargar los datos de la página', 'Cerrar', { duration: 4000 });
        console.error("Error al cargar datos:", err);
      }
    });
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: GeoRutas, filter: string): boolean => {
      const formattedDate = this.datePipe.transform(data.fechaHora, 'dd/MM/yyyy') || '';
      const operadorName = this.getNombreOperador(data.idUsuario);
      const vehiculoName = this.getNombreVehiculo(data.idUnidadTransporte);

      const searchableString = (
        data.idRuta +
        formattedDate +
        operadorName +
        vehiculoName
      ).toLowerCase();

      return searchableString.includes(filter);
    };
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  getNombreOperador(idUsuario: number): string {
    const operador = this.operadores.find(op => op.idUsuario === idUsuario);
    return operador ? operador.usuario : 'Desconocido';
  }

  getNombreVehiculo(idUnidad: number): string {
    const unidad = this.unidades.find(u => u.idUnidadTransporte === idUnidad);
    return unidad ? unidad.nombreUnidad : 'Desconocido';
  }

  verDetalles(detalles: GeoRutasDetalle[], modalTemplate: TemplateRef<any>) {
    this.dialog.open(modalTemplate, {
      width: '80%',
      maxWidth: '700px',
      data: { detalles: detalles || [] }
    });
  }

  editarRuta(idRuta: number): void {
    this.router.navigate(['/rutas/editar', idRuta]);
  }

  eliminarRuta(idRuta: number): void {
    if (confirm('¿Estás seguro de que deseas eliminar esta ruta?')) {
      this.geoRutasService.deleteRuta(idRuta).subscribe({
        next: () => {
          this.snackBar.open('Ruta eliminada con éxito', 'Ok', { duration: 3000 });
          this.cargarDatos(); // Vuelve a cargar los datos para refrescar la tabla
        },
        error: (err) => {
          this.snackBar.open('Error al eliminar la ruta', 'Cerrar', { duration: 4000 });
          console.error(err);
        },
      });
    }
  }


  cancelar(): void {
    this.router.navigate(['/dashboard']);
  }


}