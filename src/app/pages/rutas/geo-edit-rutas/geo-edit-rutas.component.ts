import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, DatePipe } from '@angular/common';
import { forkJoin, lastValueFrom } from 'rxjs';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

// Servicios e Interfaces
import { GeoRutasService } from '../../../services/geo_rutas/geo-rutas.service';
import { GeoRutasDetalleService } from '../../../services/geo_rutasDetalle/geo-rutas-detalles.service';
import { GeoUsuariosService } from '../../../services/geo_usuarios/geo-usuarios.service';
import { GeoUnidadTransportesService } from '../../../services/geo_unidadTransportes/geo-unidad-transportes.service';
import { GeoStatusService } from '../../../services/geo_status/geo-status.service'; // <--- 1. IMPORTAR EL NUEVO SERVICIO
import { GeoRutas } from '../../../interfaces/geo-rutas';
import { GeoUsuario } from '../../../interfaces/geo_usuarios';
import { GeoUnidadTransporte } from '../../../interfaces/geo_unidad-transportes';
import { GeoRutasDetalle, GeoRutaDetallePayload, ServicioDisponible } from '../../../interfaces/geo-rutas-detalle';
import { GeoStatus } from '../../../interfaces/geo_status'; // <--- IMPORTAR LA INTERFAZ DE STATUS
import { AgregarServicioModalComponent } from './agregar-servicio-modal/agregar-servicio-modal.component';

@Component({
  selector: 'app-geo-edit-rutas',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule, MatIconModule,
    MatSnackBarModule, MatProgressSpinnerModule, MatDividerModule,
    MatTableModule, MatTooltipModule, MatDialogModule, DatePipe
  ],
  templateUrl: './geo-edit-rutas.component.html',
  styleUrls: ['./geo-edit-rutas.component.css']
})
export class GeoEditRutasComponent implements OnInit {
  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private geoRutasService = inject(GeoRutasService);
  private geoRutasDetalleService = inject(GeoRutasDetalleService);
  private geoUsuariosService = inject(GeoUsuariosService);
  private geoUnidadesService = inject(GeoUnidadTransportesService);
  private geoStatusService = inject(GeoStatusService); // <--- 2. INYECTAR EL NUEVO SERVICIO

  // Formularios y estado
  rutaForm: FormGroup;
  isLoading = true;
  isSaving = false;
  idRuta!: number;
  rutaActual?: GeoRutas;

  // Datos para UI
  operadores: GeoUsuario[] = [];
  unidades: GeoUnidadTransporte[] = [];
  statusList: GeoStatus[] = []; // <--- 3. LISTA PARA ALMACENAR LOS ESTADOS DINÁMICOS
  detallesDataSource = new MatTableDataSource<GeoRutasDetalle>();
  displayedColumns: string[] = ['folioContrato', 'cliente', 'equipo', 'tipoServicio', 'fecha', 'status', 'acciones'];

  constructor() {
    this.rutaForm = this.fb.group({
      idUsuario: ['', Validators.required],
      idUnidadTransporte: ['', Validators.required],
      kmInicial: ['', [Validators.required, Validators.pattern('^[0-9]*$')]],
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.idRuta = +id;
      this.cargarDatosRuta();
    } else {
      this.mostrarNotificacion('No se proporcionó un ID de ruta.', 'error');
      this.router.navigate(['/rutas']);
    }
  }

  async cargarDatosRuta(): Promise<void> {
    this.isLoading = true;
    try {
      // <--- 4. AÑADIR LA LLAMADA AL SERVICIO DE STATUS EN EL FORKJOIN
      const { ruta, operadores, unidades, statuses } = await lastValueFrom(
        forkJoin({
          ruta: this.geoRutasService.getRutaPorId(this.idRuta),
          operadores: this.geoUsuariosService.getUsuarios(),
          unidades: this.geoUnidadesService.getUnidadesTransporte(),
          statuses: this.geoStatusService.getStatuses()
        })
      );

      this.rutaActual = ruta;
      this.operadores = operadores;
      this.unidades = unidades.filter(u => u.activo);
      this.statusList = statuses; // Guardamos la lista de estados obtenida

      this.rutaForm.patchValue({
        idUsuario: ruta.idUsuario,
        idUnidadTransporte: ruta.idUnidadTransporte,
        kmInicial: ruta.kmInicial,
      });

      this.detallesDataSource.data = ruta.detalles || [];
    } catch (error) {
      console.error('Error al cargar los datos de la ruta:', error);
      this.mostrarNotificacion('Error al cargar los datos. Verifique la consola.', 'error');
      this.router.navigate(['/rutas']);
    } finally {
      this.isLoading = false;
    }
  }

  async guardarEncabezado(): Promise<void> {
    if (this.rutaForm.invalid) {
      this.mostrarNotificacion('El formulario tiene errores.', 'advertencia');
      return;
    }
    this.isSaving = true;
    try {
      await lastValueFrom(this.geoRutasService.updateRuta(this.idRuta, this.rutaForm.value));
      this.mostrarNotificacion('Datos generales actualizados.', 'exito');
    } catch (error) {
      console.error('Error al actualizar encabezado:', error);
      this.mostrarNotificacion('Error al guardar datos generales.', 'error');
    } finally {
      this.isSaving = false;
    }
  }

  async cambiarStatusDetalle(detalle: GeoRutasDetalle, nuevoStatusId: number): Promise<void> {
    const statusOriginal = detalle.status;
    detalle.status = nuevoStatusId;
    try {
      await lastValueFrom(this.geoRutasDetalleService.update(detalle.idRutaDetalle, { status: nuevoStatusId }));
      this.mostrarNotificacion(`Estado del servicio para '${detalle.nombreComercio}' actualizado.`, 'exito');
    } catch (error) {
      detalle.status = statusOriginal;
      console.error('Error al actualizar estado:', error);
      this.mostrarNotificacion('No se pudo actualizar el estado.', 'error');
    }
  }

  async eliminarDetalle(idRutaDetalle: number, nombreComercio: string): Promise<void> {
    if (!confirm(`¿Seguro que deseas quitar el servicio de '${nombreComercio}' de esta ruta?`)) return;
    try {
      await lastValueFrom(this.geoRutasDetalleService.remove(idRutaDetalle));
      this.detallesDataSource.data = this.detallesDataSource.data.filter(d => d.idRutaDetalle !== idRutaDetalle);
      this.mostrarNotificacion('Servicio eliminado de la ruta.', 'exito');
    } catch (error) {
      console.error('Error al eliminar detalle:', error);
      this.mostrarNotificacion('No se pudo eliminar el servicio.', 'error');
    }
  }

  abrirModalAgregarServicios(): void {
    const dialogRef = this.dialog.open(AgregarServicioModalComponent, {
      width: '80%',
      maxWidth: '1000px',
      data: {
        serviciosActualesIds: this.detallesDataSource.data.map(d => d.idServicioEquipo)
      }
    });

    dialogRef.afterClosed().subscribe(async (serviciosSeleccionados: ServicioDisponible[]) => {
      if (!serviciosSeleccionados || serviciosSeleccionados.length === 0) return;
      this.isSaving = true;
      try {
        const requests = serviciosSeleccionados.map(servicio => {
          const payload: GeoRutaDetallePayload = {
            idRuta: this.idRuta,
            idServicioEquipo: servicio.idServicioEquipo,
            noSerie: servicio.NoSerie ?? undefined,
            nombreEquipo: servicio.nombreEquipo,
            fechaServicio: servicio.fechaServicio,
            hora: servicio.hora,
            tipoServicio: servicio.tipoServicio,
            descripcion: servicio.descripcion ?? undefined,
            observacionesServicio: servicio.observaciones_servicio ?? undefined,
            idContrato: servicio.idContrato,
            nombreComercio: servicio.nombreComercio,
            status: 1, // <--- 5. ASUMIMOS QUE EL ID 1 SIEMPRE SERÁ "PENDIENTE" O EL ESTADO INICIAL
          };
          return this.geoRutasDetalleService.create(payload);
        });
        await lastValueFrom(forkJoin(requests));
        this.mostrarNotificacion(`${serviciosSeleccionados.length} servicio(s) agregado(s).`, 'exito');
        this.cargarDatosRuta();
      } catch (error) {
        console.error('Error al agregar servicios:', error);
        this.mostrarNotificacion('Error al guardar nuevos servicios.', 'error');
      } finally {
        this.isSaving = false;
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/rutas']);
  }
  
  // Función de ayuda opcional (ya no es tan necesaria si solo se muestra en el select)
  getStatusText(statusId: number): string {
    const foundStatus = this.statusList.find(s => s.idStatus === statusId);
    return foundStatus ? foundStatus.status : 'Desconocido';
  }

  private mostrarNotificacion(mensaje: string, tipo: 'exito' | 'error' | 'advertencia'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: `snackbar-${tipo}`,
      verticalPosition: 'top',
    });
  }
}