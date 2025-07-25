import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';

// Angular Material
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

// Servicios e Interfaces
import { GeoClientesDireccionService } from '../../../services/geo_direccionClientes/geo-clientes-direccion.service';
import { GeoClientesService } from '../../../services/geo_clientes/geo-clientes.service';
import { GeoCliente } from '../../../interfaces/geo_clientes';
// import { ClienteDisplayData } from '../../../interfaces/cliente-display-data';

export interface ClienteDisplayData {
  idDireccion: number;
  idCliente: number;
  direccion: string;
  nombreSucursal: string;
  razon_social?: string;
  nombreComercio?: string; // CAMBIO CLAVE: Corregido a 'nombreComercio'
}

@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatIconModule, MatButtonModule],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
})
export class ClientesComponent implements OnInit {
  // Este arreglo es el que le dice a la tabla qué columnas buscar en el HTML
  displayedColumns: string[] = [
    'nombreComercio',
    'razon_social',
    'direccion',
    'nombreSucursal',
    'acciones',
  ];

  dataSource: ClienteDisplayData[] = [];

  constructor(
    private geoClientesService: GeoClientesService,
    private geoClientesDireccionService: GeoClientesDireccionService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    forkJoin({
      clientes: this.geoClientesService.getClientes(),
      direcciones: this.geoClientesDireccionService.getClientesDireccion(),
    }).subscribe({
      next: (data) => {
        const clientesMap = new Map<number, GeoCliente>(
          data.clientes.map((cliente) => [cliente.idcliente, cliente])
        );

        this.dataSource = data.direcciones.map((direccion) => {
          const clienteInfo = clientesMap.get(direccion.idCliente);
          return {
            ...direccion,
            razon_social: clienteInfo?.razon_social,
            nombreComercio: clienteInfo?.nombreComercio,
          };
        });
      },
      error: (err) => {
        console.error('Error al cargar los datos', err);
      },
    });
  }

  agregarCliente(): void {
    console.log('Abrir diálogo para agregar nuevo cliente...');
  }

  editarCliente(cliente: ClienteDisplayData): void {
    console.log('Editando cliente:', cliente.idDireccion);
  }

  eliminarCliente(cliente: ClienteDisplayData): void {
    console.log('Eliminando cliente:', cliente.idDireccion);
  }
}
