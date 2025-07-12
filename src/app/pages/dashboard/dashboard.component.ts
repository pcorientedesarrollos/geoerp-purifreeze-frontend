import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map, startWith, delay } from 'rxjs/operators';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  public isLoading = true;
  public dashboardCards: any[] = [];
  public filterControl = new FormControl('');
  private allFilterOptions: string[] = [
    'Opción A',
    'Opción B (Azul)',
    'Alternativa C',
  ];
  public filteredOptions$!: Observable<string[]>;

  ngOnInit(): void {
    this.loadDashboardData();
    this.filteredOptions$ = this.filterControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allFilterOptions.filter((option) =>
      option.toLowerCase().includes(filterValue)
    );
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
        color: '#673ab7',
      },
      {
        title: 'Alertas Recientes',
        value: '3',
        icon: 'notifications_active',
        color: '#ff9800',
      },
      {
        title: 'Próximo Mantenimiento',
        value: 'En 5 días',
        icon: 'calendar_month',
        color: '#03a9f4',
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
