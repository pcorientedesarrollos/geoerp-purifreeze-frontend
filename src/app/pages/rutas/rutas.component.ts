import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';


// Servicios e Interfaces
import { GeoClientesService } from '../../services/geo_clientes/geo-clientes.service';
import { GeoTipoServicioService } from '../../services/geo_tipoServicios/geo-tipo-servicio.service';
import { GeoUnidadTransportesService } from '../../services/geo_unidadTransportes/geo-unidad-transportes.service';
import { GeoRutasService } from '../../services/geo_rutas/geo-rutas.service';
import { GeoUsuariosService } from '../../services/geo_usuarios/geo-usuarios.service';
import { GeoClientesDireccion } from '../../interfaces/geo_clientes-direccion';
import { GeoCliente } from '../../interfaces/geo_clientes';
import { GeoTipoServicio } from '../../interfaces/geo_tipo-servicios';
import { GeoUnidadTransporte } from '../../interfaces/geo_unidad-transportes';
import { GeoUsuario } from '../../interfaces/geo_usuarios';
import { GeoRutasParada } from '../../interfaces/geo-rutas-parada';
import { GeoClientesDireccionService } from '../../services/geo_direccionClientes/geo-clientes-direccion.service';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatDatepickerModule,
    MatCardModule, MatSnackBarModule, MatTableModule, MatDividerModule
  ],
  templateUrl: './rutas.component.html',
  styleUrls: ['./rutas.component.css'],
  providers: [provideNativeDateAdapter()],
})
export class RutasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private geoRutasService = inject(GeoRutasService);
  private geoClientesService = inject(GeoClientesService);
  private geoTipoServicioService = inject(GeoTipoServicioService);
  private geoUnidadTransportesService = inject(GeoUnidadTransportesService);
  private geoUsuariosService = inject(GeoUsuariosService);
  private geoClientesDireccionService = inject(GeoClientesDireccionService);

  rutaForm: FormGroup;
  paradaForm: FormGroup;

  operadores: GeoUsuario[] = [];
  unidades: GeoUnidadTransporte[] = [];
  clientes: GeoCliente[] = [];
  tiposDeServicio: GeoTipoServicio[] = [];
  
  private todasLasDirecciones: GeoClientesDireccion[] = [];
  direccionesFiltradas: GeoClientesDireccion[] = [];
  
  paradasAgregadas: GeoRutasParada[] = [];
  columnasTabla: string[] = ['cliente', 'sucursal', 'tipoServicio', 'direccion', 'acciones'];
  isSaving = false;

  constructor() {
    this.rutaForm = this.fb.group({
      idUsuario: ['', Validators.required],
      idUnidadTransporte: ['', Validators.required],
      fecha_hora: [new Date(), Validators.required],
    });

    this.paradaForm = this.fb.group({
      idCliente: [null, Validators.required],
      idSucursal: [null, Validators.required],
      idTipoServicio: [null, Validators.required],
      direccion: [{ value: '', disabled: true }, Validators.required],
      notas: [''],
    });

    this.paradaForm.get('idCliente')!.valueChanges.pipe(takeUntilDestroyed()).subscribe(idCliente => {
      this.paradaForm.get('idSucursal')?.reset();
      this.paradaForm.get('direccion')?.reset();
      if (idCliente) {
        this.direccionesFiltradas = this.todasLasDirecciones.filter(d => d.idCliente === idCliente);
      } else {
        this.direccionesFiltradas = [];
      }
    });

    this.paradaForm.get('idSucursal')!.valueChanges.pipe(takeUntilDestroyed()).subscribe(idSucursal => {
      if (idSucursal) {
        const direccionEncontrada = this.todasLasDirecciones.find(d => d.idDireccion === idSucursal);
        this.paradaForm.get('direccion')?.setValue(direccionEncontrada?.direccion || '');
      }
    });
  }

  ngOnInit(): void {
    this.cargarDatosDeSoporte();
  }

  cargarDatosDeSoporte(): void {
    forkJoin({
      operadores: this.geoUsuariosService.getUsuarios(),
      unidades: this.geoUnidadTransportesService.getUnidadesTransporte(),
      clientes: this.geoClientesService.getClientes(),
      tiposServicio: this.geoTipoServicioService.getTiposServicio(),
      direcciones: this.geoClientesDireccionService.getClientesDireccion(),
    }).subscribe({
      next: (data) => {
        this.operadores = data.operadores;
        this.unidades = data.unidades.filter(u => u.activo);
        this.clientes = data.clientes;
        this.tiposDeServicio = data.tiposServicio.filter(s => s.estado);
        this.todasLasDirecciones = data.direcciones;
      },
      error: () => this.mostrarNotificacion('Error al cargar datos iniciales.', 'error'),
    });
  }

  agregarParada(): void {
    if (this.paradaForm.invalid) {
      this.mostrarNotificacion('Completa todos los campos de la parada.', 'advertencia');
      return;
    }
    this.paradasAgregadas.push(this.paradaForm.getRawValue());
    this.paradaForm.reset();
    this.direccionesFiltradas = [];
  }

  eliminarParada(index: number): void {
    this.paradasAgregadas.splice(index, 1);
  }

  guardarRuta(): void {
    if (this.rutaForm.invalid || this.paradasAgregadas.length === 0) {
      this.mostrarNotificacion('Debes completar los datos de la ruta y agregar al menos una parada.', 'advertencia');
      return;
    }

    this.isSaving = true;
    const payload = {
      ...this.rutaForm.value,
      fecha_hora: new Date(this.rutaForm.value.fecha_hora).toISOString(),
      paradas: this.paradasAgregadas,
    };

    this.geoRutasService.createRuta(payload).subscribe({
      next: () => {
        this.isSaving = false;
        this.mostrarNotificacion('Ruta creada con éxito.', 'exito');
        this.router.navigate(['/dashboard/rutas']);
      },
      error: (err) => {
        this.isSaving = false;
        console.error('Error detallado del backend:', err);
        this.mostrarNotificacion('Error al crear la ruta.', 'error');
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/dashboard/rutas']);
  }

  getClienteNombre(idCliente: number): string {
    return this.clientes.find(c => c.idcliente === idCliente)?.nombreComercio || 'N/A';
  }
  getSucursalNombre(idSucursal: number): string {
    return this.todasLasDirecciones.find(d => d.idDireccion === idSucursal)?.nombreSucursal || 'N/A';
  }
  getTipoServicioNombre(idTipo: number): string {
    return this.tiposDeServicio.find(t => t.idTipoServicio === idTipo)?.nombre || 'N/A';
  }

  private mostrarNotificacion(mensaje: string, tipo: 'exito' | 'error' | 'advertencia') {
    this.snackBar.open(mensaje, 'Cerrar', { duration: 4000, panelClass: [`snackbar-${tipo}`], verticalPosition: 'top' });
  }
}