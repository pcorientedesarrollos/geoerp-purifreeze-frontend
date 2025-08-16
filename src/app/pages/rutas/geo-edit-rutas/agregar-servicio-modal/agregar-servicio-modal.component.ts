import { Component, OnInit, ViewChild, signal, ChangeDetectionStrategy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, lastValueFrom } from 'rxjs';
import { SelectionModel } from '@angular/cdk/collections';

// Angular Material
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

// Servicios e Interfaces
import { ServicioDisponible } from '../../../../interfaces/geo-rutas-detalle';
import { GeoRutasDetalleService } from '../../../../services/geo_rutasDetalle/geo-rutas-detalles.service';

@Component({
  selector: 'app-agregar-servicio-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatTableModule, MatCheckboxModule,
    MatButtonModule, MatProgressSpinnerModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatIconModule
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h2 mat-dialog-title>Agregar Servicios a la Ruta</h2>
    <mat-dialog-content>
      @if (isLoading()) {
        <div class="loading-container">
          <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
        </div>
      } @else {
        <div>
          <mat-form-field appearance="outline" style="width: 100%;">
            <mat-label>Buscar servicios...</mat-label>
            <input matInput [formControl]="filterControl" placeholder="Ej: Cliente, equipo...">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <div class="table-container mat-elevation-z4">
            <table mat-table [dataSource]="dataSource">
              <ng-container matColumnDef="select">
                <th mat-header-cell *matHeaderCellDef>
                  <mat-checkbox (change)="$event ? toggleAllRows() : null"
                                [checked]="selection.hasValue() && isAllSelected()"
                                [indeterminate]="selection.hasValue() && !isAllSelected()"></mat-checkbox>
                </th>
                <td mat-cell *matCellDef="let row">
                  <mat-checkbox (click)="$event.stopPropagation()"
                                (change)="$event ? selection.toggle(row) : null"
                                [checked]="selection.isSelected(row)"></mat-checkbox>
                </td>
              </ng-container>
              <ng-container matColumnDef="nombreComercio"><th mat-header-cell *matHeaderCellDef>Cliente</th><td mat-cell *matCellDef="let element">{{ element.nombreComercio }}</td></ng-container>
              <ng-container matColumnDef="nombreEquipo"><th mat-header-cell *matHeaderCellDef>Equipo</th><td mat-cell *matCellDef="let element">{{ element.nombreEquipo }}</td></ng-container>
              <ng-container matColumnDef="tipoServicio"><th mat-header-cell *matHeaderCellDef>Tipo Servicio</th><td mat-cell *matCellDef="let element">{{ element.tipoServicio }}</td></ng-container>
              <tr mat-header-row *matHeader-rowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
            <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons></mat-paginator>
          </div>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="selection.selected" [disabled]="selection.isEmpty()">
        Agregar ({{ selection.selected.length }})
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
    .loading-container { display: flex; justify-content: center; align-items: center; padding: 2rem; min-height: 300px; }
    .table-container { overflow: auto; max-height: 60vh; }
    h2[mat-dialog-title] { border-bottom: 1px solid rgba(0,0,0,0.12); padding-bottom: 1rem; }
    mat-dialog-actions { border-top: 1px solid rgba(0,0,0,0.12); padding-top: 1rem; margin-top: 1rem; }
    `
  ]
})
export class AgregarServicioModalComponent implements OnInit {
  // --- INYECCIÓN DE DEPENDENCIAS MODERNA ---
  private detalleService = inject(GeoRutasDetalleService);
  public dialogRef = inject(MatDialogRef<AgregarServicioModalComponent>);
  public data: { serviciosActualesIds: number[] } = inject(MAT_DIALOG_DATA);

  // --- GESTIÓN DE ESTADO CON SIGNALS ---
  public isLoading = signal(true);
  private servicios = signal<ServicioDisponible[]>([]);

  public dataSource = new MatTableDataSource<ServicioDisponible>();
  public selection = new SelectionModel<ServicioDisponible>(true, []);
  public displayedColumns = ['select', 'nombreComercio', 'nombreEquipo', 'tipoServicio'];
  public filterControl = new FormControl('');

  // --- MEJORA: Uso de setters para Paginator ---
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    if (paginator) {
      this.dataSource.paginator = paginator;
    }
  }

  constructor() {
    // --- MEJORA: `takeUntilDestroyed` para manejo automático de subscripciones ---
    this.filterControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntilDestroyed()
    ).subscribe(value => {
      this.applyFilter(value || '');
    });

    // --- MEJORA: `effect` para sincronizar el estado reactivo con la tabla ---
    effect(() => {
      this.dataSource.data = this.servicios();
    });
  }

  ngOnInit(): void {
    this.cargarServiciosDisponibles();
  }
  
  async cargarServiciosDisponibles(): Promise<void> {
    this.isLoading.set(true);
    try {
      const todosLosServicios = await lastValueFrom(this.detalleService.findServiciosDisponiblesParaRuta());
      const serviciosFiltrados = todosLosServicios.filter(s => !this.data.serviciosActualesIds.includes(s.idServicioEquipo));
      this.servicios.set(serviciosFiltrados);
    } catch (error) {
      console.error("Error al cargar servicios disponibles", error);
      // Aquí podrías mostrar un snackbar de error
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

  isAllSelected(): boolean {
    return this.selection.selected.length === this.dataSource.filteredData.length;
  }

  toggleAllRows(): void {
    this.isAllSelected()
      ? this.selection.clear()
      : this.selection.select(...this.dataSource.filteredData);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}