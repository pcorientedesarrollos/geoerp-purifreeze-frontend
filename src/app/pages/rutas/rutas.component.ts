import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

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

// Tus Servicios e Interfaces
import { GeoClientesService } from '../../services/geo_clientes/geo-clientes.service';
import { GeoTipoServicioService } from '../../services/geo_tipoServicios/geo-tipo-servicio.service';
import { GeoUnidadTransportesService } from '../../services/geo_unidadTransportes/geo-unidad-transportes.service';
import { GeoRutasService } from '../../services/geo_rutas/geo-rutas.service';
import { GeoRutasDetallesService } from '../../services/geo_rutasDetalle/geo-rutas-detalles.service';
import { GeoCliente } from '../../interfaces/geo_clientes';
import { GeoTipoServicio } from '../../interfaces/geo_tipo-servicios';
import { GeoUnidadTransporte } from '../../interfaces/geo_unidad-transportes';
import { GeoRutas } from '../../interfaces/geo-rutas';
import { GeoRutasDetalle } from '../../interfaces/geo-rutas-detalle';

// Interfaz temporal para el operador
interface Operador {
  idUsuario: number;
  nombre: string;
}

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [ CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatDatepickerModule, MatCardModule, MatSnackBarModule ],
  templateUrl: './rutas.component.html',
  styleUrls: ['./rutas.component.css'],
  providers: [provideNativeDateAdapter()],
})
export class RutasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private geoRutasService = inject(GeoRutasService);
  private geoRutasDetallesService = inject(GeoRutasDetallesService);
  private geoClientesService = inject(GeoClientesService);
  private geoTipoServicioService = inject(GeoTipoServicioService);
  private geoUnidadTransportesService = inject(GeoUnidadTransportesService);

  rutaForm: FormGroup;

  operadores: Operador[] = [];
  unidades: GeoUnidadTransporte[] = [];
  clientes: GeoCliente[] = [];
  tiposDeServicio: GeoTipoServicio[] = [];
  sucursales: any[] = [];

  constructor() {
    this.rutaForm = this.fb.group({
      idUsuario: ['', Validators.required],
      idUnidadTransporte: ['', Validators.required],
      fecha_hora: [new Date(), Validators.required],
      paradas: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
    this.agregarParada();
  }

  cargarDatosIniciales(): void {
    // Lista temporal para operadores. Funciona sin BD.
    this.operadores = [
      { idUsuario: 1, nombre: 'Juan Pérez' },
      { idUsuario: 2, nombre: 'María García' },
    ];

    // Llamadas a la API para el resto de las listas. Necesitan datos en la BD.
    forkJoin({
      unidades: this.geoUnidadTransportesService.getUnidadesTransporte(),
      clientes: this.geoClientesService.getClientes(),
      tiposServicio: this.geoTipoServicioService.getTiposServicio(),
    }).subscribe({
      next: (data) => {
        this.unidades = data.unidades.filter(u => u.activo);
        this.clientes = data.clientes;
        this.tiposDeServicio = data.tiposServicio.filter(s => s.estado);
      },
      error: (err) => {
        console.error('Error al cargar datos desde la API:', err);
        this.snackBar.open('Error al cargar datos. Revisa la consola y que la API esté funcionando.', 'Cerrar', { duration: 5000 });
      }
    });
  }

  get paradas(): FormArray { return this.rutaForm.get('paradas') as FormArray; }

  nuevaParada(): FormGroup {
    return this.fb.group({
      idCliente: ['', Validators.required],
      idSucursal: [{ value: '', disabled: true }, Validators.required],
      direccion: ['', Validators.required],
      idTipoServicio: ['', Validators.required],
      notas: ['']
    });
  }

  agregarParada(): void { this.paradas.push(this.nuevaParada()); }
  eliminarParada(index: number): void { this.paradas.removeAt(index); }

  onClienteSeleccionado(clienteId: number, paradaIndex: number): void {
    const paradaFormGroup = this.paradas.at(paradaIndex);
    paradaFormGroup.get('idSucursal')?.enable();
    // Aquí irá la lógica para cargar las sucursales de ese cliente
  }
  
  onSubmit(): void {
    if (this.rutaForm.invalid) {
      this.snackBar.open('El formulario tiene campos obligatorios sin rellenar.', 'Cerrar', { duration: 3000 });
      this.rutaForm.markAllAsTouched();
      return;
    }
    console.log('Formulario válido, listo para enviar:', this.rutaForm.value);
    this.snackBar.open('Enviando ruta... (Revisa la consola)', 'Ok', { duration: 3000 });
  }
}