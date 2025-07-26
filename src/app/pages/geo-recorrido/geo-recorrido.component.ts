// src/app/pages/geo-recorrido/geo-recorrido.component.ts

import {
  Component,
  OnInit,
  inject,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { GeoRecorrido } from '../../interfaces/geo-recorrido';
import { GeoRecorridoService } from '../../services/geo-recorrido/geo-recorrido.service';
import { debounceTime } from 'rxjs';

@Component({
  selector: 'app-geo-recorrido', // Tu selector correcto
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
    DatePipe,
    MatPaginatorModule,
    MatSortModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './geo-recorrido.component.html',
  styleUrl: './geo-recorrido.component.css',
})
// La clase se llama GeoRecorridoComponent, como la tienes tú
export class GeoRecorridoComponent implements OnInit, AfterViewInit {
  private fb = inject(FormBuilder);
  private recorridoService = inject(GeoRecorridoService);
  private snackBar = inject(MatSnackBar);

  filterForm: FormGroup;

  // Se elimina la columna de acciones
  displayedColumns: string[] = [
    'idRecorrido',
    'idRuta',
    'latitud',
    'longitud',
    'fechaHora',
  ];
  dataSource = new MatTableDataSource<GeoRecorrido>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.filterForm = this.fb.group({
      idRecorrido: [''],
      idRuta: [''],
      fecha: [''],
    });
  }

  ngOnInit(): void {
    this.loadRecorridos();
    this.setupFilterPredicate();
    this.setupFilterSubscription();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadRecorridos(): void {
    this.recorridoService.getRecorridos().subscribe({
      next: (data) => {
        this.dataSource.data = data;
      },
      error: (err) => this.showError('Error al cargar los registros.'),
    });
  }

  setupFilterSubscription(): void {
    this.filterForm.valueChanges.pipe(debounceTime(300)).subscribe((values) => {
      this.dataSource.filter = JSON.stringify(values);
    });
  }

  setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (
      data: GeoRecorrido,
      filter: string
    ): boolean => {
      const filters = JSON.parse(filter);
      let match = true;

      if (
        filters.idRecorrido &&
        !data.idRecorrido.toString().includes(filters.idRecorrido)
      ) {
        match = false;
      }
      if (filters.idRuta && !data.idRuta.toString().includes(filters.idRuta)) {
        match = false;
      }
      if (filters.fecha) {
        const itemDate = new Date(data.fechaHora).setHours(0, 0, 0, 0);
        const filterDate = new Date(filters.fecha).setHours(0, 0, 0, 0);
        if (itemDate !== filterDate) {
          match = false;
        }
      }
      return match;
    };
  }

  clearFilters(): void {
    this.filterForm.reset({ idRecorrido: '', idRuta: '', fecha: '' });
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-error'],
    });
  }
}
