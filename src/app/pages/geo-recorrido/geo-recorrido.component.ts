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
import { debounceTime, distinctUntilChanged, forkJoin, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// --- Servicios e Interfaces ---
import { GeoRecorridoService } from '../../services/geo-recorrido/geo-recorrido.service';
import { GeoRutasService } from '../../services/geo_rutas/geo-rutas.service';
import {
  MapsComponent,
  MapRoute,
  MapMarker,
} from '../../components/maps/maps.component';
import { GeoRecorrido } from '../../interfaces/geo-recorrido';
import { GeoRutas, RutaStatus } from '../../interfaces/geo-rutas';
import { ClienteGeolocalizado } from '../../interfaces/cliente-geolocalizado';

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

  // Para interactuar con el servicio de direcciones de Google Maps
  private directionsService!: google.maps.DirectionsService;

  public filterControl = new FormControl('', { nonNullable: true });
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

  public mapRoutes: MapRoute[] = [];
  public mapMarkers: MapMarker[] = [];
  public mapCenter: google.maps.LatLngLiteral = { lat: 20.9754, lng: -89.6169 };
  public mapZoom = 12;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('mapaRecorridos') private appMapComponent!: MapsComponent;

  constructor() {
    this.directionsService = new google.maps.DirectionsService();
  }

  // (ngOnInit, ngAfterViewInit, cargarRutasMaestras, etc. permanecen igual)
  // ...
  getSpanishStatus(status: RutaStatus): string {
    switch (status) {
      case RutaStatus.PLANEADA:
        return 'Planeada';
      case RutaStatus.EN_CURSO:
        return 'En Curso';
      case RutaStatus.FINALIZADA:
        return 'Finalizada';
      case RutaStatus.CANCELADA:
        return 'Cancelada';
      default:
        return 'Desconocido';
    }
  }

  getIconForStatus(status: RutaStatus): string {
    switch (status) {
      case RutaStatus.PLANEADA:
        return 'event';
      case RutaStatus.EN_CURSO:
        return 'local_shipping';
      case RutaStatus.FINALIZADA:
        return 'check_circle';
      case RutaStatus.CANCELADA:
        return 'cancel';
      default:
        return 'help_outline';
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
      recorrido: this.recorridoService.getRecorridos().pipe(
        map((recorridos) => recorridos.filter((r) => r.idRuta === ruta.idRuta)),
        catchError(() => of([])) // Si falla, devuelve un array vacío
      ),
      clientes: this.geoRutasService
        .getClientesGeolocalizados(ruta.idRuta)
        .pipe(
          catchError(() => of([])) // Si falla, devuelve un array vacío
        ),
    }).subscribe({
      next: ({ recorrido, clientes }) => {
        // Ahora el procesamiento se hace en un método asíncrono
        this.procesarDatosDeRuta(recorrido, clientes).then(() => {
          if (!this.mapaVisible) {
            this.toggleMapa();
          } else {
            this.redibujarYCentrarMapa();
          }
          this.isLoadingData = false;
        });
      },
      error: () => {
        this.mostrarNotificacion('Error fatal al cargar los datos.', 'error');
        this.isLoadingData = false;
      },
    });
  }

  // =================================================================================
  // === MÉTODO PRINCIPAL DE PROCESAMIENTO (AHORA ASÍNCRONO) =========================
  // =================================================================================
  private async procesarDatosDeRuta(
    recorrido: GeoRecorrido[],
    clientes: ClienteGeolocalizado[]
  ): Promise<void> {
    const puntosRecorrido = recorrido
      .sort(
        (a, b) =>
          new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()
      )
      .map((p) => ({ lat: Number(p.latitud), lng: Number(p.longitud) }));

    const marcadoresTemporales: MapMarker[] = [];
    const rutasTemporales: MapRoute[] = [];

    // --- 1. Determinar qué clientes fueron visitados ---
    const VISIT_RADIUS_METERS = 50; // El repartidor debe pasar a 50 metros o menos del cliente
    const clientesVisitados: ClienteGeolocalizado[] = [];
    const clientesNoVisitados: ClienteGeolocalizado[] = [];

    if (puntosRecorrido.length > 0) {
      clientes.forEach((cliente) => {
        const clientePos = new google.maps.LatLng(
          parseFloat(cliente.latitud),
          parseFloat(cliente.longitud)
        );
        const fueVisitado = puntosRecorrido.some((puntoGps) => {
          const puntoGpsPos = new google.maps.LatLng(
            puntoGps.lat,
            puntoGps.lng
          );
          return (
            google.maps.geometry.spherical.computeDistanceBetween(
              clientePos,
              puntoGpsPos
            ) < VISIT_RADIUS_METERS
          );
        });

        if (fueVisitado) {
          clientesVisitados.push(cliente);
        } else {
          clientesNoVisitados.push(cliente);
        }
      });
    } else {
      // Si no hay recorrido GPS, todos los clientes se marcan como no visitados
      clientesNoVisitados.push(...clientes);
    }

    // --- 2. Crear los marcadores con iconos distintivos ---
    // Icono para clientes VISITADOS (Verde)
    clientesVisitados.forEach((c) =>
      marcadoresTemporales.push(this.crearMarcadorCliente(c, true))
    );
    // Icono para clientes NO VISITADOS (Gris)
    clientesNoVisitados.forEach((c) =>
      marcadoresTemporales.push(this.crearMarcadorCliente(c, false))
    );

    // --- 3. Dibujar el RECORRIDO REAL (Trazo GPS Naranja) ---
    if (puntosRecorrido.length > 0) {
      rutasTemporales.push({
        idRecorrido: this.selectedRutaId! * 100, // ID único para el trazo real
        path: puntosRecorrido,
        options: {
          strokeColor: '#FF5722',
          strokeOpacity: 0.8,
          strokeWeight: 6,
          zIndex: 5,
        },
      });
      // Añadir marcador de inicio
      marcadoresTemporales.push(this.crearMarcadorInicio(puntosRecorrido[0]));
      // Añadir marcador de última posición
      marcadoresTemporales.push(
        this.crearMarcadorFin(puntosRecorrido[puntosRecorrido.length - 1])
      );
    }

    // --- 4. Calcular y dibujar la RUTA IDEAL (Línea Azul en calles) ---
    if (clientesVisitados.length > 0 && puntosRecorrido.length > 0) {
      const waypoints = clientesVisitados.map((c) => ({
        location: new google.maps.LatLng(
          parseFloat(c.latitud),
          parseFloat(c.longitud)
        ),
        stopover: true,
      }));

      const request: google.maps.DirectionsRequest = {
        origin: puntosRecorrido[0],
        destination: puntosRecorrido[puntosRecorrido.length - 1],
        waypoints: waypoints,
        travelMode: google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true, // Pide a Google que reordene los waypoints para la ruta más corta
      };

      try {
        const result = await this.directionsService.route(request);
        if (result.routes.length > 0) {
          const path = result.routes[0].overview_path.map((p) => ({
            lat: p.lat(),
            lng: p.lng(),
          }));
          rutasTemporales.push({
            idRecorrido: this.selectedRutaId!, // ID único para la ruta ideal
            path: path,
            options: {
              strokeColor: '#4285F4',
              strokeOpacity: 0.7,
              strokeWeight: 8,
              zIndex: 4,
            },
          });
        }
      } catch (error) {
        console.error('Error al calcular la ruta de Google Directions:', error);
        this.mostrarNotificacion(
          'No se pudo calcular la ruta óptima en las calles.',
          'advertencia'
        );
      }
    }

    // --- 5. Asignar todo al estado del componente ---
    this.mapMarkers = marcadoresTemporales;
    this.mapRoutes = rutasTemporales;
  }

  // --- Métodos ayudantes para crear marcadores (más limpio) ---
  private crearMarcadorCliente(
    cliente: ClienteGeolocalizado,
    visitado: boolean
  ): MapMarker {
    return {
      position: {
        lat: parseFloat(cliente.latitud),
        lng: parseFloat(cliente.longitud),
      },
      options: {
        title: `${cliente.nombreComercio} (${
          visitado ? 'VISITADO' : 'NO VISITADO'
        })`,
        icon: {
          path: 'M20 4H4v2h16V4zm1 10v-2l-1-5H4l-1 5v2h1v6h10v-6h4v6h2v-6h1zm-9 4H6v-4h6v4z', // Icono de tienda
          fillColor: visitado ? '#34A853' : '#BDBDBD', // Verde si fue visitado, gris si no
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: '#FFFFFF',
          scale: 1.5,
          anchor: new google.maps.Point(12, 12),
        },
      },
    };
  }

  private crearMarcadorInicio(posicion: google.maps.LatLngLiteral): MapMarker {
    return {
      position: posicion,
      options: {
        title: 'Inicio de la Ruta',
        icon: {
          path: 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z',
          fillColor: '#03A9F4',
          fillOpacity: 1,
          strokeWeight: 1.5,
          strokeColor: '#FFFFFF',
          scale: 1.5,
          anchor: new google.maps.Point(5, 21),
        },
      },
    };
  }

  private crearMarcadorFin(posicion: google.maps.LatLngLiteral): MapMarker {
    return {
      position: posicion,
      options: {
        title: 'Última Posición Registrada',
        icon: {
          path: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h6.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
          fillColor: '#EA4335',
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: '#FFFFFF',
          scale: 1.4,
          anchor: new google.maps.Point(12, 12),
        },
        zIndex: 999,
      },
    };
  }

  // (El resto de métodos como redibujarYCentrarMapa y mostrarNotificacion permanecen igual)
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

  private redibujarYCentrarMapa(): void {
    const mapaGoogle = this.appMapComponent?.map?.googleMap;
    if (!mapaGoogle) return;

    google.maps.event.trigger(mapaGoogle, 'resize');

    const bounds = new google.maps.LatLngBounds();
    this.mapRoutes.forEach((r) => r.path.forEach((p) => bounds.extend(p)));
    this.mapMarkers.forEach((m) => bounds.extend(m.position));

    if (!bounds.isEmpty()) {
      mapaGoogle.fitBounds(bounds, 80);
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
