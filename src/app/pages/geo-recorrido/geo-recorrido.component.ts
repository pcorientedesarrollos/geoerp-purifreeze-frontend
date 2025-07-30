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
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { GeoRecorrido } from '../../interfaces/geo-recorrido';
import { GeoRecorridoService } from '../../services/geo-recorrido/geo-recorrido.service';
import {
  MapsComponent,
  MapRoute,
  MapMarker,
} from '../../components/maps/maps.component';

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
  ],
  providers: [DatePipe],
  templateUrl: './geo-recorrido.component.html',
  styleUrls: ['./geo-recorrido.component.css'],
})
export class GeoRecorridoComponent implements OnInit, AfterViewInit {
  private recorridoService = inject(GeoRecorridoService);
  private snackBar = inject(MatSnackBar);
  private datePipe = inject(DatePipe);

  filterControl = new FormControl('', { nonNullable: true });
  displayedColumns: string[] = [
    'idRecorrido',
    'idRuta',
    'latitud',
    'longitud',
    'fechaHora',
  ];
  dataSource = new MatTableDataSource<GeoRecorrido>();
  private todosLosRecorridos: GeoRecorrido[] = [];

  @ViewChild('mapaRecorridos') private appMapComponent!: MapsComponent;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // --- CAMBIO DE NOMBRE: De 'Recorrido' a 'Ruta' para reflejar la lógica ---
  public selectedRutaId: number | null = null;

  public mapaVisible = false;
  public mapRoutes: MapRoute[] = [];
  public mapMarkers: MapMarker[] = [];
  public mapCenter: google.maps.LatLngLiteral = { lat: 20.9754, lng: -89.6169 };
  public mapZoom = 12;

  ngOnInit(): void {
    this.loadRecorridos();
    this.filterControl.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged())
      .subscribe((valorFiltro) => {
        this.applyFilter(valorFiltro);
      });
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadRecorridos(): void {
    this.recorridoService.getRecorridos().subscribe({
      next: (data) => {
        const recorridosConNumeros: GeoRecorrido[] = data.map((rec) => ({
          ...rec,
          latitud:
            typeof rec.latitud === 'string'
              ? parseFloat(rec.latitud)
              : rec.latitud,
          longitud:
            typeof rec.longitud === 'string'
              ? parseFloat(rec.longitud)
              : rec.longitud,
        }));
        this.todosLosRecorridos = recorridosConNumeros;
        this.applyFilter(''); // Carga inicial
      },
      error: (err) => this.showError('Error al cargar los registros.'),
    });
  }

  applyFilter(filterValue: string): void {
    this.selectedRutaId = null; // Limpia la selección de RUTA
    const normalizedFilter = filterValue.trim().toLowerCase();

    const filteredData = this.todosLosRecorridos.filter((recorrido) => {
      const formattedDate =
        this.datePipe.transform(recorrido.fechaHora, 'dd/MM/yyyy') || '';
      const dataStr = (
        recorrido.idRecorrido.toString() +
        recorrido.idRuta.toString() +
        formattedDate
      ).toLowerCase();
      return dataStr.includes(normalizedFilter);
    });

    this.dataSource.data = filteredData;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
    this.actualizarDatosDelMapa(); // Actualiza el mapa con los datos filtrados de la tabla
  }

  clearFilter(): void {
    this.filterControl.setValue('');
  }

  // --- CAMBIO DE NOMBRE Y LÓGICA: Ahora seleccionamos una RUTA completa ---
  seleccionarRuta(recorridoSeleccionado: GeoRecorrido): void {
    if (this.selectedRutaId === recorridoSeleccionado.idRuta) {
      this.selectedRutaId = null; // Permite deseleccionar si se hace clic en la misma ruta
    } else {
      this.selectedRutaId = recorridoSeleccionado.idRuta;
    }
    this.actualizarDatosDelMapa(); // Redibuja el mapa para resaltar la nueva selección
    this.enfocarMapaInteligentemente();
    if (!this.mapaVisible) {
      this.toggleMapa();
    }
  }

  toggleMapa(): void {
    this.mapaVisible = !this.mapaVisible;
    if (this.mapaVisible) {
      setTimeout(() => {
        const googleMapInstance = this.appMapComponent?.map?.googleMap;
        if (googleMapInstance) {
          google.maps.event.trigger(googleMapInstance, 'resize');
          this.enfocarMapaInteligentemente();
        }
      }, 100);
    }
  }

  private enfocarMapaInteligentemente(): void {
    const googleMap = this.appMapComponent?.map;
    if (!googleMap) return;

    // Decide si enfocar una ruta específica o todas las visibles
    const puntosAEnfocar = this.selectedRutaId
      ? this.todosLosRecorridos.filter((p) => p.idRuta === this.selectedRutaId)
      : this.dataSource.data;

    if (puntosAEnfocar.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    puntosAEnfocar.forEach((punto) =>
      bounds.extend({ lat: punto.latitud, lng: punto.longitud })
    );
    if (!bounds.isEmpty()) {
      googleMap.fitBounds(bounds, 50);
    }
  }

  // --- CAMBIO RADICAL EN LA LÓGICA DE AGRUPACIÓN ---
  private actualizarDatosDelMapa(): void {
    // Los datos a dibujar son siempre los que están visibles en la tabla
    const recorridosVisibles = this.dataSource.data;
    if (!recorridosVisibles) {
      this.mapRoutes = [];
      this.mapMarkers = [];
      return;
    }

    // 1. Agrupar por idRuta
    const rutasAgrupadas = recorridosVisibles.reduce((acc, punto) => {
      (acc[punto.idRuta] = acc[punto.idRuta] || []).push(punto);
      return acc;
    }, {} as { [key: number]: GeoRecorrido[] });

    // 2. Crear las polilíneas
    const nuevasRutas: MapRoute[] = Object.entries(rutasAgrupadas).map(
      ([idRuta, puntosDeLaRuta]) => {
        const idRutaNum = Number(idRuta);
        const esSeleccionada = this.selectedRutaId === idRutaNum;

        return {
          idRecorrido: idRutaNum, // Usamos el id de ruta para el tracking
          path: puntosDeLaRuta
            .sort(
              (a, b) =>
                new Date(a.fechaHora).getTime() -
                new Date(b.fechaHora).getTime()
            )
            .map((p) => ({ lat: p.latitud, lng: p.longitud })),
          options: {
            strokeColor: esSeleccionada ? '#FF0000' : '#1E90FF',
            strokeOpacity: esSeleccionada ? 1.0 : 0.7,
            strokeWeight: esSeleccionada ? 8 : 4,
            zIndex: esSeleccionada ? 999 : 1,
          },
        };
      }
    );
    this.mapRoutes = nuevasRutas;

    // 3. Crear los marcadores solo para la ruta seleccionada
    const nuevosMarcadores: MapMarker[] = [];
    if (this.selectedRutaId) {
      const rutaSeleccionada = this.mapRoutes.find(
        (r) => r.idRecorrido === this.selectedRutaId
      );
      if (rutaSeleccionada?.path.length) {
        nuevosMarcadores.push({
          position: rutaSeleccionada.path[0],
          options: {
            label: { text: 'I', color: 'white' },
            icon: {
              url: 'http://maps.google.com/mapfiles/ms/icons/green-dot.png',
            },
          },
        });
        if (rutaSeleccionada.path.length > 1) {
          nuevosMarcadores.push({
            position: rutaSeleccionada.path[rutaSeleccionada.path.length - 1],
            options: {
              label: { text: 'F', color: 'white' },
              icon: {
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              },
            },
          });
        }
      }
    }
    this.mapMarkers = nuevosMarcadores;
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-error'],
    });
  }
}
