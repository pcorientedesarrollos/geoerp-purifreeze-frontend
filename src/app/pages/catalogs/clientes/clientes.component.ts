import { Component, OnInit, ViewChild, AfterViewInit, signal, ChangeDetectionStrategy, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin, lastValueFrom } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Angular Material
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule, MatSpinner } from '@angular/material/progress-spinner';

// Componentes y Servicios
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
    MatProgressSpinnerModule, DetalleClienteComponent, MatCardModule,
    MatFormFieldModule, MatInputModule, MatPaginatorModule, MatSortModule,
    ReactiveFormsModule, MatSpinner
  ],
  templateUrl: './clientes.component.html',
  styleUrls: ['./clientes.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('detailExpand', [
      state('collapsed,void', style({ height: '0px', minHeight: '0', visibility: 'hidden' })),
      state('expanded', style({ height: '*', visibility: 'visible' })),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ClientesComponent implements OnInit {
  private geoClientesService = inject(GeoClientesService);
  private geoClientesDireccionService = inject(GeoClientesDireccionService);
  private serviciosService = inject(GeoServiciosService);

  public isLoading = signal(true);
  public clientes = signal<ClienteDisplayData[]>([]);
  public expandedElement = signal<ClienteDisplayData | null>(null);
  
  public displayedColumns: string[] = ['expand', 'nombreComercio', 'razon_social', 'direccion', 'nombreSucursal', 'acciones'];
  public dataSource = new MatTableDataSource<ClienteDisplayData>();
  public filterControl = new FormControl('');

  // --- CORRECCIÓN 1: Usar setters para Paginator y Sort ---
  // Esta función se ejecutará tan pronto como el paginador esté disponible en el DOM.
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    if (paginator) {
      this.dataSource.paginator = paginator;
    }
  }

  @ViewChild(MatSort) set sort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
    }
  }

  constructor() {
    this.filterControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(value => {
      this.applyFilter(value || '');
    });

    effect(() => {
      this.dataSource.data = this.clientes();
    });

    // --- CORRECCIÓN 2: Mover el filterPredicate al constructor ---
    // Solo necesita definirse una vez y no depende de la vista.
    this.dataSource.filterPredicate = (data: ClienteDisplayData, filter: string) => {
      const dataStr = (
        (data.nombreComercio || '') +
        (data.razon_social || '') +
        (data.direccion || '') +
        (data.nombreSucursal || '')
      ).toLowerCase();
      return dataStr.includes(filter);
    };
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  // ngAfterViewInit ya no es necesario para asignar el paginador y el sort.
  
  async cargarDatos(): Promise<void> {
    this.isLoading.set(true);
    try {
      const { clientes, direcciones } = await lastValueFrom(forkJoin({
        clientes: this.geoClientesService.getClientes(),
        direcciones: this.geoClientesDireccionService.getClientesDireccion(),
      }));
      
      const clientesMap = new Map<number, GeoCliente>(clientes.map(cliente => [cliente.idcliente, cliente]));
      const displayData = direcciones.map((direccion) => ({
        ...direccion,
        razon_social: clientesMap.get(direccion.idCliente)?.razon_social,
        nombreComercio: clientesMap.get(direccion.idCliente)?.nombreComercio,
      }));
      
      this.clientes.set(displayData);
    } catch (err) {
      console.error('Error al cargar los datos de clientes', err);
    } finally {
      this.isLoading.set(false);
    }
  }
  
  applyFilter(filterValue: string) {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async toggleRow(element: ClienteDisplayData): Promise<void> {
    const isExpanding = this.expandedElement() !== element;
    this.expandedElement.set(isExpanding ? element : null);

    if (isExpanding && !element.servicios) {
      this.clientes.update(clientes => 
        clientes.map(c => c.idDireccion === element.idDireccion ? { ...c, serviciosLoading: true } : c)
      );
      
      try {
        const servicios = await lastValueFrom(this.serviciosService.getServiciosPorCliente(element.idCliente));
        this.clientes.update(clientes =>
          clientes.map(c => c.idDireccion === element.idDireccion ? { ...c, servicios, serviciosLoading: false } : c)
        );
      } catch (error) {
        console.error("Error al cargar servicios", error);
        this.clientes.update(clientes =>
          clientes.map(c => c.idDireccion === element.idDireccion ? { ...c, serviciosLoading: false } : c)
        );
      }
    }
  }

  agregarCliente(): void { console.log('Abrir diálogo para agregar nuevo cliente...'); }
  editarCliente(cliente: ClienteDisplayData): void { console.log('Editando cliente:', cliente.idDireccion); }
}