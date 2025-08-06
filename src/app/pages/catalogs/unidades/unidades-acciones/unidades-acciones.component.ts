import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

// Angular Material
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { GeoUnidadTransportesService } from '../../../../services/geo_unidadTransportes/geo-unidad-transportes.service';
import { GeoUnidadTransporte } from '../../../../interfaces/geo_unidad-transportes';

@Component({
  selector: 'app-unidades-acciones',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSlideToggleModule,
    MatProgressSpinnerModule, MatIconModule
  ],
  templateUrl: './unidades-acciones.component.html',
  styleUrls: ['./unidades-acciones.component.css']
})
export class UnidadesAccionesComponent implements OnInit {

  private fb = inject(FormBuilder);
  private unidadService = inject(GeoUnidadTransportesService);

  form!: FormGroup;
  isEditMode: boolean;
  isSaving = false;

  constructor(
    public dialogRef: MatDialogRef<UnidadesAccionesComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { unidad: GeoUnidadTransporte }
  ) {
    this.isEditMode = !!this.data.unidad;
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      idUnidadTransporte: [this.data.unidad?.idUnidadTransporte],
      nombreUnidad: [this.data.unidad?.nombreUnidad || '', Validators.required],
      placaUnidad: [this.data.unidad?.placaUnidad || '', Validators.required],
      nivUnidad: [this.data.unidad?.nivUnidad || '', Validators.required],
      marcaUnidad: [this.data.unidad?.marcaUnidad || '', Validators.required],
      modeloUnidad: [this.data.unidad?.modeloUnidad || '', Validators.required],
      unidadActiva: [this.data.unidad ? !!this.data.unidad.unidadActiva : true, Validators.required],
      idTipoUnidad: [this.data.unidad?.idTipoUnidad || 1, Validators.required],
      activo: [this.data.unidad ? !!this.data.unidad.activo : true],
    });
  }
  
  onSave(): void {
    if (this.form.invalid || this.isSaving) {
      this.form.markAllAsTouched();
      return;
    }
    this.isSaving = true;
    
    const formValue = this.form.getRawValue();
    formValue.unidadActiva = formValue.unidadActiva ? 1 : 0;
    
    const id = formValue.idUnidadTransporte;
    delete formValue.idUnidadTransporte;
    
    let request: Observable<any>;

    if (this.isEditMode) {
      request = this.unidadService.updateUnidadTransporte(id, formValue);
    } else {
      request = this.unidadService.createUnidadTransporte(formValue);
    }

    request.subscribe({
      next: (unidadGuardada) => {
        // --- CAMBIO ---
        // Al cerrar, devolvemos la unidad que nos retornó el API.
        // Si es una edición, el backend debe retornar el objeto completo actualizado.
        // Si es una creación, el backend debe retornar el objeto nuevo con su ID.
        if (this.isEditMode) {
            // Para el modo edición, el servicio de update debería devolver la entidad actualizada
            // Aquí le reasignamos el ID para que el componente padre pueda encontrarla.
            unidadGuardada = { ...this.form.value, idUnidadTransporte: id };
        }
        this.dialogRef.close(unidadGuardada);
      },
      error: (err: any) => { 
        console.error("Error al guardar la unidad", err);
        this.isSaving = false;
      }
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}