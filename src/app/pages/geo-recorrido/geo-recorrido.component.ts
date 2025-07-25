import { CommonModule, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { GeoRecorrido } from '../../interfaces/geo-recorrido';
import { GeoRecorridoService } from '../../services/geo-recorrido/geo-recorrido.service';

@Component({
  selector: 'app-geo-recorrido',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    DatePipe,
  ],
  templateUrl: './geo-recorrido.component.html',
  styleUrl: './geo-recorrido.component.css',
})
export class GeoRecorridoComponent {
  private fb = inject(FormBuilder);
  private recorridoService = inject(GeoRecorridoService);
  private snackBar = inject(MatSnackBar);

  recorridos = signal<GeoRecorrido[]>([]);

  displayedColumns: string[] = [
    'idRecorrido',
    'idRuta', // CORREGIDO
    'latitud',
    'longitud',
    'fechaHora',
    'acciones',
  ];

  dataSource = computed(() => new MatTableDataSource(this.recorridos()));

  recorridoForm: FormGroup;

  constructor() {
    this.recorridoForm = this.fb.group({
      idRuta: ['', [Validators.required, Validators.pattern(/^[0-9]+$/)]], // CORREGIDO
      latitud: [
        '',
        [
          Validators.required,
          Validators.pattern(/^-?[0-9]{1,3}(\.[0-9]{1,8})?$/),
        ],
      ],
      longitud: [
        '',
        [
          Validators.required,
          Validators.pattern(/^-?[0-9]{1,3}(\.[0-9]{1,8})?$/),
        ],
      ],
    });
  }

  ngOnInit(): void {
    this.loadRecorridos();
  }

  loadRecorridos(): void {
    this.recorridoService.getRecorridos().subscribe({
      next: (data) => this.recorridos.set(data),
      error: (err) => this.showError('Error al cargar los registros.'),
    });
  }

  onSubmit(): void {
    if (this.recorridoForm.invalid) {
      this.showError('Formulario inválido. Por favor, revise los campos.');
      return;
    }
    this.recorridoService.addRecorrido(this.recorridoForm.value).subscribe({
      next: () => {
        this.showSuccess('Registro agregado con éxito.');
        this.recorridoForm.reset();
        this.loadRecorridos();
      },
      error: (err) => this.showError('Error al agregar el registro.'),
    });
  }

  onDelete(id: number): void {
    if (confirm('¿Está seguro de que desea eliminar este registro?')) {
      this.recorridoService.deleteRecorrido(id).subscribe({
        next: () => {
          this.showSuccess('Registro eliminado con éxito.');
          this.loadRecorridos();
        },
        error: (err) => this.showError('Error al eliminar el registro.'),
      });
    }
  }

  private showSuccess(message: string): void {
    /* ... */
  }
  private showError(message: string): void {
    /* ... */
  }
}
