import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { FormsModule } from '@angular/forms'; // <-- CAMBIO: Usaremos FormsModule para ngModel

// Importaciones de Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';

interface Month {
  value: number;
  name: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // <-- CAMBIO: Añadido para [(ngModel)]
    MatFormFieldModule,
    MatSelectModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatInputModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  public isLoading = true;
  public dashboardCards: any[] = [];

  // --- NUEVAS PROPIEDADES PARA LOS FILTROS ---
  public selectedMonth: number | undefined;
  public selectedYear: number | undefined;
  public months: Month[] = [];
  public years: number[] = [];
  // --- FIN DE NUEVAS PROPIEDADES ---

  ngOnInit(): void {
    this.loadDashboardData();
    this.initializeFilters();
  }

  // --- NUEVO MÉTODO PARA INICIALIZAR LOS DATOS DE LOS FILTROS ---
  initializeFilters(): void {
    // Generar lista de meses
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

    // Generar lista de años dinámicamente (del año actual hacia atrás)
    const currentYear = new Date().getFullYear();
    this.years = Array.from({ length: 5 }, (_, i) => currentYear - i); // Últimos 5 años

    // Establecer valores por defecto (opcional)
    this.selectedMonth = new Date().getMonth() + 1;
    this.selectedYear = currentYear;
  }

  // --- NUEVO MÉTODO PARA MANEJAR CAMBIOS EN LOS FILTROS ---
  onFilterChange(): void {
    console.log('Filtrando por:', {
      month: this.selectedMonth,
      year: this.selectedYear,
    });
    // Aquí iría la lógica para volver a cargar los datos de las tarjetas
    // con los nuevos filtros. Por ejemplo: this.loadDashboardData(this.selectedMonth, this.selectedYear);
  }

  loadDashboardData(): void {
    const mockCardData = [
      {
        title: 'Vehículos en Ruta',
        value: '2',
        icon: 'directions_car',
        color: '#2196F3',
      },
      {
        title: 'Distancia Total Hoy',
        value: '124 km',
        icon: 'timeline',
        color: '#2196F3',
      },
      {
        title: 'Alertas Recientes',
        value: '3',
        icon: 'notifications',
        color: '#FF9800',
      },
      {
        title: 'Próximo Mantenimiento',
        value: 'En 5 días',
        icon: 'calendar_today',
        color: '#2196F3',
      },
    ];

    of(mockCardData)
      .pipe(delay(1000))
      .subscribe((data) => {
        this.dashboardCards = data;
        this.isLoading = false;
      });
  }
}
