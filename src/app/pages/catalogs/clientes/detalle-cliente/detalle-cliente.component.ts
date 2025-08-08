// // Contenido para reemplazar completamente este archivo
// import { Component, Input, OnInit, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
// import { CommonModule, DatePipe } from '@angular/common';
// import { MatTableDataSource, MatTableModule } from '@angular/material/table';
// import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
// import { MatSort, MatSortModule } from '@angular/material/sort';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
// import { MatIconModule } from '@angular/material/icon';

// // Asegúrate que la ruta a tu interfaz es correcta. Yo usaré la que me diste.
// import { Servicio } from '../../../../interfaces/geo_servicios';

// @Component({
//   // ===== CORRECCIÓN 1: Unificamos el selector con el nombre del componente =====
//   selector: 'app-detalle-cliente',
//   standalone: true,
//   imports: [
//     CommonModule, DatePipe, MatTableModule, MatPaginatorModule,
//     MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule
//   ],
//   templateUrl: './detalle-cliente.component.html',
//   styleUrl: './detalle-cliente.component.css'
// })
// export class DetalleClienteComponent implements OnInit, AfterViewInit, OnChanges {
//   // El resto de tu lógica aquí está PERFECTA y no necesita cambios.
//   @Input() servicios: Servicio[] = [];
//   displayedColumns: string[] = ['fechaServicio', 'tipo_servicio', 'nombreEquipo', 'NoSerie', 'status', 'descripcion'];
//   dataSource: MatTableDataSource<Servicio>;

//   @ViewChild(MatPaginator) paginator!: MatPaginator;
//   @ViewChild(MatSort) sort!: MatSort;

//   constructor() {
//     this.dataSource = new MatTableDataSource<Servicio>([]);
//   }

//   ngOnInit(): void {
//     this.dataSource.data = this.servicios;
//   }

//   ngOnChanges(changes: SimpleChanges): void {
//     if (changes['servicios'] && changes['servicios'].currentValue) {
//       this.dataSource.data = this.servicios;
//       if (this.dataSource.paginator) {
//         this.dataSource.paginator.firstPage();
//       }
//     }
//   }

//   ngAfterViewInit(): void {
//     this.dataSource.paginator = this.paginator;
//     this.dataSource.sort = this.sort;
//   }

//   applyFilter(event: Event): void {
//     const filterValue = (event.target as HTMLInputElement).value;
//     this.dataSource.filter = filterValue.trim().toLowerCase();
//     if (this.dataSource.paginator) {
//       this.dataSource.paginator.firstPage();
//     }
//   }
// }

import { Component, Input, OnInit, ViewChild, AfterViewInit, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms'; // <<-- AÑADIDO
import { Subscription } from 'rxjs'; // <<-- AÑADIDO
import { debounceTime, distinctUntilChanged } from 'rxjs/operators'; // <<-- AÑADIDO

// Angular Material
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

// Interfaces
import { Servicio } from '../../../../interfaces/geo_servicios';

@Component({
  selector: 'app-detalle-cliente',
  standalone: true,
  imports: [
    CommonModule, DatePipe, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule,
    ReactiveFormsModule // <<-- AÑADIDO
  ],
  templateUrl: './detalle-cliente.component.html',
  styleUrl: './detalle-cliente.component.css'
})
export class DetalleClienteComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy { // <<-- AÑADIDO OnDestroy
  @Input() servicios: Servicio[] = [];
  displayedColumns: string[] = ['fechaServicio', 'tipoServicio', 'nombreEquipo', 'NoSerie', 'status', 'descripcion'];
  dataSource: MatTableDataSource<Servicio>;

  // ---- NUEVA IMPLEMENTACIÓN DEL FILTRO ----
  filterControl = new FormControl('');
  private filterSubscription: Subscription;
  // -----------------------------------------

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.dataSource = new MatTableDataSource<Servicio>([]);
    
    // Suscripción a los cambios del campo de filtro
    this.filterSubscription = this.filterControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => {
      this.applyFilter(value || '');
    });
  }

  ngOnInit(): void {
    this.dataSource.data = this.servicios;
  }
  
  ngOnDestroy(): void {
    // Evita fugas de memoria
    this.filterSubscription.unsubscribe();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['servicios'] && changes['servicios'].currentValue) {
      this.dataSource.data = this.servicios;
      if (this.dataSource.paginator) {
        this.dataSource.paginator.firstPage();
      }
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  // ---- FUNCIÓN DE FILTRO MODIFICADA ----
  applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}