import { Component, OnInit, ViewChild, AfterViewInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Angular Material Modules
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

// Componentes y Servicios
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { UnidadesAccionesComponent } from './unidades-acciones/unidades-acciones.component';
import { GeoUnidadTransportesService } from '../../../services/geo_unidadTransportes/geo-unidad-transportes.service';
import { GeoUnidadTransporte } from '../../../interfaces/geo_unidad-transportes';

@Component({
  selector: 'app-unidades',
  standalone: true,
  imports: [
    CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule, MatTooltipModule
],
  templateUrl: './unidades.component.html',
  styleUrl: './unidades.component.css'
})
export class UnidadesComponent implements OnInit, AfterViewInit {

  private unidadService = inject(GeoUnidadTransportesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  displayedColumns: string[] = ['nombreUnidad', 'placaUnidad', 'marcaUnidad', 'modeloUnidad', 'unidadActiva', 'acciones'];
  dataSource = new MatTableDataSource<GeoUnidadTransporte>();
  isLoading = true;
  errorOcurred = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.loadUnidades();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadUnidades(): void {
    this.isLoading = true;
    this.errorOcurred = false;
    this.unidadService.getUnidadesTransporte().pipe(
      catchError(() => {
        this.isLoading = false;
        this.errorOcurred = true;
        this.snackBar.open('No se pudieron cargar las unidades.', 'Cerrar', { duration: 5000 });
        return of([]);
      })
    ).subscribe(data => {
      this.isLoading = false;
      // --- CAMBIO ---
      // Ordenamos la data por ID descendente en la carga inicial
      this.dataSource.data = data.sort((a, b) => b.idUnidadTransporte - a.idUnidadTransporte);
    });
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  openUnidadDialog(unidad?: GeoUnidadTransporte): void {
    const dialogRef = this.dialog.open(UnidadesAccionesComponent, {
      width: '600px',
      data: { unidad: unidad ? {...unidad} : undefined }, // Pasamos una copia para no mutar el original
      disableClose: true
    });

    // --- CAMBIO RADICAL EN LA LÓGICA ---
    dialogRef.afterClosed().subscribe((result: GeoUnidadTransporte) => {
      // 'result' ahora es el objeto de la unidad guardada, o undefined si se canceló.
      if (result) {
        const currentData = this.dataSource.data;
        
        // Verificamos si es una edición buscando el índice del elemento.
        const index = currentData.findIndex(u => u.idUnidadTransporte === result.idUnidadTransporte);

        if (index > -1) {
          // Es una EDICIÓN: removemos el viejo y ponemos el nuevo al principio.
          currentData.splice(index, 1);
          currentData.unshift(result);
        } else {
          // Es una CREACIÓN: simplemente lo ponemos al principio.
          currentData.unshift(result);
        }

        // Actualizamos el dataSource para que la tabla se refresque.
        this.dataSource.data = currentData;
        
        this.snackBar.open('Unidad guardada exitosamente.', 'OK', { duration: 3000 });
      }
    });
  }

  deleteUnidad(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar esta unidad?')) {
      this.unidadService.deleteUnidadTransporte(id).subscribe({
        next: () => {
          // --- CAMBIO ---
          // También actualizamos la lista en el frontend al eliminar.
          const currentData = this.dataSource.data;
          const index = currentData.findIndex(u => u.idUnidadTransporte === id);
          if (index > -1) {
            currentData.splice(index, 1);
            this.dataSource.data = currentData;
          }
          this.snackBar.open('Unidad eliminada correctamente.', 'OK', { duration: 3000 });
        },
        error: () => {
          this.snackBar.open('Error al eliminar la unidad.', 'Cerrar', { duration: 5000 });
        }
      });
    }
  }
}