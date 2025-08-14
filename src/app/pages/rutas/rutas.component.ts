import { Component, inject, OnInit, ViewChild, signal, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { forkJoin, lastValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { SelectionModel } from '@angular/cdk/collections';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

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
import { GeoRutasDetalleService } from '../../services/geo_rutasDetalle/geo-rutas-detalles.service';
import { CreateGeoRutaPayload } from '../../interfaces/geo-rutas';

// --- MEJORA: Interfaz para un formulario fuertemente tipado ---
interface RutaFormControls {
  idUsuario: FormControl<number | null>;
  idUnidadTransporte: FormControl<number | null>;
  kmInicial: FormControl<string | null>;
}

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatCardModule, MatSnackBarModule, MatTableModule,
    MatDividerModule, MatCheckboxModule, MatPaginatorModule, MatProgressSpinnerModule,
    MatSortModule, DatePipe,
  ],
  templateUrl: './rutas.component.html',
  styleUrls: ['./rutas.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush, // <-- MEJORA DE RENDIMIENTO
})
export class RutasComponent implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS MODERNA ---
  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private geoRutasService = inject(GeoRutasService);
  private geoRutasDetalleService = inject(GeoRutasDetalleService);
  private geoUnidadTransportesService = inject(GeoUnidadTransportesService);
  private geoUsuariosService = inject(GeoUsuariosService);

  // --- GESTIÓN DE ESTADO CON SIGNALS ---
  public isLoading = signal(true);
  public isSaving = signal(false);
  public operadores = signal<GeoUsuario[]>([]);
  public unidades = signal<GeoUnidadTransporte[]>([]);
  private servicios = signal<ServicioDisponible[]>([]);

  public rutaForm: FormGroup<RutaFormControls>;
  public serviciosDisponibles = new MatTableDataSource<ServicioDisponible>();
  public selection = new SelectionModel<ServicioDisponible>(true, []);
  public columnasTabla: string[] = ['select', 'nombreComercio', 'nombreEquipo', 'tipoServicio', 'fechaServicio'];
  public filterControl = new FormControl('');

  // --- MEJORA: Uso de setters para Paginator y Sort ---
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    if (paginator) this.serviciosDisponibles.paginator = paginator;
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    if (sort) this.serviciosDisponibles.sort = sort;
  }

  constructor() {
    this.rutaForm = this.fb.group({
      idUsuario: new FormControl(null, Validators.required),
      idUnidadTransporte: new FormControl(null, Validators.required),
      kmInicial: new FormControl(null, [Validators.required, Validators.pattern('^[0-9]*$')]),
    }) as FormGroup<RutaFormControls>;

    // --- MEJORA: `takeUntilDestroyed` para manejo automático de subscripciones ---
    this.filterControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(value => this.applyFilter(value || ''));

    // --- MEJORA: `effect` para sincronizar el estado reactivo con la tabla ---
    effect(() => {
      this.serviciosDisponibles.data = this.servicios();
    });
  }

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  async cargarDatosIniciales(): Promise<void> {
    this.isLoading.set(true);
    try {
      const { operadores, unidades, servicios } = await lastValueFrom(forkJoin({
        operadores: this.geoUsuariosService.getUsuarios(),
        unidades: this.geoUnidadTransportesService.getUnidadesTransporte(),
        servicios: this.geoRutasDetalleService.findServiciosDisponiblesParaRuta(),
      }));
      this.operadores.set(operadores);
      this.unidades.set(unidades.filter((u) => u.activo));
      this.servicios.set(servicios);
    } catch (error) {
      this.mostrarNotificacion('Error al cargar datos. Verifique la conexión.', 'error');
    } finally {
      this.isLoading.set(false);
    }
  }

  applyFilter(filterValue: string) {
    this.serviciosDisponibles.filter = filterValue.trim().toLowerCase();
    if (this.serviciosDisponibles.paginator) {
      this.serviciosDisponibles.paginator.firstPage();
    }
  }

  // Lógica de Selección (sin cambios funcionales)
  isAllSelected(): boolean {
    return this.selection.selected.length === this.serviciosDisponibles.data.length;
  }
  toggleAllRows(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.selection.select(...this.serviciosDisponibles.data);
  }
  checkboxLabel(row?: ServicioDisponible): string {
    if (!row) return `${this.isAllSelected() ? 'deselect' : 'select'} all`;
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.idServicioEquipo}`;
  }

  // --- MEJORA: Lógica de guardado con async/await para mayor claridad ---
  async guardarRuta(): Promise<void> {
    if (this.rutaForm.invalid) {
      this.mostrarNotificacion('Complete los datos generales de la ruta.', 'advertencia');
      return;
    }
    if (this.selection.isEmpty()) {
      this.mostrarNotificacion('Debe seleccionar al menos un servicio.', 'advertencia');
      return;
    }

    this.isSaving.set(true);
    try {
      const payloadRuta = this.rutaForm.getRawValue() as CreateGeoRutaPayload;
      const nuevaRuta = await lastValueFrom(this.geoRutasService.createRuta(payloadRuta));
      
      const detallesPayload: GeoRutaDetallePayload[] = this.selection.selected.map(servicio => ({
        idRuta: nuevaRuta.idRuta,
        idServicioEquipo: servicio.idServicioEquipo,
        status: 1, // Por defecto: 1 = Pendiente
        // ...resto de propiedades
        noSerie: servicio.NoSerie ?? undefined,
        nombreEquipo: servicio.nombreEquipo,
        fechaServicio: servicio.fechaServicio,
        hora: servicio.hora,
        tipoServicio: servicio.tipoServicio,
        descripcion: servicio.descripcion ?? undefined,
        observacionesServicio: servicio.observaciones_servicio ?? undefined,
        idContrato: servicio.idContrato,
        nombreComercio: servicio.nombreComercio,
      }));

      const requests = detallesPayload.map(payload => this.geoRutasDetalleService.create(payload));
      await lastValueFrom(forkJoin(requests));

      this.mostrarNotificacion('Ruta y servicios guardados con éxito.', 'exito');
      this.router.navigate(['/rutas']);
    } catch (err) {
      console.error('Error detallado al guardar la ruta:', err);
      this.mostrarNotificacion('Error al guardar los servicios de la ruta.', 'error');
    } finally {
      this.isSaving.set(false);
    }
  }

  cancelar(): void {
    this.router.navigate(['/rutas']);
  }

  private mostrarNotificacion(mensaje: string, tipo: 'exito' | 'error' | 'advertencia'): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      panelClass: tipo === 'exito' ? 'snackbar-success' : `snackbar-${tipo}`,
      verticalPosition: 'top',
    });
  }
}
