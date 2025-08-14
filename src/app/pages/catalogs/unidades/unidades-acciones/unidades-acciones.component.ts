import { Component, OnInit, signal, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { lastValueFrom } from 'rxjs';

// Angular Material
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';

// Servicios e Interfaces
import { GeoUnidadTransportesService } from '../../../../services/geo_unidadTransportes/geo-unidad-transportes.service';
import { GeoUnidadTransporte } from '../../../../interfaces/geo_unidad-transportes';

interface UnidadFormControls {
  idUnidadTransporte: FormControl<number | null>;
  nombreUnidad: FormControl<string | null>;
  placaUnidad: FormControl<string | null>;
  nivUnidad: FormControl<string | null>;
  marcaUnidad: FormControl<string | null>;
  modeloUnidad: FormControl<string | null>;
  unidadActiva: FormControl<boolean | null>;
  idTipoUnidad: FormControl<number | null>;
  activo: FormControl<boolean | null>;
}

@Component({
  selector: 'app-unidades-acciones',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSlideToggleModule,
    MatProgressSpinnerModule, MatIconModule
  ],
  templateUrl: './unidades-acciones.component.html',
  styleUrls: ['./unidades-acciones.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnidadesAccionesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private unidadService = inject(GeoUnidadTransportesService);
  private dialogRef = inject(MatDialogRef<UnidadesAccionesComponent>);
  public data: { unidad?: GeoUnidadTransporte } = inject(MAT_DIALOG_DATA);

  public isSaving = signal(false);
  public isEditMode: boolean;
  public form: FormGroup<UnidadFormControls>;

  constructor() {
    this.isEditMode = !!this.data.unidad;
    
    this.form = this.fb.group({
      idUnidadTransporte: new FormControl(this.data.unidad?.idUnidadTransporte ?? null),
      nombreUnidad: new FormControl(this.data.unidad?.nombreUnidad ?? '', Validators.required),
      placaUnidad: new FormControl(this.data.unidad?.placaUnidad ?? '', Validators.required),
      nivUnidad: new FormControl(this.data.unidad?.nivUnidad ?? '', Validators.required),
      marcaUnidad: new FormControl(this.data.unidad?.marcaUnidad ?? '', Validators.required),
      modeloUnidad: new FormControl(this.data.unidad?.modeloUnidad ?? '', Validators.required),
      unidadActiva: new FormControl(this.data.unidad ? !!this.data.unidad.unidadActiva : true, Validators.required),
      idTipoUnidad: new FormControl(this.data.unidad?.idTipoUnidad ?? 1, Validators.required),
      activo: new FormControl(this.data.unidad ? !!this.data.unidad.activo : true),
    }) as FormGroup<UnidadFormControls>;
  }

  ngOnInit(): void {}
  
  async onSave(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);

    try {
      const formValue = this.form.getRawValue();

      const payload: Partial<GeoUnidadTransporte> = {
        nombreUnidad: formValue.nombreUnidad as string,
        placaUnidad: formValue.placaUnidad as string,
        nivUnidad: formValue.nivUnidad as string,
        marcaUnidad: formValue.marcaUnidad as string,
        modeloUnidad: formValue.modeloUnidad as string,
        idTipoUnidad: formValue.idTipoUnidad as number,
        unidadActiva: formValue.unidadActiva ? 1 : 0,
        // --- CORRECCIÓN: Convertir también 'activo' de boolean a number ---
        activo: formValue.activo ? 1 : 0,
      };
      
      let unidadGuardada: GeoUnidadTransporte;

      if (this.isEditMode) {
        const id = formValue.idUnidadTransporte!;
        unidadGuardada = await lastValueFrom(this.unidadService.updateUnidadTransporte(id, payload));
        
        if (!unidadGuardada) {
          unidadGuardada = { 
            ...(payload as GeoUnidadTransporte),
            idUnidadTransporte: id 
          };
        }
      } else {
        unidadGuardada = await lastValueFrom(this.unidadService.createUnidadTransporte(payload));
      }
      
      this.dialogRef.close(unidadGuardada);

    } catch (err) { 
      console.error("Error al guardar la unidad", err);
    } finally {
      this.isSaving.set(false);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}