import { GeoRutasParada } from './geo-rutas-parada';

export enum RutaStatus {
  PLANEADA = 'PLANEADA',
  EN_CURSO = 'EN_CURSO',
  FINALIZADA = 'FINALIZADA',
  CANCELADA = 'CANCELADA',
}

export interface GeoRutas {
  idRuta: number;
  idUsuario: number;
  idUnidadTransporte: number;
  fechaHora: Date | string;
  kmInicial?: string;
  duracionMinutos?: number;
  statusRuta: RutaStatus; // <--- AÑADIR ESTA LÍNEA

  distanciaTotalKm?: number; // ¡NUEVO!
  consumoEstimadoLitros?: number; // ¡NUEVO!

  detalles: any[];
  usuario: {
    idUsuario: number;
    usuario: string; // Este es el nombre que mostraremos
  };
  unidadTransporte: {
    idUnidadTransporte: number;
    nombreUnidad: string; // Este es el nombre que mostraremos
  };

  // Asumiendo que `detalles` viene en la respuesta
}

export interface CreateGeoRutaPayload {
  idUsuario: number;
  idUnidadTransporte: number;
  kmInicial: string;
}
