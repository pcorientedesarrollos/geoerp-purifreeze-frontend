import { Component, OnInit, ViewChild, signal, ChangeDetectionStrategy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, lastValueFrom } from 'rxjs';

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
import { UnidadesAccionesComponent } from './unidades-acciones/unidades-acciones.component';
import { GeoUnidadTransportesService } from '../../../services/geo_unidadTransportes/geo-unidad-transportes.service';
import { GeoUnidadTransporte } from '../../../interfaces/geo_unidad-transportes';

@Component({
  selector: 'app-unidades',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule,
    MatProgressSpinnerModule, MatDialogModule, MatSnackBarModule, MatTooltipModule
  ],
  templateUrl: './unidades.component.html',
  styleUrls: ['./unidades.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // <-- MEJORA DE RENDIMIENTO
})
export class UnidadesComponent implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS MODERNA ---
  private unidadService = inject(GeoUnidadTransportesService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  // --- GESTIÓN DE ESTADO CON SIGNALS ---
  public isLoading = signal(true);
  public errorOcurred = signal(false);
  public unidades = signal<GeoUnidadTransporte[]>([]);

  public displayedColumns: string[] = ['nombreUnidad', 'placaUnidad', 'marcaUnidad', 'modeloUnidad', 'unidadActiva', 'acciones'];
  public dataSource = new MatTableDataSource<GeoUnidadTransporte>();
  public filterControl = new FormControl('');

  // --- MEJORA: Uso de setters para Paginator y Sort ---
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    if (paginator) {
      this.dataSource.paginator = paginator;
    }
  }

  @ViewChild(MatSort) set sort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  constructor() {
    // --- MEJORA: Filtro reactivo con limpieza automática de subscripción ---
    this.filterControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(value => {
      this.dataSource.filter = (value || '').trim().toLowerCase();
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    });

    // --- MEJORA: `effect` para sincronizar el estado reactivo con la tabla ---
    effect(() => {
      this.dataSource.data = this.unidades();
    });
  }

  ngOnInit(): void {
    this.loadUnidades();
  }

  async loadUnidades(): Promise<void> {
    this.isLoading.set(true);
    this.errorOcurred.set(false);
    try {
      const data = await lastValueFrom(this.unidadService.getUnidadesTransporte());
      const sortedData = data.sort((a, b) => b.idUnidadTransporte - a.idUnidadTransporte);
      this.unidades.set(sortedData);
    } catch (error) {
      this.errorOcurred.set(true);
      this.snackBar.open('No se pudieron cargar las unidades.', 'Cerrar', { duration: 5000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  async openUnidadDialog(unidad?: GeoUnidadTransporte): Promise<void> {
    const dialogRef = this.dialog.open(UnidadesAccionesComponent, {
      // width: '600px',
      data: { unidad: unidad ? { ...unidad } : undefined },
      disableClose: true
    });

    const result = await lastValueFrom(dialogRef.afterClosed());

    if (result) {
      // --- MEJORA: Actualización inmutable del estado ---
      this.unidades.update(currentUnidades => {
        const index = currentUnidades.findIndex(u => u.idUnidadTransporte === result.idUnidadTransporte);
        if (index > -1) {
          // Es una edición: reemplaza el elemento existente
          const updatedUnidades = [...currentUnidades];
          updatedUnidades[index] = result;
          return updatedUnidades;
        } else {
          // Es una creación: añade el nuevo elemento al principio
          return [result, ...currentUnidades];
        }
      });
      this.snackBar.open('Unidad guardada exitosamente.', 'OK', { duration: 3000 });
    }
  }

  async deleteUnidad(id: number): Promise<void> {
    if (confirm('¿Está seguro de que desea eliminar esta unidad?')) {
      try {
        await lastValueFrom(this.unidadService.deleteUnidadTransporte(id));
        // --- MEJORA: Actualización inmutable del estado ---
        this.unidades.update(unidades => unidades.filter(u => u.idUnidadTransporte !== id));
        this.snackBar.open('Unidad eliminada correctamente.', 'OK', { duration: 3000 });
      } catch (error) {
        this.snackBar.open('Error al eliminar la unidad.', 'Cerrar', { duration: 5000 });
      }
    }
  }
}