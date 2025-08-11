import { Component, OnInit, inject, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectionModel } from '@angular/cdk/collections';
import { lastValueFrom } from 'rxjs';

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
import { ServicioDisponible } from '../../../../interfaces/geo-rutas-detalle';
import { GeoRutasDetalleService } from '../../../../services/geo_rutasDetalle/geo-rutas-detalles.service';

// Servicios e Interfaces

@Component({
  selector: 'app-agregar-servicio-modal',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatTableModule, MatCheckboxModule,
    MatButtonModule, MatProgressSpinnerModule, MatPaginatorModule,
    MatFormFieldModule, MatInputModule, MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Agregar Servicios a la Ruta</h2>
    <mat-dialog-content>
      <div *ngIf="isLoading" class="loading-container">
        <mat-progress-spinner mode="indeterminate"></mat-progress-spinner>
      </div>
      <div *ngIf="!isLoading">
        <mat-form-field appearance="outline" style="width: 100%;">
          <mat-label>Buscar servicios...</mat-label>
          <input matInput (keyup)="applyFilter($event)" placeholder="Ej: Cliente, equipo...">
        </mat-form-field>
        <div class="table-container mat-elevation-z4">
          <table mat-table [dataSource]="dataSource">
            <!-- Select Column -->
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

            <!-- Other Columns -->
            <ng-container matColumnDef="nombreComercio">
              <th mat-header-cell *matHeaderCellDef>Cliente</th>
              <td mat-cell *matCellDef="let element">{{ element.nombreComercio }}</td>
            </ng-container>
            <ng-container matColumnDef="nombreEquipo">
              <th mat-header-cell *matHeaderCellDef>Equipo</th>
              <td mat-cell *matCellDef="let element">{{ element.nombreEquipo }}</td>
            </ng-container>
            <ng-container matColumnDef="tipoServicio">
              <th mat-header-cell *matHeaderCellDef>Tipo Servicio</th>
              <td mat-cell *matCellDef="let element">{{ element.tipoServicio }}</td>
            </ng-container>

            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
          <mat-paginator [pageSizeOptions]="[5, 10, 20]" showFirstLastButtons></mat-paginator>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onNoClick()">Cancelar</button>
      <button mat-raised-button color="primary" [mat-dialog-close]="selection.selected" [disabled]="selection.isEmpty()">
        Agregar ({{ selection.selected.length }})
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `.loading-container { display: flex; justify-content: center; align-items: center; padding: 2rem; }`,
    `.table-container { overflow: auto; max-height: 60vh; }`
  ]
})
export class AgregarServicioModalComponent implements OnInit, AfterViewInit {
  private detalleService = inject(GeoRutasDetalleService);
  public dialogRef = inject(MatDialogRef<AgregarServicioModalComponent>);
  public data: { serviciosActualesIds: number[] } = inject(MAT_DIALOG_DATA);

  dataSource = new MatTableDataSource<ServicioDisponible>();
  selection = new SelectionModel<ServicioDisponible>(true, []);
  displayedColumns = ['select', 'nombreComercio', 'nombreEquipo', 'tipoServicio'];
  isLoading = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  ngOnInit(): void {
    this.cargarServiciosDisponibles();
  }
  
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
  }

  async cargarServiciosDisponibles() {
    this.isLoading = true;
    try {
      const todosLosServicios = await lastValueFrom(this.detalleService.findServiciosDisponiblesParaRuta());
      // Filtramos los servicios que ya están en la ruta actual
      this.dataSource.data = todosLosServicios.filter(s => !this.data.serviciosActualesIds.includes(s.idServicioEquipo));
    } catch (error) {
      console.error("Error al cargar servicios disponibles", error);
    } finally {
      this.isLoading = false;
    }
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  isAllSelected() {
    return this.selection.selected.length === this.dataSource.filteredData.length;
  }

  toggleAllRows() {
    this.isAllSelected() ?
      this.selection.clear() :
      this.selection.select(...this.dataSource.filteredData);
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}