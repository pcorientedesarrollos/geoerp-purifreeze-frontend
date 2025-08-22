// src/app/components/servicios/servicios.component.ts

import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Tus dependencias
import { Servicio } from '../../interfaces/geo_servicios';
import { GeoServiciosService } from '../../services/geo_servicios/geo-servicios.service';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.css']
})
export class ServiciosComponent implements OnInit {

  private geoServiciosService = inject(GeoServiciosService);

  // --- SIGNALS PARA EL ESTADO ---
  public todosLosServicios = signal<Servicio[]>([]);
  public isLoading = signal<boolean>(true);
  public error = signal<string | null>(null);
  
  // --- SIGNALS PARA LOS FILTROS ---
  public terminoBusqueda = signal<string>('');
  public fechaInicio = signal<string>('');
  public fechaFin = signal<string>('');

  // --- COMPUTED SIGNAL PARA EL FILTRADO AUTOMÁTICO ---
  public serviciosFiltrados = computed(() => {
    let servicios = this.todosLosServicios();
    const termino = this.terminoBusqueda().toLowerCase();
    const inicio = this.fechaInicio();
    const fin = this.fechaFin();

    // 1. Filtrado por texto general
    if (termino) {
      servicios = servicios.filter(s =>
        (s.idServicioEquipo?.toString().includes(termino)) ||
        (s.nombreComercio?.toLowerCase().includes(termino)) ||
        (s.NoSerie?.toLowerCase().includes(termino)) ||
        (s.status?.toLowerCase().includes(termino))
      );
    }

    // 2. Filtrado por rango de fechas
    if (inicio || fin) {
      const fechaInicioMs = inicio ? new Date(inicio).getTime() : 0;
      const fechaFinMs = fin ? new Date(fin).getTime() + (24 * 60 * 60 * 1000 - 1) : Infinity;

      servicios = servicios.filter(s => {
        const fechaServicioMs = new Date(s.fechaServicio).getTime();
        return fechaServicioMs >= fechaInicioMs && fechaServicioMs <= fechaFinMs;
      });
    }
    return servicios;
  });

  ngOnInit(): void {
    // Para el ejemplo, usamos un ID de cliente fijo. Cámbialo según sea necesario.
    const idClienteEjemplo = 1;
    this.cargarServicios(idClienteEjemplo);
  }
  
  cargarServicios(idCliente: number): void {
    this.isLoading.set(true);
    this.geoServiciosService.getServiciosPorCliente(idCliente).subscribe({
      next: (data) => {
        this.todosLosServicios.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set('No se pudieron cargar los servicios.');
        this.isLoading.set(false);
        console.error(err);
      }
    });
  }

  resetearFiltros(): void {
    this.terminoBusqueda.set('');
    this.fechaInicio.set('');
    this.fechaFin.set('');
  }
}