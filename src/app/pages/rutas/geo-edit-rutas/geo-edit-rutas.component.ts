
import { Component, inject, OnInit, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
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
import { GeoStatusService } from '../../../services/geo_status/geo-status.service';
import { GeoRutas } from '../../../interfaces/geo-rutas';
import { GeoUsuario } from '../../../interfaces/geo_usuarios';
import { GeoUnidadTransporte } from '../../../interfaces/geo_unidad-transportes';
import { GeoRutasDetalle, GeoRutaDetallePayload, ServicioDisponible } from '../../../interfaces/geo-rutas-detalle';
import { GeoStatus } from '../../../interfaces/geo_status';
import { AgregarServicioModalComponent } from './agregar-servicio-modal/agregar-servicio-modal.component';

interface RutaFormControls {
  idUsuario: FormControl<number | null>;
  idUnidadTransporte: FormControl<number | null>;
  kmInicial: FormControl<string | null>; 
}

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
  styleUrls: ['./geo-edit-rutas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeoEditRutasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar); 
  private dialog = inject(MatDialog);
  private geoRutasService = inject(GeoRutasService);
  private geoRutasDetalleService = inject(GeoRutasDetalleService);
  private geoUsuariosService = inject(GeoUsuariosService);
  private geoUnidadesService = inject(GeoUnidadTransportesService);
  private geoStatusService = inject(GeoStatusService);

  public isLoading = signal(true);
  public isSaving = signal(false);
  public rutaActual = signal<GeoRutas | undefined>(undefined);
  public operadores = signal<GeoUsuario[]>([]);
  public unidades = signal<GeoUnidadTransporte[]>([]);
  public statusList = signal<GeoStatus[]>([]);
  public rutaDetalles = signal<GeoRutasDetalle[]>([]);
  
  public idRuta!: number;
  public rutaForm: FormGroup<RutaFormControls>;
  public detallesDataSource = new MatTableDataSource<GeoRutasDetalle>();
  public displayedColumns: string[] = ['folioContrato', 'cliente', 'equipo', 'tipoServicio', 'fecha', 'status', 'acciones'];

  constructor() {
    this.rutaForm = new FormGroup<RutaFormControls>({
      idUsuario: new FormControl(null, { validators: [Validators.required] }),
      idUnidadTransporte: new FormControl(null, { validators: [Validators.required] }),
      kmInicial: new FormControl(null, { validators: [Validators.required, Validators.pattern('^[0-9]*$')] }),
    });

    effect(() => {
      this.detallesDataSource.data = this.rutaDetalles();
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
    this.isLoading.set(true);
    try {
      const { ruta, operadores, unidades, statuses } = await lastValueFrom(
        forkJoin({
          ruta: this.geoRutasService.getRutaPorId(this.idRuta),
          operadores: this.geoUsuariosService.getUsuarios(),
          unidades: this.geoUnidadesService.getUnidadesTransporte(),
          statuses: this.geoStatusService.getStatuses()
        })
      );

      this.rutaActual.set(ruta);
      this.operadores.set(operadores);
      this.unidades.set(unidades.filter(u => u.activo));
      this.statusList.set(statuses);
      this.rutaDetalles.set(ruta.detalles || []);

      this.rutaForm.patchValue({
        idUsuario: ruta.idUsuario,
        idUnidadTransporte: ruta.idUnidadTransporte,
        kmInicial: ruta.kmInicial ?? null,
      });

    } catch (error) {
      console.error('Error al cargar los datos de la ruta:', error);
      this.mostrarNotificacion('Error al cargar los datos. Verifique la consola.', 'error');
      this.router.navigate(['/rutas']);
    } finally {
      this.isLoading.set(false);
    }
  }

  async guardarEncabezado(): Promise<void> {
    if (this.rutaForm.invalid) {
      this.mostrarNotificacion('El formulario tiene errores.', 'advertencia');
      return;
    }
    this.isSaving.set(true);
    try {
      const formValue = this.rutaForm.getRawValue();
      
      const payload: Partial<GeoRutas> = {
        idUsuario: formValue.idUsuario as number,
        idUnidadTransporte: formValue.idUnidadTransporte as number,
        kmInicial: formValue.kmInicial as string,
      };

      await lastValueFrom(this.geoRutasService.updateRuta(this.idRuta, payload));
      this.mostrarNotificacion('Datos generales actualizados.', 'exito');
    } catch (error) {
      console.error('Error al actualizar encabezado:', error);
      this.mostrarNotificacion('Error al guardar datos generales.', 'error');
    } finally {
      this.isSaving.set(false);
    }
  }

  async cambiarStatusDetalle(detalle: GeoRutasDetalle, nuevoStatusId: number): Promise<void> {
    const statusOriginal = detalle.status;
    this.rutaDetalles.update(detalles =>
      detalles.map(d => d.idRutaDetalle === detalle.idRutaDetalle ? { ...d, status: nuevoStatusId } : d)
    );
    try {
      await lastValueFrom(this.geoRutasDetalleService.update(detalle.idRutaDetalle, { status: nuevoStatusId }));
      this.mostrarNotificacion(`Estado del servicio para '${detalle.nombreComercio}' actualizado.`, 'exito');
    } catch (error) {
      this.rutaDetalles.update(detalles =>
        detalles.map(d => d.idRutaDetalle === detalle.idRutaDetalle ? { ...d, status: statusOriginal } : d)
      );
      console.error('Error al actualizar estado:', error);
      this.mostrarNotificacion('No se pudo actualizar el estado.', 'error');
    }
  }

  async eliminarDetalle(idRutaDetalle: number, nombreComercio: string): Promise<void> {
    if (!confirm(`¿Seguro que deseas quitar el servicio de '${nombreComercio}' de esta ruta?`)) return;
    try {
      // 1. Llama al servicio, que ahora hace un soft delete en el backend.
      await lastValueFrom(this.geoRutasDetalleService.remove(idRutaDetalle));
      
      // 2. Actualiza el estado en el frontend para que la UI reaccione inmediatamente.
      // En lugar de filtrar, se mapea y se cambia el estado del elemento afectado.
      this.rutaDetalles.update(detalles =>
        detalles.map(d => 
          d.idRutaDetalle === idRutaDetalle ? { ...d, status: 5 } : d
        )
      );
      this.mostrarNotificacion('Servicio marcado como eliminado.', 'exito');
    } catch (error) {
      console.error('Error al eliminar detalle:', error);
      this.mostrarNotificacion('No se pudo quitar el servicio.', 'error');
    }
  }

  abrirModalAgregarServicios(): void {
    const dialogRef = this.dialog.open(AgregarServicioModalComponent, {
      width: '80%',
      maxWidth: '1000px',
      data: {
        serviciosActualesIds: this.rutaDetalles().map(d => d.idServicioEquipo)
      }
    });

    dialogRef.afterClosed().subscribe(async (serviciosSeleccionados: ServicioDisponible[]) => {
      if (!serviciosSeleccionados || serviciosSeleccionados.length === 0) return;
      this.isSaving.set(true);
      try {
        const requests = serviciosSeleccionados.map(servicio => {
          const payload: GeoRutaDetallePayload = {
            idRuta: this.idRuta,
            idServicioEquipo: servicio.idServicioEquipo,
            status: 1, // Nuevo servicio siempre con estado 1 (Confirmado)
            noSerie: servicio.NoSerie ?? undefined,
            nombreEquipo: servicio.nombreEquipo,
            fechaServicio: servicio.fechaServicio,
            hora: servicio.hora,
            tipoServicio: servicio.tipoServicio,
            descripcion: servicio.descripcion ?? undefined,
            observacionesServicio: servicio.observaciones_servicio ?? undefined,
            idContrato: servicio.idContrato,
            nombreComercio: servicio.nombreComercio,
          };
          return this.geoRutasDetalleService.create(payload);
        });
        await lastValueFrom(forkJoin(requests));
        this.mostrarNotificacion(`${serviciosSeleccionados.length} servicio(s) agregado(s).`, 'exito');
        this.cargarDatosRuta(); // Recargar todo para obtener los nuevos detalles con sus IDs
      } catch (error) {
        console.error('Error al agregar servicios:', error);
        this.mostrarNotificacion('Error al guardar nuevos servicios.', 'error');
      } finally {
        this.isSaving.set(false);
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/rutas']);
  }

  private mostrarNotificacion(mensaje: string, tipo: 'exito' | 'error' | 'advertencia'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: `snackbar-${tipo}`,
      verticalPosition: 'top',
    });
  }
}