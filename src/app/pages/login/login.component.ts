import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy,
  inject,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common'; // <-- Importaciones actualizadas
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import * as faceapi from 'face-api.js';
import { AuthService, FaceLoginData } from '../../services/auth/auth.service';
// import { AuthService, FaceLoginData } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit, OnDestroy {
  @ViewChild('videoElement') videoElement?: ElementRef<HTMLVideoElement>;
  @ViewChild('canvasElement') canvasElement?: ElementRef<HTMLCanvasElement>;

  // Inyección de servicios y tokens
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID); // <-- Inyectamos el PLATFORM_ID

  public statusMessage: string = 'Iniciando...'; // Mensaje inicial genérico
  public loginMode: 'face' | 'password' = 'face';

  private videoStream?: MediaStream;
  private detectionInterval: any;
  private faceMatcher?: faceapi.FaceMatcher;

  async ngOnInit(): Promise<void> {
    // --- CAMBIO CLAVE AQUÍ ---
    // Solo ejecutamos la lógica de face-api si estamos en un navegador.
    if (isPlatformBrowser(this.platformId)) {
      await this.setupFaceApi();
    } else {
      this.statusMessage =
        'El reconocimiento facial solo está disponible en el navegador.';
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.stopCamera();
      if (this.detectionInterval) {
        clearInterval(this.detectionInterval);
      }
    }
  }

  // --- MÉTODOS DE CAMBIO DE MODO ---
  switchToPasswordLogin(): void {
    this.loginMode = 'password';
    if (isPlatformBrowser(this.platformId)) {
      this.stopCamera();
    }
  }

  switchToFaceLogin(): void {
    this.loginMode = 'face';
    // Usamos un pequeño delay para que la vista se renderice antes de iniciar la cámara
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => this.setupFaceApi(), 0);
    }
  }

  // --- LÓGICA DE RECONOCIMIENTO FACIAL ---
  private async setupFaceApi(): Promise<void> {
    this.statusMessage = 'Cargando modelos de IA...';
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri('/assets/models'),
      faceapi.nets.faceLandmark68Net.loadFromUri('/assets/models'),
      faceapi.nets.faceRecognitionNet.loadFromUri('/assets/models'),
    ]);

    this.statusMessage = 'Obteniendo datos de rostros...';
    await this.loadFaceLoginData();

    this.startCamera();
  }

  private async loadFaceLoginData(): Promise<void> {
    try {
      // Usamos .toPromise() que es más antiguo. En Angular moderno se usa lastValueFrom.
      const faceData = await (
        this.authService.getFaceLoginData() as any
      ).toPromise();
      if (!faceData || faceData.length === 0) {
        this.statusMessage = 'No hay rostros registrados. Usa tu contraseña.';
        this.faceMatcher = undefined; // Aseguramos que no haya un matcher antiguo
        return;
      }

      const labeledFaceDescriptors = faceData.map((data: FaceLoginData) => {
        const descriptorArray = JSON.parse(data.descriptor_facial);
        return new faceapi.LabeledFaceDescriptors(data.idUsuario.toString(), [
          new Float32Array(descriptorArray),
        ]);
      });

      this.faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.5);
      this.statusMessage = 'Listo para escanear.';
    } catch (error) {
      this.statusMessage =
        'Error al cargar datos de rostros desde el servidor.';
      console.error(error);
    }
  }

  private async startCamera(): Promise<void> {
    if (!this.videoElement) return;

    try {
      this.videoStream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });
      this.videoElement.nativeElement.srcObject = this.videoStream;
      this.videoElement.nativeElement.onplaying = () =>
        this.startFaceDetection();
    } catch (err) {
      this.statusMessage = 'Error al acceder a la cámara. Revisa los permisos.';
      console.error(err);
    }
  }

  private stopCamera(): void {
    this.videoStream?.getTracks().forEach((track) => track.stop());
  }

  private startFaceDetection(): void {
    if (!this.videoElement || !this.canvasElement) return;

    const displaySize = {
      width: this.videoElement.nativeElement.videoWidth,
      height: this.videoElement.nativeElement.videoHeight,
    };
    faceapi.matchDimensions(this.canvasElement.nativeElement, displaySize);

    this.detectionInterval = setInterval(async () => {
      if (!this.faceMatcher) return;

      const detections = await faceapi
        .detectAllFaces(
          this.videoElement!.nativeElement,
          new faceapi.TinyFaceDetectorOptions()
        )
        .withFaceLandmarks()
        .withFaceDescriptors();

      const context = this.canvasElement!.nativeElement.getContext('2d');
      if (!context) return;
      context.clearRect(0, 0, displaySize.width, displaySize.height);

      if (detections.length > 0) {
        const resizedDetections = faceapi.resizeResults(
          detections,
          displaySize
        );
        const results = resizedDetections.map((d) =>
          this.faceMatcher!.findBestMatch(d.descriptor)
        );

        results.forEach((result, i) => {
          const box = resizedDetections[i].detection.box;
          const drawBox = new faceapi.draw.DrawBox(box, {
            label:
              result.label === 'unknown' ? 'Desconocido' : 'Usuario reconocido',
          });
          drawBox.draw(this.canvasElement!.nativeElement);

          if (result.label !== 'unknown') {
            this.attemptLogin(parseInt(result.label, 10));
          }
        });
      }
    }, 300);
  }

  private attemptLogin(userId: number): void {
    if (!userId) return;

    this.statusMessage = '¡Usuario reconocido! Autenticando...';
    this.stopCamera();
    clearInterval(this.detectionInterval);

    this.authService.loginByUserId(userId).subscribe({
      next: (response) => {
        this.statusMessage = '¡Bienvenido!';
        localStorage.setItem('access_token', response.access_token);
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        this.statusMessage = 'Error de autenticación. Intenta con contraseña.';
        // Reiniciamos la cámara para un nuevo intento
        setTimeout(() => this.switchToFaceLogin(), 2000);
      },
    });
  }
}
