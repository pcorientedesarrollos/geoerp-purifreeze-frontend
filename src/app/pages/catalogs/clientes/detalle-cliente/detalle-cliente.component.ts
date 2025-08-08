// Contenido para reemplazar completamente este archivo
import { Component, Input, OnInit, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

// Asegúrate que la ruta a tu interfaz es correcta. Yo usaré la que me diste.
import { Servicio } from '../../../../interfaces/geo_servicios';

@Component({
  // ===== CORRECCIÓN 1: Unificamos el selector con el nombre del componente =====
  selector: 'app-detalle-cliente',
  standalone: true,
  imports: [
    CommonModule, DatePipe, MatTableModule, MatPaginatorModule,
    MatSortModule, MatFormFieldModule, MatInputModule, MatIconModule
  ],
  templateUrl: './detalle-cliente.component.html',
  styleUrl: './detalle-cliente.component.css'
})
export class DetalleClienteComponent implements OnInit, AfterViewInit, OnChanges {
  // El resto de tu lógica aquí está PERFECTA y no necesita cambios.
  @Input() servicios: Servicio[] = [];
  displayedColumns: string[] = ['fechaServicio', 'tipo_servicio', 'nombreEquipo', 'NoSerie', 'status', 'descripcion'];
  dataSource: MatTableDataSource<Servicio>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.dataSource = new MatTableDataSource<Servicio>([]);
  }

  ngOnInit(): void {
    this.dataSource.data = this.servicios;
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

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}