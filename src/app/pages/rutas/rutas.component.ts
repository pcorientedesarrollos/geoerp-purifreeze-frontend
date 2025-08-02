



// import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, switchMap } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSort, MatSortModule } from '@angular/material/sort';

// Servicios e Interfaces
import { GeoRutasService } from '../../services/geo_rutas/geo-rutas.service';
import { GeoUnidadTransportesService } from '../../services/geo_unidadTransportes/geo-unidad-transportes.service';
import { GeoUsuariosService } from '../../services/geo_usuarios/geo-usuarios.service';
import { GeoUnidadTransporte } from '../../interfaces/geo_unidad-transportes';
import { GeoUsuario } from '../../interfaces/geo_usuarios';
import { GeoRutaDetallePayload, ServicioDisponible } from '../../interfaces/geo-rutas-detalle';
import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { GeoRutasDetalleService } from '../../services/geo_rutasDetalle/geo-rutas-detalles.service';
import { CreateGeoRutaPayload } from '../../interfaces/geo-rutas';

@Component({
  selector: 'app-rutas',
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatCardModule,
    MatSnackBarModule, MatTableModule, MatDividerModule, MatCheckboxModule,
    MatPaginatorModule, MatProgressSpinnerModule, MatSortModule, DatePipe
  ],
  templateUrl: './rutas.component.html',
  styleUrls: ['./rutas.component.css'],
})
export class RutasComponent implements OnInit {
  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private geoRutasService = inject(GeoRutasService);
  private geoRutasDetalleService = inject(GeoRutasDetalleService);
  private geoUnidadTransportesService = inject(GeoUnidadTransportesService);
  private geoUsuariosService = inject(GeoUsuariosService);

  // Formularios y estado
  rutaForm: FormGroup;
  isLoading = true;
  isSaving = false;

  // Datos para los Selects
  operadores: GeoUsuario[] = [];
  unidades: GeoUnidadTransporte[] = [];

  // Lógica de la tabla de servicios
  serviciosDisponibles = new MatTableDataSource<ServicioDisponible>();
  selection = new SelectionModel<ServicioDisponible>(true, []);
  columnasTabla: string[] = ['select', 'nombreComercio', 'nombreEquipo', 'tipoServicio', 'fechaServicio'];

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.rutaForm = this.fb.group({
      idUsuario: ['', Validators.required],
      idUnidadTransporte: ['', Validators.required],
      kmInicial: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
    });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.isLoading = true;
    forkJoin({
      operadores: this.geoUsuariosService.getUsuarios(),
      unidades: this.geoUnidadTransportesService.getUnidadesTransporte(),
      servicios: this.geoRutasDetalleService.findServiciosDisponiblesParaRuta(),
    }).subscribe({
      next: (data) => {
        this.operadores = data.operadores;
        this.unidades = data.unidades.filter(u => u.activo);
        this.serviciosDisponibles.data = data.servicios;
        this.serviciosDisponibles.paginator = this.paginator;
        this.serviciosDisponibles.sort = this.sort;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.mostrarNotificacion('Error al cargar datos iniciales. Verifique la conexión con el backend.', 'error');
      },
    });
  }
  
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.serviciosDisponibles.filter = filterValue.trim().toLowerCase();
    if (this.serviciosDisponibles.paginator) {
      this.serviciosDisponibles.paginator.firstPage();
    }
  }

  isAllSelected() {
    return this.selection.selected.length === this.serviciosDisponibles.data.length;
  }

  toggleAllRows() {
    this.isAllSelected() ? this.selection.clear() : this.selection.select(...this.serviciosDisponibles.data);
  }

  checkboxLabel(row?: ServicioDisponible): string {
    if (!row) return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.idServicioEquipo}`;
  }

  guardarRuta(): void {
    if (this.rutaForm.invalid) {
      this.mostrarNotificacion('Complete los datos generales de la ruta.', 'advertencia');
      return;
    }
    if (this.selection.isEmpty()) {
      this.mostrarNotificacion('Debe seleccionar al menos un servicio para la ruta.', 'advertencia');
      return;
    }

    this.isSaving = true;
    
    // CORRECCIÓN CLAVE: El tipo de 'payloadRuta' ahora es el correcto 'CreateGeoRutaPayload'
    const payloadRuta: CreateGeoRutaPayload = this.rutaForm.value;

    this.geoRutasService.createRuta(payloadRuta).pipe(
      switchMap(nuevaRuta => {
        const detallesPayload: GeoRutaDetallePayload[] = this.selection.selected.map(servicio => ({
          idRuta: nuevaRuta.idRuta,
          idServicioEquipo: servicio.idServicioEquipo,
          noSerie: servicio.NoSerie ?? undefined,
          nombreEquipo: servicio.nombreEquipo,
          fechaServicio: servicio.fechaServicio,
          hora: servicio.hora,
          tipoServicio: servicio.tipo_servicio,
          descripcion: servicio.descripcion ?? undefined,
          observacionesServicio: servicio.observaciones_servicio ?? undefined,
          idContrato: servicio.idContrato,
          nombreComercio: servicio.nombreComercio,
          status: 1, // Por defecto: 1 = Pendiente
        }));
        
        const requests = detallesPayload.map(payload => this.geoRutasDetalleService.create(payload));
        return forkJoin(requests);
      })
    ).subscribe({
      next: () => {
        this.isSaving = false;
        this.mostrarNotificacion('Ruta y servicios guardados con éxito.', 'exito');
        this.router.navigate(['/rutas']); // O a donde deba redirigir
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error detallado al guardar la ruta:', err);
        this.mostrarNotificacion('Error al guardar los servicios de la ruta.', 'error');
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/rutas']);
  }

  private mostrarNotificacion(mensaje: string, tipo: 'exito' | 'error' | 'advertencia') {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: [`snackbar-${tipo}`],
      verticalPosition: 'top'
    });
  }
}