// import {
//   Component,
//   ViewChild,
//   ElementRef,
//   inject,
//   PLATFORM_ID,
// } from '@angular/core';
// import { isPlatformBrowser, CommonModule } from '@angular/common'; // <-- Importaciones actualizadas
// import { MatButtonModule } from '@angular/material/button';
// import { MatDividerModule } from '@angular/material/divider';
// import * as faceapi from 'face-api.js';
// import { AuthService } from '../../services/auth/auth.service';

// @Component({
//   selector: 'app-profile',
//   standalone: true,
//   imports: [CommonModule, MatButtonModule, MatDividerModule],
//   templateUrl: './profile.component.html',
//   styleUrls: ['./profile.component.css'],
// })
// export class ProfileComponent {
//   @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
//   @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;

//   // Inyección de servicios y tokens
//   private readonly authService = inject(AuthService);
//   private readonly platformId = inject(PLATFORM_ID); // <-- Inyectamos el PLATFORM_ID

//   public statusMessage: string = '';
//   public isCameraOn = false;
//   private videoStream?: MediaStream;

//   async activateFacialLogin(): Promise<void> {
//     // --- CAMBIO CLAVE AQUÍ ---
//     // Comprobamos si estamos en el navegador antes de hacer nada.
//     if (!isPlatformBrowser(this.platformId)) {
//       this.statusMessage =
//         'La activación facial solo está disponible en el navegador.';
//       return;
//     }

//     this.isCameraOn = true;
//     this.statusMessage = 'Cargando modelos de IA, por favor espera...';

//     await Promise.all([
//       faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models'),
//       faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models'),
//       faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models'),
//     ]);

//     this.startCamera();
//   }

//   private async startCamera(): Promise<void> {
//     if (!this.videoElement) return;

//     try {
//       this.videoStream = await navigator.mediaDevices.getUserMedia({
//         video: true,
//       });
//       this.videoElement.nativeElement.srcObject = this.videoStream;
//       this.statusMessage = 'Cámara activada. Mira fijamente a la cámara.';
//       this.videoElement.nativeElement.onplaying = () => this.captureFace();
//     } catch (err) {
//       this.statusMessage = 'Error al acceder a la cámara. Revisa los permisos.';
//       this.isCameraOn = false;
//     }
//   }

//   private async captureFace(): Promise<void> {
//     if (!this.videoElement || !this.canvasElement) return;

//     this.statusMessage = 'Detectando rostro...';

//     const displaySize = {
//       width: this.videoElement.nativeElement.videoWidth,
//       height: this.videoElement.nativeElement.videoHeight,
//     };
//     faceapi.matchDimensions(this.canvasElement.nativeElement, displaySize);

//     const detectionInterval = setInterval(async () => {
//       const detection = await faceapi
//         .detectSingleFace(
//           this.videoElement!.nativeElement,
//           new faceapi.TinyFaceDetectorOptions()
//         )
//         .withFaceLandmarks()
//         .withFaceDescriptor();

//       if (detection) {
//         clearInterval(detectionInterval);
//         this.statusMessage = '¡Rostro detectado! Guardando en tu perfil...';
//         this.stopCamera();

//         const descriptorArray = Array.from(detection.descriptor);

//         this.authService.registerFace(descriptorArray).subscribe({
//           next: (response) => {
//             this.statusMessage = `${response.message} ¡Ya puedes usar el login facial!`;
//             this.isCameraOn = false;
//           },
//           error: (err) => {
//             this.statusMessage =
//               'Error al guardar el rostro. Puede que tu sesión haya expirado. Inténtalo de nuevo.';
//             this.isCameraOn = false;
//           },
//         });
//       }
//     }, 500);
//   }

//   private stopCamera(): void {
//     this.videoStream?.getTracks().forEach((track) => track.stop());
//   }
// }



// src/app/pages/profile/profile.component.ts
import { Component, OnInit, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth/auth.service';

// Validador personalizado para asegurar que las contraseñas coincidan
export const passwordMatchValidator: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const newPassword = control.get('newPassword');
  const confirmPassword = control.get('confirmPassword');
  return newPassword && confirmPassword && newPassword.value !== confirmPassword.value
    ? { passwordMismatch: true }
    : null;
};

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  public passwordForm!: FormGroup;
  public successMessage: string | null = null;
  public errorMessage: string | null = null;
  public hideCurrentPassword = true;
  public hideNewPassword = true;
  public hideConfirmPassword = true;

  ngOnInit(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    }, { validators: passwordMatchValidator });
  }

  onSubmit(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.successMessage = null;
    this.errorMessage = null;

    const { currentPassword, newPassword } = this.passwordForm.value;

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.passwordForm.reset(); // Limpia el formulario
        // Resetea los validadores para que el formulario vuelva a su estado inicial
        Object.keys(this.passwordForm.controls).forEach(key => {
          this.passwordForm.get(key)?.setErrors(null) ;
        });
      },
      error: (err) => {
        this.errorMessage = err.error.message || 'Ocurrió un error al cambiar la contraseña.';
      }
    });
  }
}