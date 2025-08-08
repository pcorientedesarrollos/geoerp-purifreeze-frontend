// Contenido para reemplazar completamente el archivo existente
import { Component, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { forkJoin } from 'rxjs';
import { animate, state, style, transition, trigger } from '@angular/animations';

// --- NUEVAS IMPORTACIONES DE ANGULAR MATERIAL ---
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';

// --- IMPORTS EXISTENTES ---
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

// --- NUESTROS COMPONENTES Y SERVICIOS ---
import { DetalleClienteComponent } from './detalle-cliente/detalle-cliente.component';
import { GeoClientesDireccionService } from '../../../services/geo_direccionClientes/geo-clientes-direccion.service';
import { GeoClientesService } from '../../../services/geo_clientes/geo-clientes.service';
import { GeoServiciosService } from '../../../services/geo_servicios/geo-servicios.service';
import { GeoCliente } from '../../../interfaces/geo_clientes';
import { Servicio } from '../../../interfaces/geo_servicios';

export interface ClienteDisplayData {
  idDireccion: number;
  idCliente: number;
  direccion: string;
  nombreSucursal: string;
  razon_social?: string;
  nombreComercio?: string;
  servicios?: Servicio[];
  serviciosLoading?: boolean;
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatIconModule, MatButtonModule,
    MatProgressSpinnerModule, DetalleClienteComponent,
    // --- NUEVOS MÓDULOS AÑADIDOS ---
    MatCardModule, MatFormFieldModule, MatInputModule, MatPaginatorModule, MatSortModule
],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ClientesComponent implements OnInit, AfterViewInit {
  displayedColumns: string[] = ['expand', 'nombreComercio', 'razon_social', 'direccion', 'nombreSucursal', 'acciones'];
  // --- CAMBIO A MATTABLEDATASOURCE ---
  dataSource: MatTableDataSource<ClienteDisplayData>;
  expandedElement: ClienteDisplayData | null = null;
  isLoading = true; // Variable para controlar el spinner principal

  // --- REFERENCIAS A PAGINADOR Y ORDENADOR ---
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private geoClientesService: GeoClientesService,
    private geoClientesDireccionService: GeoClientesDireccionService,
    private serviciosService: GeoServiciosService
  ) {
    this.dataSource = new MatTableDataSource<ClienteDisplayData>([]);
  }

  ngOnInit(): void {
    this.cargarDatos();
  }
  
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  cargarDatos(): void {
    this.isLoading = true;
    forkJoin({
      clientes: this.geoClientesService.getClientes(),
      direcciones: this.geoClientesDireccionService.getClientesDireccion(),
    }).subscribe({
      next: (data) => {
        const clientesMap = new Map<number, GeoCliente>(data.clientes.map(cliente => [cliente.idcliente, cliente]));
        const displayData = data.direcciones.map((direccion) => ({
          ...direccion,
          razon_social: clientesMap.get(direccion.idCliente)?.razon_social,
          nombreComercio: clientesMap.get(direccion.idCliente)?.nombreComercio,
        }));
        this.dataSource.data = displayData; // Asignamos los datos al MatTableDataSource
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error al cargar los datos de clientes', err);
        this.isLoading = false;
      },
    });
  }
  
  // --- NUEVA FUNCIÓN PARA FILTRAR ---
  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  toggleRow(element: ClienteDisplayData): void {
    this.expandedElement = this.expandedElement === element ? null : element;
    if (this.expandedElement && !element.servicios) {
      element.serviciosLoading = true;
      this.serviciosService.getServiciosPorCliente(element.idCliente).subscribe(servicios => {
        element.servicios = servicios;
        element.serviciosLoading = false;
      });
    }
  }

  agregarCliente(): void { console.log('Abrir diálogo para agregar nuevo cliente...'); }
  editarCliente(cliente: ClienteDisplayData): void { console.log('Editando cliente:', cliente.idDireccion); }
  eliminarCliente(cliente: ClienteDisplayData): void { console.log('Eliminando cliente:', cliente.idDireccion); }
}