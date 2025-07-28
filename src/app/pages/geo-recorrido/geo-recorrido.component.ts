// src/app/pages/geo-recorrido/geo-recorrido.component.ts

import {
  Component,
  OnInit,
  inject,
  ViewChild,
  AfterViewInit,
} from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // La importación de la clase está bien aquí
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

import { GeoRecorrido } from '../../interfaces/geo-recorrido';
import { GeoRecorridoService } from '../../services/geo-recorrido/geo-recorrido.service';
import { debounceTime, startWith } from 'rxjs';

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
    // === CAMBIO 1: Se elimina DatePipe de aquí ===
    MatPaginatorModule,
    MatSortModule,
  ],
  // === CAMBIO 2: Se añade el array 'providers' para DatePipe ===
  providers: [DatePipe],
  templateUrl: './geo-recorrido.component.html',
  styleUrl: './geo-recorrido.component.css',
})
export class GeoRecorridoComponent implements OnInit, AfterViewInit {
  private recorridoService = inject(GeoRecorridoService);
  private snackBar = inject(MatSnackBar);
  // La inyección de DatePipe ahora funcionará porque está en 'providers'
  private datePipe = inject(DatePipe);

  filterControl = new FormControl('');

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

  constructor() {}

  ngOnInit(): void {
    this.loadRecorridos();
    this.setupFilterPredicate();

    this.filterControl.valueChanges
      .pipe(startWith(''), debounceTime(300))
      .subscribe((value) => {
        this.dataSource.filter = (value || '').trim().toLowerCase();
      });
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

  setupFilterPredicate(): void {
    this.dataSource.filterPredicate = (
      data: GeoRecorrido,
      filter: string
    ): boolean => {
      const formattedDate =
        this.datePipe.transform(data.fechaHora, 'dd/MM/yyyy') || '';
      const dataStr = (
        data.idRecorrido.toString() +
        data.idRuta.toString() +
        formattedDate
      ).toLowerCase();
      return dataStr.includes(filter);
    };
  }

  clearFilter(): void {
    this.filterControl.setValue('');
  }

  private showError(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3000,
      panelClass: ['snackbar-error'],
    });
  }
}
