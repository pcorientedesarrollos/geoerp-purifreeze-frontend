import { Component, OnInit, TemplateRef, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { forkJoin, lastValueFrom } from 'rxjs';

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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// Servicios e Interfaces
import { GeoRutasService } from '../../../services/geo_rutas/geo-rutas.service';
import { GeoRutas } from '../../../interfaces/geo-rutas';
import { GeoRutasDetalle } from '../../../interfaces/geo-rutas-detalle';
import { GeoStatusService } from '../../../services/geo_status/geo-status.service';
import { GeoStatus } from '../../../interfaces/geo_status';

@Component({
  selector: 'app-lista-rutas',
  standalone: true,
  imports: [
    CommonModule, RouterModule, MatTableModule, MatButtonModule,
    MatIconModule, MatTooltipModule, MatSnackBarModule, MatDialogModule,
    MatCardModule, MatProgressSpinnerModule, DatePipe, MatFormFieldModule, 
    MatInputModule, MatPaginatorModule, MatSortModule
  ],
  providers: [DatePipe],
  templateUrl: './lista-rutas.component.html',
  styleUrls: ['./lista-rutas.component.css'],
})
export class ListaRutasComponent implements OnInit, AfterViewInit {
  private geoRutasService = inject(GeoRutasService);
  private geoStatusService = inject(GeoStatusService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  public dialog = inject(MatDialog);
  private datePipe = inject(DatePipe);

  public dataSource = new MatTableDataSource<GeoRutas>();
  public isLoading = true;
  public displayedColumns: string[] = ['idRuta', 'operador', 'unidad', 'fecha', 'status', 'clientes', 'acciones'];
  private statusesMap = new Map<number, GeoStatus>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.cargarDatos();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.setupSorting();
  }

  async cargarDatos(): Promise<void> {
    this.isLoading = true;
    try {
      const { rutas, statuses } = await lastValueFrom(forkJoin({
        rutas: this.geoRutasService.getRutas(),
        statuses: this.geoStatusService.getStatuses()
      }));
      statuses.forEach(status => this.statusesMap.set(status.idStatus, status));
      this.dataSource.data = rutas;
      this.setupFilterPredicate();
    } catch (err) {
      this.mostrarNotificacion('Error al cargar los datos de la página', 'error');
    } finally {
      this.isLoading = false;
    }
  }

  setupFilterPredicate() {
    this.dataSource.filterPredicate = (data: GeoRutas, filter: string): boolean => {
      const searchStr = (
        data.idRuta +
        (data.usuario?.usuario || '') +
        (data.unidadTransporte?.nombreUnidad || '') +
        (this.datePipe.transform(data.fechaHora, 'dd/MM/yyyy HH:mm') || '') +
        (data.status?.status || '')
      ).toLowerCase();
      return searchStr.includes(filter.trim().toLowerCase());
    };
  }

  setupSorting() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'operador': return item.usuario?.usuario || '';
        case 'unidad': return item.unidadTransporte?.nombreUnidad || '';
        case 'status': return item.status?.status || '';
        default: return (item as any)[property];
      }
    };
  }
  
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue;
    this.dataSource.paginator?.firstPage();
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

  crearRuta(): void {
    this.router.navigate(['/rutas/crear']);
  }

  async eliminarRuta(ruta: GeoRutas): Promise<void> {
    if (!confirm(`¿Estás seguro de que deseas eliminar la Ruta #${ruta.idRuta}?`)) return;
    try {
      await lastValueFrom(this.geoRutasService.softDeleteRuta(ruta.idRuta));
      const index = this.dataSource.data.findIndex(r => r.idRuta === ruta.idRuta);
      if (index > -1) {
        const estadoEliminado = [...this.statusesMap.values()].find(s => s.status.toLowerCase() === 'eliminado');
        if (estadoEliminado) {
          const updatedData = [...this.dataSource.data];
          updatedData[index] = { ...updatedData[index], status: estadoEliminado, idEstatus: estadoEliminado.idStatus };
          this.dataSource.data = updatedData;
        }
      }
      this.mostrarNotificacion(`Ruta #${ruta.idRuta} marcada como eliminada.`, 'exito');
    } catch (err) {
      this.mostrarNotificacion('Error al eliminar la ruta', 'error');
    }
  }

  private mostrarNotificacion(mensaje: string, tipo: 'exito' | 'error'): void {
    this.snackBar.open(mensaje, 'Cerrar', { duration: 4000, panelClass: `snackbar-${tipo}`, verticalPosition: 'top' });
  }
  
  public getStatusClass(status: GeoStatus | undefined): string {
    if (!status || !status.status) return 'desconocido';
    return status.status.toLowerCase().replace(/\s+/g, '-');
  }
}