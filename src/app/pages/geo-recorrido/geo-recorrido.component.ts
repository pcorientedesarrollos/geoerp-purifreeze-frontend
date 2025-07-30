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

  // Se inicializa con `nonNullable` para evitar problemas con valores nulos
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

  mapaVisible = false;
  mapRoutes: MapRoute[] = [];
  mapMarkers: MapMarker[] = [];
  public selectedRecorridoId: number | null = null;
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
        // Se asegura que latitud y longitud sean números (esto está correcto)
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
        // Se llama a applyFilter para que sea el único que establece los datos iniciales
        this.applyFilter('');
      },
      error: (err) => this.showError('Error al cargar los registros.'),
    });
  }

  applyFilter(filterValue: string): void {
    this.selectedRecorridoId = null; // Siempre se limpia la selección al filtrar
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
    this.actualizarDatosDelMapa(filteredData);
  }

  clearFilter(): void {
    this.filterControl.setValue('');
  }

  seleccionarRecorrido(recorrido: GeoRecorrido): void {
    if (this.selectedRecorridoId === recorrido.idRecorrido) {
      this.selectedRecorridoId = null; // Permite deseleccionar
    } else {
      this.selectedRecorridoId = recorrido.idRecorrido;
    }

    // Siempre se actualiza el mapa para reflejar el cambio de estilo
    this.actualizarDatosDelMapa(this.dataSource.data);

    // Se enfoca el mapa después de que los datos se han actualizado
    if (this.selectedRecorridoId) {
      this.enfocarEnRecorridoSeleccionado(this.selectedRecorridoId);
    } else {
      this.enfocarMapaGeneral();
    }

    // Se muestra el mapa si estaba oculto
    if (!this.mapaVisible) {
      this.toggleMapa();
    }
  }

  toggleMapa(): void {
    this.mapaVisible = !this.mapaVisible;
    if (this.mapaVisible) {
      // Se le da tiempo al mapa a aparecer antes de redibujar
      setTimeout(() => {
        const googleMapInstance = this.appMapComponent?.map?.googleMap;
        if (googleMapInstance) {
          google.maps.event.trigger(googleMapInstance, 'resize');
          // Al mostrar, se re-enfoca según el estado actual
          if (this.selectedRecorridoId) {
            this.enfocarEnRecorridoSeleccionado(this.selectedRecorridoId);
          } else {
            this.enfocarMapaGeneral();
          }
        }
      }, 100);
    }
  }

  private enfocarEnRecorridoSeleccionado(idRecorrido: number): void {
    const googleMap = this.appMapComponent?.map;
    if (!googleMap) return;
    const puntosDelRecorrido = this.todosLosRecorridos.filter(
      (p) => p.idRecorrido === idRecorrido
    );
    if (puntosDelRecorrido.length < 1) return;
    const bounds = new google.maps.LatLngBounds();
    puntosDelRecorrido.forEach((punto) =>
      bounds.extend({ lat: punto.latitud, lng: punto.longitud })
    );
    googleMap.fitBounds(bounds, 50);
  }

  private enfocarMapaGeneral(): void {
    const googleMap = this.appMapComponent?.map;
    if (!googleMap || this.dataSource.data.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    this.dataSource.data.forEach((punto) =>
      bounds.extend({ lat: punto.latitud, lng: punto.longitud })
    );
    if (!bounds.isEmpty()) {
      googleMap.fitBounds(bounds, 50);
    }
  }

  private actualizarDatosDelMapa(recorridos: GeoRecorrido[]): void {
    if (!recorridos) {
      this.mapRoutes = [];
      this.mapMarkers = [];
      console.log('Rutas generadas para el mapa:', this.mapRoutes);
      return;
    }

    const recorridosAgrupados = recorridos.reduce((acc, punto) => {
      (acc[punto.idRecorrido] = acc[punto.idRecorrido] || []).push(punto);
      return acc;
    }, {} as { [key: number]: GeoRecorrido[] });

    const nuevasRutas: MapRoute[] = [];
    Object.entries(recorridosAgrupados).forEach(([id, grupo]) => {
      const idRecorridoNum = Number(id);
      const esSeleccionada = this.selectedRecorridoId === idRecorridoNum;

      nuevasRutas.push({
        idRecorrido: idRecorridoNum,
        path: grupo
          .sort(
            (a, b) =>
              new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime()
          )
          .map((p) => ({ lat: p.latitud, lng: p.longitud })),
        options: {
          strokeColor: esSeleccionada ? '#FF0000' : '#1E90FF',
          strokeOpacity: esSeleccionada ? 1.0 : 0.7,
          strokeWeight: esSeleccionada ? 8 : 4,
          zIndex: esSeleccionada ? 99 : 1,
        },
      });
    });
    this.mapRoutes = nuevasRutas;

    // Lógica para marcadores separada para mayor claridad
    const nuevosMarcadores: MapMarker[] = [];
    if (this.selectedRecorridoId) {
      const rutaSeleccionada = this.mapRoutes.find(
        (r) => r.idRecorrido === this.selectedRecorridoId
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
