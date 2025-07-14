import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-rutas',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule,
    MatButtonModule, MatIconModule, MatSelectModule, MatDatepickerModule, MatCardModule
  ],
  templateUrl: './rutas.component.html',
  styleUrls: ['./rutas.component.css']
})
export class RutasComponent implements OnInit {
  rutaForm: FormGroup;
  tiposDeRuta = ['Mantenimiento Preventivo', 'Instalación de Sistema', 'Entrega de Insumos', 'Visita de Venta'];
  tecnicos = ['Juan Pérez', 'María Rodríguez', 'Carlos Sánchez'];

  constructor(private fb: FormBuilder) {
    this.rutaForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(5)]],
      tipoRuta: ['', Validators.required],
      fechaAsignada: ['', Validators.required],
      tecnicoAsignado: ['', Validators.required],
      paradas: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.agregarParada();
  }

  get paradas() { return this.rutaForm.get('paradas') as FormArray; }

  nuevaParada(): FormGroup {
    return this.fb.group({
      cliente: ['', Validators.required],
      direccion: ['', Validators.required],
      servicio: ['', Validators.required]
    });
  }

  agregarParada() { this.paradas.push(this.nuevaParada()); }
  eliminarParada(index: number) { this.paradas.removeAt(index); }

  onSubmit() {
    if (this.rutaForm.valid) {
      console.log('Ruta a Guardar:', this.rutaForm.value);
      alert('¡Ruta guardada con éxito!');
    } else {
      alert('El formulario contiene errores.');
      this.rutaForm.markAllAsTouched();
    }
  }
}
