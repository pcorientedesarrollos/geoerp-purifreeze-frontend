// RUTA: src/app/pages/dashboard/dashboard.component.ts (Versión Final Corregida y Completa)

import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MapsComponent, MapMarker } from '../../components/maps/maps.component';

import { forkJoin } from 'rxjs';
import {
  DashboardService,
  LiveLocation,
} from '../../services/dashboard/dashboard.service';

declare var google: any;

interface Month {
  value: number;
  name: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MapsComponent,
    MatButtonModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);

  public isLoading = true;

  public dashboardCards = [
    {
      title: 'Vehículos en Ruta',
      value: '0',
      icon: 'local_shipping',
      color: '#2196F3',
    },
    {
      title: 'Distancia Total Recorrida',
      value: '0 km',
      icon: 'timeline',
      color: '#4CAF50',
    },
    // {
    //   title: 'Alertas Recientes', DESCOMENTAR PARA AGREGAR
    //   value: '0',
    //   icon: 'warning',
    //   color: '#FFC107',
    // },
    // {
    //   title: 'Próximo Mantenimiento',
    //   value: 'N/A',
    //   icon: 'build',
    //   color: '#9E9E9E',
    // },
  ];

  public selectedMonth!: number;
  public selectedYear!: number;
  public months: Month[] = [];
  public years: number[] = [];
  public filterTitle: string = 'Datos de Hoy';

  public mapMarkers: MapMarker[] = [];
  public mapCenter: google.maps.LatLngLiteral = { lat: 20.9754, lng: -89.6169 };
  public mapZoom = 11;

  ngOnInit(): void {
    this.initializeFiltersAndLoadData();
  }

  initializeFiltersAndLoadData(): void {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();

    this.months = [
      { value: 1, name: 'Enero' },
      { value: 2, name: 'Febrero' },
      { value: 3, name: 'Marzo' },
      { value: 4, name: 'Abril' },
      { value: 5, name: 'Mayo' },
      { value: 6, name: 'Junio' },
      { value: 7, name: 'Julio' },
      { value: 8, name: 'Agosto' },
      { value: 9, name: 'Septiembre' },
      { value: 10, name: 'Octubre' },
      { value: 11, name: 'Noviembre' },
      { value: 12, name: 'Diciembre' },
    ];
    this.years = Array.from({ length: 5 }, (_, i) => this.selectedYear - i);

    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.updateFilterTitle();

    forkJoin({
      stats: this.dashboardService.getStats(
        this.selectedMonth,
        this.selectedYear
      ),
      locations: this.dashboardService.getLiveLocations(),
    }).subscribe({
      next: ({ stats, locations }) => {
        this.dashboardCards[0].value = stats.vehiculosEnRuta.toString();
        this.dashboardCards[1].value = `${stats.distanciaTotal} km`;

        this.updateMapMarkers(locations);

        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar los datos del dashboard:', err);
        this.isLoading = false;
      },
    });
  }

  onFilterChange(): void {
    this.isLoading = true;
    this.updateFilterTitle();

    this.dashboardService
      .getStats(this.selectedMonth, this.selectedYear)
      .subscribe({
        next: (stats) => {
          this.dashboardCards[1].value = `${stats.distanciaTotal} km`;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error al cargar estadísticas por filtro:', err);
          this.isLoading = false;
        },
      });
  }

  clearFilters(): void {
    const now = new Date();
    this.selectedMonth = now.getMonth() + 1;
    this.selectedYear = now.getFullYear();
    this.filterTitle = 'Datos de Hoy';
    this.onFilterChange();
  }

  // ====================== CORRECCIÓN APLICADA AQUÍ ======================
  private updateMapMarkers(locations: LiveLocation[] | null): void {
    // 1. AÑADIMOS ESTA GUARDA: Si `locations` es null o undefined,
    // simplemente asignamos un array vacío y salimos de la función.
    if (!locations) {
      this.mapMarkers = [];
      return;
    }

    // 2. Si llegamos aquí, es 100% seguro que `locations` es un array,
    // por lo que podemos usar .map() sin riesgo.
    this.mapMarkers = locations.map((loc) => ({
      position: {
        lat: parseFloat(loc.latitud),
        lng: parseFloat(loc.longitud),
      },
      options: {
        title: `${loc.nombreUnidad}\nÚltima act: ${new Date(
          loc.ultimaActualizacion
        ).toLocaleTimeString()}`,
        icon: {
          path: 'M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h6.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z',
          fillColor: '#EA4335',
          fillOpacity: 1,
          strokeWeight: 1,
          strokeColor: '#FFFFFF',
          scale: 1.4,
          anchor: new google.maps.Point(12, 12),
        },
      },
    }));

    if (this.mapMarkers.length > 0) {
      this.mapCenter = this.mapMarkers[0].position;
      this.mapZoom = 13;
    }
  }

  private updateFilterTitle(): void {
    if (this.selectedMonth && this.selectedYear) {
      const monthName = this.months.find(
        (m) => m.value === this.selectedMonth
      )?.name;
      this.filterTitle = `Datos de ${monthName} ${this.selectedYear}`;
    } else {
      this.filterTitle = 'Datos Acumulados';
    }
  }
}
