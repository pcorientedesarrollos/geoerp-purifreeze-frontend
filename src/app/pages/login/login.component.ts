import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import * as faceapi from 'face-api.js';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement!: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement!: ElementRef<HTMLCanvasElement>;

  public statusMessage: string = 'Cargando modelos de IA...';
  private videoStream?: MediaStream;
  private detectionInterval: any;

  async ngOnInit(): Promise<void> {
    await this.loadModels();
    this.startCamera();
  }

  ngOnDestroy(): void {
    // Detener la cámara y el intervalo al destruir el componente
    this.stopCamera();
    if (this.detectionInterval) {
      clearInterval(this.detectionInterval);
    }
  }

  private async loadModels(): Promise<void> {
    // Los modelos deben estar en tu carpeta /assets/models
    // Debes descargarlos del repositorio de face-api.js
    await faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models');
    this.statusMessage = 'Modelos cargados. Iniciando cámara...';
  }

  private async startCamera(): Promise<void> {
    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: {},
      });
      this.videoElement.nativeElement.srcObject = this.videoStream;
      this.statusMessage = 'Cámara iniciada. ¡Sonríe!';

      this.videoElement.nativeElement.onplaying = () => {
        this.startFaceDetection();
      };
    } catch (err) {
      this.statusMessage = 'Error al acceder a la cámara.';
      console.error('Error al acceder a la cámara:', err);
    }
  }

  private stopCamera(): void {
    this.videoStream?.getTracks().forEach((track) => track.stop());
  }

  private startFaceDetection(): void {
    const displaySize = {
      width: this.videoElement.nativeElement.videoWidth,
      height: this.videoElement.nativeElement.videoHeight,
    };
    faceapi.matchDimensions(this.canvasElement.nativeElement, displaySize);

    this.detectionInterval = setInterval(async () => {
      const detections = await faceapi
        .detectSingleFace(
          this.videoElement.nativeElement,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptor();

      const context = this.canvasElement.nativeElement.getContext('2d');
      if (!context) return;
      context.clearRect(0, 0, displaySize.width, displaySize.height);

      if (detections) {
        // Dibujar un recuadro alrededor del rostro detectado
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        faceapi.draw.drawDetections(
          this.canvasElement.nativeElement,
          resizedDetections
        );

        // Aquí es donde realizarías el login
        this.statusMessage = 'Rostro detectado. Verificando...';
        this.attemptLogin(detections.descriptor);
        clearInterval(this.detectionInterval); // Detenemos la detección tras un intento
      }
    }, 500); // Revisa cada medio segundo
  }

  private attemptLogin(descriptor: Float32Array): void {
    // 1. Detener la cámara para que el usuario sepa que algo pasó
    this.stopCamera();

    // 2. En un proyecto real, enviarías esto al backend
    console.log('Descriptor facial para enviar al backend:', descriptor);
    this.statusMessage = 'Enviando datos al servidor...';

    // ---- LÓGICA DE BACKEND (SIMULADA) ----
    // fetch('/api/auth/login-facial', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ descriptor: Array.from(descriptor) })
    // }).then(res => res.json()).then(result => {
    //   if (result.isAuthenticated) {
    //     // Guardar el token JWT y redirigir al dashboard
    //     this.statusMessage = `¡Bienvenido, ${result.userName}!`;
    //     // this.router.navigate(['/dashboard']);
    //   } else {
    //     this.statusMessage = 'Usuario no reconocido. Intenta con contraseña.';
    //   }
    // });
  }

  switchToPasswordLogin(): void {
    // Aquí navegarías a una vista de login con campos de usuario/contraseña
    console.log('Cambiando a login con contraseña');
  }
}
