import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

// Importaciones de Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// Importaciones de tus servicios e interfaces
import { GeoClientesDireccionService } from '../../../services/geo_direccionClientes/geo-clientes-direccion.service';
import { GeoCliente } from '../../../interfaces/geo_clientes';
import { GeoClientesService } from '../../../services/geo_clientes/geo-clientes.service';

// Creamos una nueva interfaz para manejar los datos combinados fácilmente
export interface ClienteDisplayData {
  idDireccion: number;
  idCliente: number;
  direccion: string;
  nombreSucursal: string;
  razon_social?: string;
  nombreComercial?: string;
}

@Component({
  selector: 'app-clientes',
  standalone: true, // Declaramos el componente como Standalone
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
})
export class ClientesComponent implements OnInit {
  // Columnas que se mostrarán en la tabla. 'acciones' es para los botones de editar/eliminar
  displayedColumns: string[] = [
    'razon_social',
    'direccion',
    'nombreSucursal',
    'acciones',
  ];

  // Aquí guardaremos la lista de clientes combinada para mostrarla en la tabla
  dataSource: ClienteDisplayData[] = [];

  constructor(
    private geoClientesService: GeoClientesService,
    private geoClientesDireccionService: GeoClientesDireccionService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    // Usamos forkJoin para ejecutar ambas llamadas a la API en paralelo
    forkJoin({
      clientes: this.geoClientesService.getClientes(),
      direcciones: this.geoClientesDireccionService.getClientesDireccion(),
    }).subscribe({
      next: (data) => {
        // Creamos un mapa de clientes para una búsqueda eficiente por ID
        const clientesMap = new Map<number, GeoCliente>(
          data.clientes.map((cliente) => [cliente.idcliente, cliente])
        );

        // Combinamos los datos de direcciones con los datos de clientes
        this.dataSource = data.direcciones.map((direccion) => {
          const clienteInfo = clientesMap.get(direccion.idCliente);
          return {
            ...direccion,
            razon_social: clienteInfo?.razon_social,
            nombreComercial: clienteInfo?.nombreComercio,
          };
        });
      },
      error: (err) => {
        console.error('Error al cargar los datos', err);
        // Aquí podrías mostrar un mensaje de error al usuario
      },
    });
  }

  // --- Funciones CRUD (a implementar la lógica de diálogo/formulario) ---

  agregarCliente(): void {
    console.log('Abrir diálogo para agregar nuevo cliente...');
    // Aquí implementarías la lógica para abrir un mat-dialog o navegar a un formulario
  }

  editarCliente(cliente: ClienteDisplayData): void {
    console.log('Editando cliente:', cliente);
    // Lógica para abrir un diálogo de edición, pasando los datos del cliente
  }

  eliminarCliente(cliente: ClienteDisplayData): void {
    console.log('Eliminando cliente:', cliente);
    // Lógica para mostrar un diálogo de confirmación antes de llamar al servicio de eliminación
    // this.geoClientesDireccionService.deleteClienteDireccion(cliente.idDireccion).subscribe(...);
  }
}
