// ========================== rutas.component.ts (Versión Completa) ==========================

import { Component, OnInit, inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router'; // <--- IMPORTACIÓN NECESARIA
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

// Servicios e Interfaces
import { GeoClientesService } from '../../services/geo_clientes/geo-clientes.service';
import { GeoTipoServicioService } from '../../services/geo_tipoServicios/geo-tipo-servicio.service';
import { GeoUnidadTransportesService } from '../../services/geo_unidadTransportes/geo-unidad-transportes.service';
import { GeoRutasService } from '../../services/geo_rutas/geo-rutas.service';
import { GeoCliente } from '../../interfaces/geo_clientes';
import { GeoTipoServicio } from '../../interfaces/geo_tipo-servicios';
import { GeoUnidadTransporte } from '../../interfaces/geo_unidad-transportes';
import { GeoRutas } from '../../interfaces/geo-rutas';
import { GeoRutasParada } from '../../interfaces/geo-rutas-parada';

// Interfaz temporal para el operador
interface Operador {
  idUsuario: number;
  nombre: string;
}

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatDatepickerModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  templateUrl: './rutas.component.html',
  styleUrls: ['./rutas.component.css'],
  providers: [provideNativeDateAdapter()],
})
export class RutasComponent implements OnInit {
  // --- INYECCIONES DE DEPENDENCIAS ---
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private geoRutasService = inject(GeoRutasService);
  private geoClientesService = inject(GeoClientesService);
  private geoTipoServicioService = inject(GeoTipoServicioService);
  private geoUnidadTransportesService = inject(GeoUnidadTransportesService);

  // --- PROPIEDADES DEL COMPONENTE ---
  rutaForm: FormGroup;
  operadores: Operador[] = [];
  unidades: GeoUnidadTransporte[] = [];
  clientes: GeoCliente[] = [];
  tiposDeServicio: GeoTipoServicio[] = [];
  sucursales: any[] = [];

  public editMode = false;
  private rutaId: number | null = null;
  public pageTitle = 'Crear Nueva Ruta'; // Título dinámico para la vista

  constructor() {
    this.rutaForm = this.fb.group({
      idUsuario: ['', Validators.required],
      idUnidadTransporte: ['', Validators.required],
      fecha_hora: [new Date(), Validators.required],
      paradas: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editMode = true;
      this.rutaId = +id;
      this.pageTitle = 'Editar Ruta';
      this.cargarRutaParaEditar(this.rutaId);
    } else {
      this.pageTitle = 'Crear Nueva Ruta';
      this.agregarParada();
    }
  }

  cargarDatosIniciales(): void {
    this.operadores = [
      { idUsuario: 1, nombre: 'Juan Pérez' },
      { idUsuario: 2, nombre: 'María García' },
    ];

    forkJoin({
      unidades: this.geoUnidadTransportesService.getUnidadesTransporte(),
      clientes: this.geoClientesService.getClientes(),
      tiposServicio: this.geoTipoServicioService.getTiposServicio(),
    }).subscribe({
      next: (data) => {
        this.unidades = data.unidades.filter((u) => u.activo);
        this.clientes = data.clientes;
        this.tiposDeServicio = data.tiposServicio.filter((s) => s.estado);
      },
      error: (err) => {
        console.error('Error al cargar datos desde la API:', err);
        this.snackBar.open(
          'Error al cargar datos iniciales. Revisa la consola.',
          'Cerrar',
          { duration: 5000 }
        );
      },
    });
  }

  cargarRutaParaEditar(id: number): void {
    this.geoRutasService.getRutaPorId(id).subscribe({
      next: (ruta: GeoRutas) => {
        this.rutaForm.patchValue({
          idUsuario: ruta.idUsuario,
          idUnidadTransporte: ruta.idUnidadTransporte,
          fecha_hora: ruta.fecha_hora,
        });

        this.paradas.clear();

        ruta.paradas.forEach((parada: GeoRutasParada) => {
          const paradaFormGroup = this.fb.group({
            idCliente: [parada.idCliente, Validators.required],
            idSucursal: [parada.idSucursal, Validators.required],
            direccion: [parada.direccion, Validators.required],
            idTipoServicio: [parada.idTipoServicio, Validators.required],
            notas: [parada.notas],
          });
          // Habilitamos el campo de sucursal ya que el cliente está cargado
          paradaFormGroup.get('idSucursal')?.enable();
          this.paradas.push(paradaFormGroup);
        });
      },
      error: (err: any) =>
        this.snackBar.open('Error al cargar la ruta para editar.', 'Cerrar', {
          duration: 3000,
        }),
    });
  }

  get paradas(): FormArray {
    return this.rutaForm.get('paradas') as FormArray;
  }

  nuevaParada(): FormGroup {
    return this.fb.group({
      idCliente: ['', Validators.required],
      idSucursal: [{ value: '', disabled: true }, Validators.required],
      direccion: ['', Validators.required],
      idTipoServicio: ['', Validators.required],
      notas: [''],
    });
  }

  agregarParada(): void {
    this.paradas.push(this.nuevaParada());
  }

  eliminarParada(index: number): void {
    this.paradas.removeAt(index);
  }

  onClienteSeleccionado(clienteId: number, paradaIndex: number): void {
    const paradaFormGroup = this.paradas.at(paradaIndex);
    paradaFormGroup.get('idSucursal')?.enable();
    // Aquí irá la lógica para cargar las sucursales de ese cliente desde un servicio
  }

  onSubmit(): void {
    if (this.rutaForm.invalid) {
      this.snackBar.open(
        'El formulario tiene campos obligatorios sin rellenar.',
        'Cerrar',
        { duration: 3000 }
      );
      this.rutaForm.markAllAsTouched();
      return;
    }

    const datosParaEnviar = this.rutaForm.getRawValue();

    if (this.editMode && this.rutaId) {
      // --- Lógica de ACTUALIZACIÓN ---
      this.geoRutasService.updateRuta(this.rutaId, datosParaEnviar).subscribe({
        next: () => {
          this.snackBar.open('Ruta actualizada con éxito', 'Ok', {
            duration: 3000,
          });
          this.router.navigate(['/rutas']); // Redirige a la lista
        },
        error: (err: any) => {
          console.error('Error al actualizar:', err);
          this.snackBar.open('Error al actualizar la ruta.', 'Cerrar', {
            duration: 4000,
          });
        },
      });
    } else {
      // --- Lógica de CREACIÓN ---
      this.geoRutasService.createRuta(datosParaEnviar).subscribe({
        next: () => {
          this.snackBar.open('Ruta creada con éxito', 'Ok', { duration: 3000 });
          this.router.navigate(['/rutas']); // Redirige a la lista
        },
        error: (err: any) => {
          console.error('Error al crear:', err);
          this.snackBar.open('Error al crear la ruta.', 'Cerrar', {
            duration: 4000,
          });
        },
      });
    }
  }
}
