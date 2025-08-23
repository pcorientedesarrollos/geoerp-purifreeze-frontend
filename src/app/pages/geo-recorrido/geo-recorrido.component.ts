import {
  trigger,
  state,
  style,
  transition,
  animate,
} from '@angular/animations';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  Component,
  OnInit,
  inject,
  ViewChild,
  AfterViewInit,
  ChangeDetectorRef,
  OnDestroy,
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
import {
  debounceTime,
  distinctUntilChanged,
  forkJoin,
  map,
  of,
  Subscription,
} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Socket } from 'ngx-socket-io';
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
import { GeoStatusService } from '../../services/geo_status/geo-status.service';
import { GeoStatus } from '../../interfaces/geo_status';

declare var google: any;

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
    MatDividerModule,
    MatTooltipModule,
  ],
  providers: [DatePipe],
  templateUrl: './geo-recorrido.component.html',
  styleUrls: ['./geo-recorrido.component.css'],
  animations: [
    trigger('slideInOut', [
      state(
        'in',
        style({ 'max-height': '1000px', opacity: '1', visibility: 'visible' })
      ),
      state(
        'out',
        style({ 'max-height': '0px', opacity: '0', visibility: 'hidden' })
      ),
      transition('in <=> out', animate('400ms ease-in-out')),
    ]),
  ],
})
export class GeoRecorridoComponent implements OnInit, AfterViewInit, OnDestroy {
  private geoRutasService = inject(GeoRutasService);
  private recorridoService = inject(GeoRecorridoService);
  private geoStatusService = inject(GeoStatusService);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);
  private cdr = inject(ChangeDetectorRef);
  private socket = inject(Socket);

  private socketSubscription!: Subscription;
  private directionsService!: google.maps.DirectionsService;
  public statusesMap = new Map<number, GeoStatus>();

  public filterControl = new FormControl('', { nonNullable: true });

  // ===================== ¡CORRECCIÓN DEFINITIVA! =====================
  // Estos nombres ahora coinciden 1 a 1 con los `matColumnDef` del archivo .html que te proporcionaré.
  public displayedColumns: string[] = [
    'idRuta',
    'status',
    'operador',
    'unidad',
    'fechaHora',
  ];
  // =======================================================================

  public dataSource = new MatTableDataSource<GeoRutas>();
  public selectedRuta: GeoRutas | null = null;
  public mapaVisible = false; //Inicia el mapa cerrado
  public isLoadingData = true; // Inicia en true

  public mapRoutes: MapRoute[] = [];
  public mapMarkers: MapMarker[] = [];
  public mapCenter: google.maps.LatLngLiteral = { lat: 20.9754, lng: -89.6169 };
  public mapZoom = 12;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  @ViewChild('mapaRecorridos') private appMapComponent!: MapsComponent;

  ngOnInit(): void {
    this.initializeGoogleMapsServices();
    this.cargarDatosIniciales();
    this.filterControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((valorFiltro) => this.aplicarFiltro(valorFiltro));
    this.escucharCoordenadasEnTiempoReal();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'status':
          return item.status.status;
        case 'operador':
          return item.usuario.usuario;
        case 'unidad':
          return item.unidadTransporte.nombreUnidad;
        default:
          return (item as any)[property];
      }
    };
    this.dataSource.filterPredicate = (
      data: GeoRutas,
      filter: string
    ): boolean => {
      const dataStr = (
        data.idRuta.toString() +
        (data.status?.status || '') +
        (data.usuario?.usuario || '') +
        (data.unidadTransporte?.nombreUnidad || '') +
        (this.datePipe.transform(data.fechaHora, 'fullDate') || '')
      ).toLowerCase();
      return dataStr.includes(filter);
    };
  }

  ngOnDestroy(): void {
    this.socketSubscription?.unsubscribe();
  }

  cargarDatosIniciales(): void {
    this.isLoadingData = true;
    forkJoin({
      rutas: this.geoRutasService.getRutas(),
      statuses: this.geoStatusService.getStatuses(),
    }).subscribe({
      next: ({ rutas, statuses }) => {
        statuses.forEach((status) =>
          this.statusesMap.set(status.idStatus, status)
        );
        this.dataSource.data = rutas;
        this.isLoadingData = false;
      },
      error: (err) => {
        this.isLoadingData = false;
        this.mostrarNotificacion('Error al cargar datos iniciales.', 'error');
        console.error('Error en cargarDatosIniciales:', err);
      },
    });
  }

  get selectedRutaId(): number | null {
    return this.selectedRuta?.idRuta ?? null;
  }

  aplicarFiltro(valor: string): void {
    this.dataSource.filter = valor.trim().toLowerCase();
    this.dataSource.paginator?.firstPage();
  }

  limpiarFiltro(): void {
    this.filterControl.setValue('');
  }

  toggleMapa(): void {
    this.mapaVisible = !this.mapaVisible;
    if (this.mapaVisible && this.selectedRutaId) {
      setTimeout(() => this.redibujarYCentrarMapa(), 450);
    }
  }

  seleccionarRuta(ruta: GeoRutas): void {
    if (this.isLoadingData) return;
    if (this.selectedRutaId === ruta.idRuta) {
      this.selectedRuta = null;
      this.mapRoutes = [];
      this.mapMarkers = [];
      return;
    }
    this.isLoadingData = true;
    this.selectedRuta = ruta;
    this.mapRoutes = [];
    this.mapMarkers = [];

    forkJoin({
      recorrido: this.recorridoService.getRecorridos().pipe(
        map((recs) => recs.filter((r) => r.idRuta === ruta.idRuta)),
        catchError(() => of([]))
      ),
      clientes: this.geoRutasService
        .getClientesGeolocalizados(ruta.idRuta)
        .pipe(catchError(() => of([]))),
    }).subscribe({
      next: async ({ recorrido, clientes }) => {
        try {
          await this.procesarDatosDeRuta(recorrido, clientes);
          if (this.mapaVisible)
            setTimeout(() => this.redibujarYCentrarMapa(), 100);
        } catch (error) {
          this.mostrarNotificacion(
            'Error procesando datos de la ruta.',
            'error'
          );
        } finally {
          this.isLoadingData = false;
          this.cdr.detectChanges();
        }
      },
      error: () => {
        this.isLoadingData = false;
        this.mostrarNotificacion(
          'Error fatal cargando datos de la ruta.',
          'error'
        );
      },
    });
  }

  public getStatusClass(status: GeoStatus | undefined): string {
    if (!status || !status.status) return 'desconocido';
    return status.status.toLowerCase().replace(/\s+/g, '-');
  }

  getIconForStatus(idEstatus: number): string {
    const statusName =
      this.statusesMap.get(idEstatus)?.status.toLowerCase() || '';
    switch (statusName) {
      case 'confirmado':
      case 'planeada':
        return 'event';
      case 'en curso':
        return 'local_shipping';
      case 'finalizada':
        return 'check_circle';
      case 'cancelada':
        return 'cancel';
      case 'eliminado':
        return 'delete';
      default:
        return 'help_outline';
    }
  }

  formatarDuracion(totalMinutes: number | null | undefined): string {
    if (totalMinutes === null || totalMinutes === undefined || totalMinutes < 0)
      return '--';
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    return (
      `${hours > 0 ? hours + 'h ' : ''}${
        minutes > 0 || hours === 0 ? minutes + 'm' : ''
      }`.trim() || '0m'
    );
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

  private initializeGoogleMapsServices(): void {
    if (typeof google !== 'undefined' && google.maps) {
      this.directionsService = new google.maps.DirectionsService();
    } else {
      setTimeout(() => this.initializeGoogleMapsServices(), 500);
    }
  }

  escucharCoordenadasEnTiempoReal(): void {
    this.socketSubscription = this.socket
      .fromEvent<GeoRecorrido>('nueva-coordenada')
      .subscribe((punto) => {
        if (this.selectedRutaId && punto.idRuta === this.selectedRutaId) {
          const rutaReal = this.mapRoutes.find(
            (r) => r.idRecorrido === this.selectedRutaId! * 100
          );
          if (rutaReal)
            rutaReal.path.push({
              lat: Number(punto.latitud),
              lng: Number(punto.longitud),
            });
          const marcadorFin = this.mapMarkers.find(
            (m) => m.options?.title === 'Última Posición Registrada'
          );
          if (marcadorFin)
            marcadorFin.position = {
              lat: Number(punto.latitud),
              lng: Number(punto.longitud),
            };
          this.mapRoutes = [...this.mapRoutes];
          this.mapMarkers = [...this.mapMarkers];
        }
      });
  }

  centrarEnUltimaPosicion(): void {
    const marcadorFin = this.mapMarkers.find(
      (m) => m.options?.title === 'Última Posición Registrada'
    );
    if (marcadorFin && this.appMapComponent?.map) {
      this.appMapComponent.map.panTo(marcadorFin.position);
      this.appMapComponent.map.googleMap?.setZoom(16);
    } else {
      this.mostrarNotificacion(
        'No se encontró la última posición del vehículo.',
        'advertencia'
      );
    }
  }

  private async procesarDatosDeRuta(
    recorrido: GeoRecorrido[],
    clientes: ClienteGeolocalizado[]
  ): Promise<void> {
    if (!this.directionsService) {
      this.mostrarNotificacion(
        'El servicio de mapas aún no está listo.',
        'advertencia'
      );
      return;
    }
    const puntosRecorrido = recorrido
      .sort(
        (a, b) =>
          new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()
      )
      .map((p) => ({ lat: Number(p.latitud), lng: Number(p.longitud) }));
    const marcadoresTemporales: MapMarker[] = [];
    const rutasTemporales: MapRoute[] = [];
    const clientesVisitados: ClienteGeolocalizado[] = [];
    const clientesNoVisitados = [...clientes];
    if (puntosRecorrido.length > 0) {
      clientes.forEach((cliente) => {
        const clientePos = new google.maps.LatLng(
          parseFloat(cliente.latitud),
          parseFloat(cliente.longitud)
        );
        if (
          puntosRecorrido.some(
            (puntoGps) =>
              google.maps.geometry.spherical.computeDistanceBetween(
                clientePos,
                new google.maps.LatLng(puntoGps.lat, puntoGps.lng)
              ) < 70
          )
        ) {
          clientesVisitados.push(cliente);
          const idx = clientesNoVisitados.indexOf(cliente);
          if (idx > -1) clientesNoVisitados.splice(idx, 1);
        }
      });
    }
    clientesVisitados.forEach((c) =>
      marcadoresTemporales.push(this.crearMarcadorCliente(c, true))
    );
    clientesNoVisitados.forEach((c) =>
      marcadoresTemporales.push(this.crearMarcadorCliente(c, false))
    );
    if (puntosRecorrido.length > 1)
      rutasTemporales.push({
        idRecorrido: this.selectedRutaId! * 100,
        path: puntosRecorrido,
        options: {
          strokeColor: '#FF5722',
          strokeOpacity: 0.8,
          strokeWeight: 6,
          zIndex: 5,
        },
      });
    if (puntosRecorrido.length > 0) {
      marcadoresTemporales.push(this.crearMarcadorInicio(puntosRecorrido[0]));
      marcadoresTemporales.push(
        this.crearMarcadorFin(puntosRecorrido[puntosRecorrido.length - 1])
      );
    }
    if (clientesVisitados.length > 1) {
      const waypoints = clientesVisitados.slice(1, -1).map((c) => ({
        location: new google.maps.LatLng(
          parseFloat(c.latitud),
          parseFloat(c.longitud)
        ),
        stopover: true,
      }));
      try {
        const result = await this.directionsService.route({
          origin: new google.maps.LatLng(
            parseFloat(clientesVisitados[0].latitud),
            parseFloat(clientesVisitados[0].longitud)
          ),
          destination: new google.maps.LatLng(
            parseFloat(clientesVisitados[clientesVisitados.length - 1].latitud),
            parseFloat(clientesVisitados[clientesVisitados.length - 1].longitud)
          ),
          waypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: true,
        });
        if (result.routes.length > 0) {
          const path = result.routes[0].overview_path.map((p: any) => ({
            lat: p.lat(),
            lng: p.lng(),
          }));
          rutasTemporales.push({
            idRecorrido: this.selectedRutaId!,
            path,
            options: {
              strokeColor: '#4285F4',
              strokeOpacity: 0.7,
              strokeWeight: 8,
              zIndex: 4,
            },
          });
        }
      } catch (error) {
        this.mostrarNotificacion(
          'No se pudo calcular la ruta óptima entre clientes.',
          'advertencia'
        );
      }
    }
    this.mapMarkers = marcadoresTemporales;
    this.mapRoutes = rutasTemporales;
  }

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
          visitado ? 'VISITADO' : 'PENDIENTE'
        })`,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          fillColor: visitado ? '#34A853' : '#BDBDBD',
          fillOpacity: 1,
          strokeWeight: 1.5,
          strokeColor: '#FFFFFF',
          scale: 8,
        },
      },
    };
  }
  private crearMarcadorInicio(posicion: google.maps.LatLngLiteral): MapMarker {
    return {
      position: posicion,
      options: {
        title: 'Inicio de la Ruta',
        zIndex: 100,
        icon: {
          url: 'assets/icons/start-flag.png',
          scaledSize: new google.maps.Size(40, 40),
          anchor: new google.maps.Point(10, 40),
        },
      },
    };
  }
  private crearMarcadorFin(posicion: google.maps.LatLngLiteral): MapMarker {
    return {
      position: posicion,
      options: {
        title: 'Última Posición Registrada',
        zIndex: 101,
        icon: {
          url: 'assets/icons/delivery-truck.png',
          scaledSize: new google.maps.Size(48, 48),
          anchor: new google.maps.Point(24, 24),
        },
      },
    };
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
}
