// src/app/pages/geo-recorrido/geo-recorrido.component.ts

import {
  Component,
  OnInit,
  inject,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { debounceTime, distinctUntilChanged, forkJoin, map } from 'rxjs';

// --- Servicios e Interfaces ---
import { GeoRecorridoService } from '../../services/geo-recorrido/geo-recorrido.service';
import { GeoRutasService } from '../../services/geo_rutas/geo-rutas.service';
import {
  MapsComponent,
  MapRoute,
  MapMarker,
} from '../../components/maps/maps.component';
import { GeoRecorrido } from '../../interfaces/geo-recorrido';
import { GeoRutas } from '../../interfaces/geo-rutas';
import { ClienteGeolocalizado } from '../../interfaces/cliente-geolocalizado';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-geo-recorrido',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatPaginatorModule,
    MatSortModule,
    MapsComponent,
    MatProgressSpinnerModule,
  ],
  providers: [DatePipe],
  templateUrl: './geo-recorrido.component.html',
  styleUrls: ['./geo-recorrido.component.css'],
})
export class GeoRecorridoComponent implements OnInit, AfterViewInit {
  private geoRutasService = inject(GeoRutasService);
  private recorridoService = inject(GeoRecorridoService);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);

  // --- Estado del Componente ---
  public filterControl = new FormControl('', { nonNullable: true });
  // ===================== CORRECCIÓN AQUÍ =====================
  public displayedColumns: string[] = [
    'idRuta',
    'idUsuario',
    'idUnidadTransporte',
    'fechaHora',
  ];
  public dataSource = new MatTableDataSource<GeoRutas>();
  public selectedRutaId: number | null = null;
  public mapaVisible = true;
  public isLoadingData = false;

  // --- Datos para el Mapa ---
  public mapRoutes: MapRoute[] = [];
  public mapMarkers: MapMarker[] = [];
  public mapCenter: google.maps.LatLngLiteral = { lat: 20.9754, lng: -89.6169 };
  public mapZoom = 12;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('mapaRecorridos') private appMapComponent!: MapsComponent;

  ngOnInit(): void {
    this.cargarRutasMaestras();
    this.filterControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((valorFiltro) => this.aplicarFiltro(valorFiltro));
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (
      data: GeoRutas,
      filter: string
    ): boolean => {
      // ===================== CORRECCIÓN AQUÍ =====================
      const dataStr = (
        data.idRuta.toString() +
        data.idUsuario.toString() +
        data.idUnidadTransporte.toString() +
        this.datePipe.transform(data.fechaHora, 'fullDate')
      ).toLowerCase();
      return dataStr.includes(filter);
    };
  }

  cargarRutasMaestras(): void {
    this.geoRutasService.getRutas().subscribe({
      next: (rutas) => {
        this.dataSource.data = rutas;
      },
      error: () =>
        this.mostrarNotificacion('Error al cargar la lista de rutas.', 'error'),
    });
  }

  aplicarFiltro(valor: string): void {
    this.dataSource.filter = valor.trim().toLowerCase();
    if (this.dataSource.paginator) this.dataSource.paginator.firstPage();
  }

  limpiarFiltro(): void {
    this.filterControl.setValue('');
  }

  toggleMapa(): void {
    this.mapaVisible = !this.mapaVisible;
    if (this.mapaVisible) {
      setTimeout(() => this.redibujarYCentrarMapa(), 100);
    }
  }

  seleccionarRuta(ruta: GeoRutas): void {
    if (this.isLoadingData) return;

    if (this.selectedRutaId === ruta.idRuta) {
      this.selectedRutaId = null;
      this.mapRoutes = [];
      this.mapMarkers = [];
      return;
    }

    this.isLoadingData = true;
    this.selectedRutaId = ruta.idRuta;
    this.mapRoutes = [];
    this.mapMarkers = [];

    forkJoin({
      recorrido: this.recorridoService
        .getRecorridos()
        .pipe(
          map((recorridos) =>
            recorridos.filter((r) => r.idRuta === ruta.idRuta)
          )
        ),
      clientes: this.geoRutasService.getClientesGeolocalizados(ruta.idRuta),
    }).subscribe({
      next: ({ recorrido, clientes }) => {
        this.procesarDatosParaMapa(recorrido, clientes);
        if (!this.mapaVisible) {
          this.toggleMapa();
        } else {
          this.redibujarYCentrarMapa();
        }
        this.isLoadingData = false;
      },
      error: () => {
        this.mostrarNotificacion(
          'Error al cargar los datos del recorrido.',
          'error'
        );
        this.isLoadingData = false;
      },
    });
  }

  private procesarDatosParaMapa(
    recorrido: GeoRecorrido[],
    clientes: ClienteGeolocalizado[]
  ): void {
    const puntosRecorrido = recorrido
      .sort(
        (a, b) =>
          new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()
      )
      .map((p) => ({ lat: Number(p.latitud), lng: Number(p.longitud) }));

    this.mapRoutes = [
      {
        idRecorrido: this.selectedRutaId!,
        path: puntosRecorrido,
        options: {
          strokeColor: '#FF0000',
          strokeOpacity: 0.7,
          strokeWeight: 5,
          zIndex: 2,
        },
      },
    ];

    this.mapMarkers = clientes.map((cliente) => ({
      position: {
        lat: parseFloat(cliente.latitud),
        lng: parseFloat(cliente.longitud),
      },
      options: {
        title: `${cliente.nombreComercio}\n${cliente.direccion}`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#1E90FF',
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: '#FFFFFF',
        },
      },
    }));
  }

  private redibujarYCentrarMapa(): void {
    const mapaGoogle = this.appMapComponent?.map?.googleMap;
    if (!mapaGoogle) return;

    google.maps.event.trigger(mapaGoogle, 'resize');

    const bounds = new google.maps.LatLngBounds();
    this.mapRoutes.forEach((r) => r.path.forEach((p) => bounds.extend(p)));
    this.mapMarkers.forEach((m) => bounds.extend(m.position));

    if (!bounds.isEmpty()) {
      mapaGoogle.fitBounds(bounds, 60);
    } else {
      mapaGoogle.setCenter(this.mapCenter);
      mapaGoogle.setZoom(this.mapZoom);
    }
  }

  private mostrarNotificacion(
    mensaje: string,
    tipo: 'exito' | 'error' | 'advertencia'
  ) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 5000,
      panelClass: [`snackbar-${tipo}`],
      verticalPosition: 'top',
    });
  }
}
